using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public class BloodResult
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public DateTime ResultDate { get; set; }

    public decimal? Hemoglobin { get; set; }
    public decimal? Ferritin { get; set; }

    [MaxLength(20)]
    public string? BloodPressure { get; set; }

    public decimal? Weight { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
