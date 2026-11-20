namespace Api.DTOs;

public class StatsSummaryDto
{
    public int DonorLevel { get; set; }
    public int XP { get; set; }
    public int TotalDonations { get; set; }
    public int TotalLivesHelped { get; set; }
    public decimal TotalBloodVolumeLiters { get; set; }
    public DateTime? NextEligibleDonationDate { get; set; }
    public string? NextEligibleType { get; set; }
    public List<YearCountDto> DonationsPerYear { get; set; } = new();
    public List<TypeCountDto> DonationTypes { get; set; } = new();
    public List<VolumePointDto> VolumeOverTime { get; set; } = new();
    public List<AchievementProgressDto> Achievements { get; set; } = new();
}

public class YearCountDto
{
    public int Year { get; set; }
    public int Count { get; set; }
}

public class TypeCountDto
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class VolumePointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal CumulativeLiters { get; set; }
}

public class AchievementProgressDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Unlocked { get; set; }
    public DateTime? UnlockedAt { get; set; }
    public int ProgressPercent { get; set; }
}
