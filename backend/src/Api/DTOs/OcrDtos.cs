namespace Api.DTOs;

public class OcrScanRequest
{
    public string Text { get; set; } = string.Empty;
    public int? ClientConfidence { get; set; }
}

public class OcrExtractImageRequest
{
    /// <summary>Raw base64 or data-URL (data:image/jpeg;base64,...).</summary>
    public string ImageBase64 { get; set; } = string.Empty;
    public string? MimeType { get; set; }
    /// <summary>When true and Vision AI is not configured, return sample Belgian letter fields.</summary>
    public bool AllowDemoFallback { get; set; } = true;
}

public class OcrScanResponse
{
    public string DonationId { get; set; } = string.Empty;
    public string DonationDate { get; set; } = string.Empty;
    public string DonationType { get; set; } = string.Empty;
    public string Center { get; set; } = string.Empty;
    public int Confidence { get; set; }
    public string DetectedLanguage { get; set; } = string.Empty;
    public decimal? Hemoglobin { get; set; }
    public decimal? Hematocrit { get; set; }
    public decimal? RedBloodCells { get; set; }
    public decimal? WhiteBloodCells { get; set; }
    public decimal? Platelets { get; set; }
    public decimal? Ferritin { get; set; }
    public string? BloodPressure { get; set; }
    public decimal? Weight { get; set; }
    public string Notes { get; set; } = string.Empty;
    /// <summary>local-tesseract | regex</summary>
    public string ExtractionMethod { get; set; } = string.Empty;
    /// <summary>Raw OCR text for debugging / review.</summary>
    public string RawText { get; set; } = string.Empty;
}
