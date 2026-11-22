using System.Globalization;
using System.Text.RegularExpressions;
using Api.DTOs;

namespace Api.Services;

public class OcrParseService
{
    private static readonly (string Pattern, string Center)[] Centers =
    [
        ("Bruxelles|Brussel|Brussels", "Brussels"),
        ("Leuven|Louvain", "Leuven"),
        ("Antwerpen|Anvers|Antwerp", "Antwerp"),
        ("Gent|Gand|Ghent", "Ghent"),
        ("Brugge|Bruges", "Bruges"),
        ("Liège|Liege|Luik", "Liège"),
        ("Namur|Namen|Suarlée|Suarlee", "Namur"),
        ("Charleroi", "Charleroi"),
        ("Mons|Bergen", "Mons"),
        ("Uccle|Ukkel", "Brussels"),
    ];

    public OcrScanResponse Parse(string text, int? clientConfidence = null)
    {
        text ??= string.Empty;
        var normalized = NormalizeOcrNoise(text);
        var response = new OcrScanResponse
        {
            Confidence = clientConfidence ?? EstimateConfidence(normalized),
            DetectedLanguage = DetectLanguage(normalized)
        };

        response.DonationId = ExtractReference(normalized);
        response.DonationDate = ExtractDonationDate(normalized);
        response.DonationType = ExtractDonationType(normalized);
        response.Center = ExtractCenter(normalized);

        response.Hemoglobin = NormalizeHemoglobin(ExtractLabValue(normalized,
            @"Hemoglob(?:ine|lne|me)|Hémoglobine|Hemoglobin|\bHb\b",
            unitHints: ["g/dL", "g/dl", "g/L"]));

        response.Hematocrit = NormalizeHematocrit(ExtractLabValue(normalized,
            @"Hematokriet|Hématocrite|Hematocrit|\bHct\b",
            unitHints: ["%"]));

        response.RedBloodCells = NormalizeBloodCount(ExtractLabValue(normalized,
            @"Rode bloedcellen|Globules rouges|Red blood cells|Erythrocytes"), scaleIfLarge: 100m);

        response.WhiteBloodCells = NormalizeBloodCount(ExtractLabValue(normalized,
            @"W(?:itte|te)\s+bloedcellen|Globules blancs|White blood cells|Leucocytes"), scaleIfLarge: 10m);

        response.Platelets = ExtractLabValue(normalized,
            @"Bloedplaatjes|Plaquettes|Platelets|Thrombocytes");

        response.Ferritin = ExtractLabValue(normalized,
            @"Ferritine|Ferritin");

        if (Regex.IsMatch(normalized,
                @"hemoglobinegehalte bevindt zich onder|hémoglobine .* sous|hemoglobin .* below|onder de norm|sous la norme",
                RegexOptions.IgnoreCase | RegexOptions.Singleline))
        {
            response.Notes = "Hemoglobin below donation threshold — control required before next donation.";
        }

        var found = 0;
        if (!string.IsNullOrEmpty(response.DonationId)) found++;
        if (!string.IsNullOrEmpty(response.DonationDate)) found++;
        if (!string.IsNullOrEmpty(response.DonationType)) found++;
        if (!string.IsNullOrEmpty(response.Center)) found++;
        if (response.Hemoglobin is not null) found++;
        if (response.Hematocrit is not null) found++;

        if (clientConfidence is null)
        {
            response.Confidence = Math.Min(99, 35 + found * 10);
        }
        else
        {
            response.Confidence = Math.Min(99, clientConfidence.Value + found * 2);
        }

        return response;
    }

    /// <summary>Fix common Tesseract misreads on Belgian Red Cross letters.</summary>
    private static string NormalizeOcrNoise(string text)
    {
        var normalized = text.Replace('\u00a0', ' ');
        normalized = Regex.Replace(normalized, @"\bWte\b", "Witte", RegexOptions.IgnoreCase);
        normalized = Regex.Replace(normalized, @"Hemogloblne", "Hemoglobine", RegexOptions.IgnoreCase);
        normalized = Regex.Replace(normalized, @"Hematokr[il]et", "Hematokriet", RegexOptions.IgnoreCase);
        normalized = Regex.Replace(normalized, @"G[Il]FT\s+VAN", "GIFT VAN", RegexOptions.IgnoreCase);
        return normalized;
    }

    private static string ExtractReference(string text)
    {
        var refMatch = Regex.Match(text,
            @"Ref\.?\s*[:.]?\s*(\d{5,})\s*/\s*([A-Z0-9]+)",
            RegexOptions.IgnoreCase);
        if (refMatch.Success)
        {
            return $"{refMatch.Groups[1].Value}/{refMatch.Groups[2].Value}";
        }

        // OCR sometimes drops "Ref" but keeps 1048491 /B0201...
        var loose = Regex.Match(text, @"\b(\d{6,8})\s*/\s*(B[A-Z0-9]{10,})", RegexOptions.IgnoreCase);
        if (loose.Success)
        {
            return $"{loose.Groups[1].Value}/{loose.Groups[2].Value.ToUpperInvariant()}";
        }

        var barcode = Regex.Match(text, @"\b(B\d{12,})\b", RegexOptions.IgnoreCase);
        if (barcode.Success) return barcode.Groups[1].Value.ToUpperInvariant();

        var don = Regex.Match(text, @"\b(DON[-\s]?\d{4}[-\s]?\d+)\b", RegexOptions.IgnoreCase);
        if (don.Success)
        {
            return Regex.Replace(don.Groups[1].Value.ToUpperInvariant(), @"\s+", "-")
                .Replace("--", "-");
        }

        return string.Empty;
    }

