namespace Api.DTOs;

public class OcrScanRequest
{
    public string Text { get; set; } = string.Empty;
    public int? ClientConfidence { get; set; }
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
}
