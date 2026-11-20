using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public class Donation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public DateTime DonationDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string DonationType { get; set; } = "Whole Blood";

    [MaxLength(200)]
    public string Location { get; set; } = string.Empty;

    public decimal Volume { get; set; }

    [MaxLength(100)]
    public string DonationReference { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = "Successful";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
