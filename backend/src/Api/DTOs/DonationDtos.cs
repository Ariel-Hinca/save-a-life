using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class DonationDto
{
    public Guid Id { get; set; }
    public DateTime DonationDate { get; set; }
    public string DonationType { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal Volume { get; set; }
    public string DonationReference { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateDonationRequest
{
    [Required]
    public DateTime DonationDate { get; set; }

    [Required]
    public string DonationType { get; set; } = "Whole Blood";

    public string Location { get; set; } = string.Empty;
    public decimal? Volume { get; set; }
    public string DonationReference { get; set; } = string.Empty;
    public string Status { get; set; } = "Successful";
}