    private static string ExtractDonationDate(string text)
    {
        var gift = Regex.Match(text,
            @"(?:GIFT\s+VAN|DON\s+DU|DON\s+DE|Donation\s+(?:of|on)|bloedinzameling\s+van|collecte\s+du)\s+(\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4})",
            RegexOptions.IgnoreCase);
        if (gift.Success) return NormalizeDate(gift.Groups[1].Value);

        var dates = Regex.Matches(text, @"\b(\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4})\b");
        if (dates.Count > 0)
        {
            foreach (Match m in dates)
            {
                var idx = m.Index;
                var window = text.Substring(Math.Max(0, idx - 40), Math.Min(80, text.Length - Math.Max(0, idx - 40)));
                if (Regex.IsMatch(window, @"GIFT|DON |bloedinzameling|collecte|deelname|participation", RegexOptions.IgnoreCase))
                {
                    return NormalizeDate(m.Groups[1].Value);
                }
            }
            return NormalizeDate(dates[0].Groups[1].Value);
        }

        return string.Empty;
    }

    private static string ExtractDonationType(string text)
    {
        if (Regex.IsMatch(text,
                @"donatie\s+van\s+bloedplaatjes|don\s+de\s+plaquette|platelet\s+donat|aplasmaferese|plasmapheresis",
                RegexOptions.IgnoreCase))
            return "Platelets";

        if (Regex.IsMatch(text,
                @"plasadonatie|don\s+de\s+plasma|plasma\s+donat|\bplasmaferese\b",
                RegexOptions.IgnoreCase))
            return "Plasma";

        if (Regex.IsMatch(text,
                @"GIFT VAN|DON DU|DON DE|volbloed|sang total|whole blood|bloedinzameling|collecte de sang|bloedstaaltjes|échantillons",
                RegexOptions.IgnoreCase))
            return "Whole Blood";

        return "Whole Blood";
    }

    private static string ExtractCenter(string text)
    {
        foreach (var (pattern, center) in Centers)
        {
            if (Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
            {
                return center;
            }
        }
        return string.Empty;
    }

    private static decimal? ExtractLabValue(string text, string labelPattern, string[]? unitHints = null)
    {
        var label = Regex.Match(text, labelPattern, RegexOptions.IgnoreCase);
        if (!label.Success) return null;

        var start = label.Index;
        var len = Math.Min(140, text.Length - start);
        var window = text.Substring(start, len);

        // Prefer value glued to a unit (12.2 g/dL, 40 %).
        if (unitHints is { Length: > 0 })
        {
            foreach (var hint in unitHints)
            {
                var escaped = Regex.Escape(hint);
                var unitMatch = Regex.Match(window,
                    $@"([0-9]+(?:[.,][0-9]+)?)\s*{escaped}",
                    RegexOptions.IgnoreCase);
                if (unitMatch.Success &&
                    decimal.TryParse(unitMatch.Groups[1].Value.Replace(',', '.'),
                        NumberStyles.Number, CultureInfo.InvariantCulture, out var unitValue))
                {
                    return unitValue;
                }
            }
        }

        // Otherwise take first number that is not the start of a reference range (12.0-16.0).
        foreach (Match m in Regex.Matches(window, @"([0-9]+(?:[.,][0-9]+)?)"))
        {
            var after = window.Substring(m.Index + m.Length, Math.Min(3, window.Length - (m.Index + m.Length)));
            if (Regex.IsMatch(after, @"^\s*[-–—]")) continue;
            if (decimal.TryParse(m.Groups[1].Value.Replace(',', '.'),
                    NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                return value;
            }
        }

        return null;
    }

    private static decimal? NormalizeHemoglobin(decimal? value)
    {
        if (value is null) return null;
        if (value is >= 30 and <= 250) return Math.Round(value.Value / 10m, 1);
        if (value is < 5 or > 25) return null;
        return value;
    }

    private static decimal? NormalizeHematocrit(decimal? value)
    {
        if (value is null) return null;
        // OCR sometimes reads 400 for 40.0
        if (value is >= 200 and <= 600) return Math.Round(value.Value / 10m, 1);
        if (value is < 20 or > 65) return null;
        return value;
    }

    private static decimal? NormalizeBloodCount(decimal? value, decimal scaleIfLarge)
    {
        if (value is null) return null;
        if (value >= scaleIfLarge) return Math.Round(value.Value / scaleIfLarge, 2);
        return value;
    }

    private static string DetectLanguage(string text)
    {
        if (Regex.IsMatch(text, @"Beste Donor|Hartelijk bedankt|bloedinzameling|Hemoglobine|Hematokriet", RegexOptions.IgnoreCase))
            return "nl";
        if (Regex.IsMatch(text, @"Cher Donneur|Madame|Monsieur|collecte|Hémoglobine|Hématocrite", RegexOptions.IgnoreCase))
            return "fr";
        return "en";
    }

    private static string NormalizeDate(string raw)
    {
        var cleaned = Regex.Replace(raw, @"\s+", "").Replace('.', '/').Replace('-', '/');
        var formats = new[] { "dd/MM/yyyy", "d/M/yyyy", "dd/MM/yy", "d/M/yy" };
        if (DateTime.TryParseExact(cleaned, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
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
        return Math.Min(90, 30 + text.Length / 25);
    }
}
