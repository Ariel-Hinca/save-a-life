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
}
