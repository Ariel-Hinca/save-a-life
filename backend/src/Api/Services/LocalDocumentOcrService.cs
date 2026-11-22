using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using Api.DTOs;

namespace Api.Services;

/// <summary>
/// Free, fully local document extraction: ImageMagick preprocess + Tesseract CLI.
/// No cloud APIs, no paid services — photos stay on this machine.
/// </summary>
public class LocalDocumentOcrService
{
    private readonly OcrParseService _ocrParseService;
    private readonly ILogger<LocalDocumentOcrService> _logger;

    public LocalDocumentOcrService(OcrParseService ocrParseService, ILogger<LocalDocumentOcrService> logger)
    {
        _ocrParseService = ocrParseService;
        _logger = logger;
    }

    public string ProviderName => "Local Tesseract + ImageMagick (NL/FR/EN) — free & private";

    public bool IsAvailable()
    {
        return CommandExists("tesseract") && (CommandExists("convert") || CommandExists("magick"));
    }

    public async Task<(OcrScanResponse Result, string RawText)> ExtractFromImageAsync(
        string imageBase64,
        string? mimeType,
        CancellationToken cancellationToken = default)
    {
        var bytes = DecodeImage(imageBase64);
        if (bytes.Length == 0)
        {
            throw new InvalidOperationException("Could not decode the uploaded image.");
        }

        if (bytes.Length > 8_000_000)
        {
            throw new InvalidOperationException("Image is too large. Use a photo under ~6 MB.");
        }

        var workDir = Path.Combine(Path.GetTempPath(), "rc-ocr-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workDir);

        try
        {
            var extension = GuessExtension(mimeType, imageBase64);
            var sourcePath = Path.Combine(workDir, "source" + extension);
            await File.WriteAllBytesAsync(sourcePath, bytes, cancellationToken);

            var candidates = new List<(int Angle, string Text, int Score)>();
            foreach (var angle in new[] { 0, 90, 180, 270 })
            {
                cancellationToken.ThrowIfCancellationRequested();
                var variantPath = Path.Combine(workDir, $"prep-{angle}.png");
                await PrepareVariantAsync(sourcePath, variantPath, angle, cancellationToken);
                var text = await RunTesseractAsync(variantPath, Path.Combine(workDir, $"out-{angle}"), cancellationToken);
                var score = ScoreBelgianDocument(text);
                candidates.Add((angle, text, score));
                _logger.LogInformation("OCR angle {Angle}° score={Score} chars={Chars}", angle, score, text.Length);
            }

            var best = candidates.OrderByDescending(c => c.Score).ThenByDescending(c => c.Text.Length).First();
            var parsed = _ocrParseService.Parse(best.Text, EstimateOcrConfidence(best.Text, best.Score));
            parsed.ExtractionMethod = "local-tesseract";
            parsed.Notes = MergeNotes(parsed.Notes, best.Angle, best.Score);
            return (parsed, best.Text);
        }
        finally
        {
            try { Directory.Delete(workDir, recursive: true); } catch { /* ignore cleanup errors */ }
        }
    }

    private static async Task PrepareVariantAsync(
        string sourcePath,
        string outputPath,
        int angle,
        CancellationToken cancellationToken)
    {
        // Deskew-ish enhance: colorspace gray, contrast-stretch, mild sharpen, optional rotate, cap width.
        var args = new List<string>
        {
            sourcePath,
            "-colorspace", "Gray",
            "-contrast-stretch", "2%x2%",
            "-sharpen", "0x1",
            "-resize", "2200x2200>",
        };

        if (angle != 0)
        {
            args.AddRange(["-rotate", angle.ToString()]);
        }

        args.AddRange(["-density", "300", outputPath]);

        await RunProcessAsync("convert", args, cancellationToken);
    }

    private async Task<string> RunTesseractAsync(
        string imagePath,
        string outBase,
        CancellationToken cancellationToken)
    {
        var text = await InvokeTesseractAsync(imagePath, outBase + "-6", "6", cancellationToken);
        if (ScoreBelgianDocument(text) >= 30)
        {
            return text;
        }

        var alt = await InvokeTesseractAsync(imagePath, outBase + "-4", "4", cancellationToken);
        return ScoreBelgianDocument(alt) > ScoreBelgianDocument(text) ? alt : text;
    }

    private async Task<string> InvokeTesseractAsync(
        string imagePath,
        string outBase,
        string psm,
        CancellationToken cancellationToken)
    {
        var args = new List<string>
        {
            imagePath,
            outBase,
            "-l", "nld+fra+eng",
            "--psm", psm,
            "--oem", "1"
        };

        // Do not set TESSDATA_PREFIX — Ubuntu packages resolve langs from the default tessdata path.
        var (exitCode, _, stderr) = await RunProcessAsync("tesseract", args, cancellationToken);

        var txtPath = outBase + ".txt";
        if (!File.Exists(txtPath))
        {
            _logger.LogWarning("Tesseract exit={Exit} stderr={Stderr}", exitCode, Truncate(stderr, 300));
            return string.Empty;
        }

        return await File.ReadAllTextAsync(txtPath, Encoding.UTF8, cancellationToken);
    }

    private static async Task<(int ExitCode, string Stdout, string Stderr)> RunProcessAsync(
        string fileName,
        List<string> args,
        CancellationToken cancellationToken,
        Dictionary<string, string>? env = null)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        foreach (var arg in args) psi.ArgumentList.Add(arg);
        if (env is not null)
        {
            foreach (var (key, value) in env)
            {
                psi.Environment[key] = value;
            }
        }

        using var process = Process.Start(psi)
            ?? throw new InvalidOperationException($"Failed to start {fileName}.");

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        return (process.ExitCode, await stdoutTask, await stderrTask);
    }

