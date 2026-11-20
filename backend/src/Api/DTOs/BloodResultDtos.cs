using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class BloodResultDto
{
    public Guid Id { get; set; }
    public DateTime ResultDate { get; set; }
    public decimal? Hemoglobin { get; set; }
    public decimal? Ferritin { get; set; }
    public string? BloodPressure { get; set; }
    public decimal? Weight { get; set; }
}

public class CreateBloodResultRequest
{
    [Required]
    public DateTime ResultDate { get; set; }

    public decimal? Hemoglobin { get; set; }
    public decimal? Ferritin { get; set; }
    public string? BloodPressure { get; set; }
    public decimal? Weight { get; set; }
}
