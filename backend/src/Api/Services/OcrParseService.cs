using System.Globalization;
using System.Text.RegularExpressions;
using Api.DTOs;

namespace Api.Services;

public class OcrParseService
{
    private static readonly string[] Centers = ["Brussels", "Leuven", "Antwerp", "Ghent", "Bruges", "Liège", "Namur", "Charleroi"];

    public OcrScanResponse Parse(string text, int? clientConfidence = null)
    {
        text ??= string.Empty;
        var response = new OcrScanResponse
        {
            Confidence = clientConfidence ?? EstimateConfidence(text)
        };

        var idMatch = Regex.Match(text, @"DON[-\s]?(\d{4})[-\s]?(\d{3,})", RegexOptions.IgnoreCase);
        if (idMatch.Success)
        {
            response.DonationId = $"DON-{idMatch.Groups[1].Value}-{idMatch.Groups[2].Value}";
        }
        else
        {
            var alt = Regex.Match(text, @"\b(DON-\d{4}-\d+)\b", RegexOptions.IgnoreCase);
            if (alt.Success) response.DonationId = alt.Groups[1].Value.ToUpperInvariant();
        }

        var dateMatch = Regex.Match(text, @"\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b");
        if (dateMatch.Success)
        {
            response.DonationDate = NormalizeDate(dateMatch.Groups[1].Value);
        }

        if (Regex.IsMatch(text, @"platelet", RegexOptions.IgnoreCase))
        {
            response.DonationType = "Platelets";
        }
        else if (Regex.IsMatch(text, @"plasma", RegexOptions.IgnoreCase))
        {
            response.DonationType = "Plasma";
        }
        else if (Regex.IsMatch(text, @"whole\s*blood|sang\s*total|volbloed", RegexOptions.IgnoreCase))
        {
            response.DonationType = "Whole Blood";
        }
        else if (!string.IsNullOrEmpty(response.DonationId) || !string.IsNullOrEmpty(response.DonationDate))
        {
            response.DonationType = "Whole Blood";
        }

        foreach (var center in Centers)
        {
            if (Regex.IsMatch(text, $@"\b{Regex.Escape(center)}\b", RegexOptions.IgnoreCase))
            {
                response.Center = center;
                break;
            }
        }

        // Boost confidence when multiple fields are found
        var found = 0;
        if (!string.IsNullOrEmpty(response.DonationId)) found++;
        if (!string.IsNullOrEmpty(response.DonationDate)) found++;
        if (!string.IsNullOrEmpty(response.DonationType)) found++;
        if (!string.IsNullOrEmpty(response.Center)) found++;

        if (clientConfidence is null)
        {
            response.Confidence = Math.Min(99, 40 + found * 15);
        }

        return response;
    }

    private static string NormalizeDate(string raw)
    {
        var formats = new[] { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d-M-yyyy", "dd.MM.yyyy", "dd/MM/yy", "d/M/yy" };
        if (DateTime.TryParseExact(raw.Replace('.', '/').Replace('-', '/'),
                formats.Select(f => f.Replace('.', '/').Replace('-', '/')).ToArray(),
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var dt))
        {
            return dt.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        }

        if (DateTime.TryParse(raw, new CultureInfo("fr-BE"), DateTimeStyles.None, out dt) ||
            DateTime.TryParse(raw, new CultureInfo("nl-BE"), DateTimeStyles.None, out dt))
        {
            return dt.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        }

        return raw;
    }

    private static int EstimateConfidence(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return Math.Min(90, 30 + text.Length / 20);
    }
}