    private static bool CommandExists(string name)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "which",
                Arguments = name,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var process = Process.Start(psi);
            if (process is null) return false;
            process.WaitForExit(3000);
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    private static byte[] DecodeImage(string imageBase64)
    {
        var value = imageBase64.Trim();
        if (value.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var comma = value.IndexOf(',');
            if (comma > 0) value = value[(comma + 1)..];
        }

        try
        {
            return Convert.FromBase64String(value);
        }
        catch (FormatException)
        {
            return [];
        }
    }

    private static string GuessExtension(string? mimeType, string raw)
    {
        var mime = mimeType ?? string.Empty;
        if (raw.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var semi = raw.IndexOf(';');
            if (semi > 5) mime = raw[5..semi];
        }

        return mime.ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            _ => ".jpg"
        };
    }

    private static int ScoreBelgianDocument(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        var score = Math.Min(25, text.Length / 40);
        if (ContainsAny(text, "Beste Donor", "Cher Donneur", "Dear Donor")) score += 20;
        if (ContainsAny(text, "Hemoglobine", "Hémoglobine", "Hemoglobin", "Hemogloblne", "Hemoglob")) score += 18;
        if (ContainsAny(text, "Hematokriet", "Hématocrite", "Hematocrit")) score += 12;
        if (ContainsAny(text, "GIFT VAN", "DON DU", "DON DE")) score += 15;
        if (ContainsAny(text, "Rode Kruis", "Croix-Rouge", "Red Cross", "Service du Sang")) score += 12;
        if (ContainsAny(text, "Ref", "Bloedplaatjes", "Plaquettes", "Ferritine", "Rode bloedcellen")) score += 8;
        if (Regex.IsMatch(text, @"\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}")) score += 8;
        return score;
    }

    private static bool ContainsAny(string text, params string[] needles) =>
        needles.Any(n => text.Contains(n, StringComparison.OrdinalIgnoreCase));

    private static int EstimateOcrConfidence(string text, int score) =>
        Math.Clamp(35 + score / 2 + Math.Min(20, text.Length / 80), 0, 96);

    private static string MergeNotes(string existing, int angle, int score)
    {
        var tip = angle == 0
            ? string.Empty
            : $"Auto-rotated {angle}° for readability. ";
        if (score < 35)
        {
            tip += "Low document match — photograph the FULL letter (logo + GIFT VAN date + lab table), bright light, steady hand.";
        }

        if (string.IsNullOrWhiteSpace(existing)) return tip.Trim();
        if (string.IsNullOrWhiteSpace(tip)) return existing;
        return $"{existing} {tip}".Trim();
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max] + "…";
}
