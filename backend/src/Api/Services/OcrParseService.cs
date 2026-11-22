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
        var normalized = text.Replace('\u00a0', ' ');
        var response = new OcrScanResponse
        {
            Confidence = clientConfidence ?? EstimateConfidence(normalized),
            DetectedLanguage = DetectLanguage(normalized)
        };

        response.DonationId = ExtractReference(normalized);
        response.DonationDate = ExtractDonationDate(normalized);
        response.DonationType = ExtractDonationType(normalized);
        response.Center = ExtractCenter(normalized);

        response.Hemoglobin = ExtractLabValue(normalized,
            @"Hemoglobine|Hémoglobine|Hemoglobin|Hb\b");
        response.Hemoglobin = NormalizeHemoglobin(response.Hemoglobin);

        response.Hematocrit = ExtractLabValue(normalized,
            @"Hematokriet|Hématocrite|Hematocrit|Hct\b");
        response.RedBloodCells = ExtractLabValue(normalized,
            @"Rode bloedcellen|Globules rouges|Red blood cells|Erythrocytes");
        response.WhiteBloodCells = ExtractLabValue(normalized,
            @"Witte bloedcellen|Globules blancs|White blood cells|Leucocytes");
        response.Platelets = ExtractLabValue(normalized,
            @"Bloedplaatjes|Plaquettes|Platelets|Thrombocytes");
        response.Ferritin = ExtractLabValue(normalized,
            @"Ferritine|Ferritin");

        if (Regex.IsMatch(normalized, @"hemoglobinegehalte bevindt zich onder|hémoglobine .* sous|hemoglobin .* below|onder de norm|sous la norme",
                RegexOptions.IgnoreCase | RegexOptions.Singleline))
        {
            response.Notes = "Hemoglobin below donation threshold — control required before next donation.";
        }

        // Confidence boost from structured Belgian fields
        var found = 0;
        if (!string.IsNullOrEmpty(response.DonationId)) found++;
        if (!string.IsNullOrEmpty(response.DonationDate)) found++;
        if (!string.IsNullOrEmpty(response.DonationType)) found++;
        if (!string.IsNullOrEmpty(response.Center)) found++;
        if (response.Hemoglobin is not null) found++;

        if (clientConfidence is null)
        {
            response.Confidence = Math.Min(99, 35 + found * 12);
        }
        else
        {
            response.Confidence = Math.Min(99, clientConfidence.Value + found * 2);
        }

        return response;
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
            @"(?:GIFT\s+VAN|DON\s+DU|DON\s+DE|Donation\s+(?:of|on)|bloedinzameling\s+van|collecte\s+du)\s+(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})",
            RegexOptions.IgnoreCase);
        if (gift.Success) return NormalizeDate(gift.Groups[1].Value);

        // Prefer dates near "28/10" style after gift context; else first solid date
        var dates = Regex.Matches(text, @"\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b");
        if (dates.Count > 0)
        {
            // Often letter date is last; donation date appears earlier near gift sentence
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
        // Prefer explicit donation-type wording over lab analyte names like "Bloedplaatjes".
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

    private static decimal? ExtractLabValue(string text, string labelPattern)
    {
        var match = Regex.Match(text,
            $@"(?:{labelPattern})\*?[\s:.\-]*([0-9]+(?:[.,][0-9]+)?)",
            RegexOptions.IgnoreCase);
        if (!match.Success) return null;

        var raw = match.Groups[1].Value.Replace(',', '.');
        if (decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        {
            return value;
        }
        return null;
    }

    /// <summary>
    /// OCR often drops the decimal for hemoglobin (12.2 → 122). Fix obvious cases.
    /// </summary>
    private static decimal? NormalizeHemoglobin(decimal? value)
    {
        if (value is null) return null;
        if (value is >= 30 and <= 250) return Math.Round(value.Value / 10m, 1);
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
        var cleaned = raw.Replace('.', '/').Replace('-', '/');
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
