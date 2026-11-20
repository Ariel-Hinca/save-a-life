using Api.Models;

namespace Api.Services;

public class EligibilityService
{
    private static readonly Dictionary<string, int> IntervalsDays = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Whole Blood"] = 120,
        ["Plasma"] = 14,
        ["Platelets"] = 14
    };

    public static readonly Dictionary<string, decimal> DefaultVolumesMl = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Whole Blood"] = 450m,
        ["Plasma"] = 600m,
        ["Platelets"] = 250m
    };

    public static readonly Dictionary<string, int> LivesImpact = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Whole Blood"] = 3,
        ["Plasma"] = 1,
        ["Platelets"] = 2
    };

    public static readonly Dictionary<string, int> XpRewards = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Whole Blood"] = 100,
        ["Plasma"] = 150,
        ["Platelets"] = 200
    };

    public (DateTime? NextDate, string? Type) GetNextEligible(IEnumerable<Donation> donations)
    {
        var successful = donations
            .Where(d => string.Equals(d.Status, "Successful", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (successful.Count == 0)
        {
            return (DateTime.UtcNow.Date, "Whole Blood");
        }

        DateTime? soonest = null;
        string? type = null;

        foreach (var group in successful.GroupBy(d => NormalizeType(d.DonationType)))
        {
            var last = group.Max(d => d.DonationDate);
            var interval = IntervalsDays.GetValueOrDefault(group.Key, 120);
            var eligible = last.Date.AddDays(interval);
            if (soonest is null || eligible < soonest)
            {
                soonest = eligible;
                type = group.Key;
            }
        }

        return (soonest, type);
    }

    public static string NormalizeType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return "Whole Blood";
        }

        var t = type.Trim();
        if (t.Contains("plasma", StringComparison.OrdinalIgnoreCase)) return "Plasma";
        if (t.Contains("platelet", StringComparison.OrdinalIgnoreCase)) return "Platelets";
        if (t.Contains("whole", StringComparison.OrdinalIgnoreCase) || t.Contains("blood", StringComparison.OrdinalIgnoreCase))
            return "Whole Blood";
        return t;
    }

    public static int CalculateLivesHelped(IEnumerable<Donation> donations)
    {
        return donations
            .Where(d => string.Equals(d.Status, "Successful", StringComparison.OrdinalIgnoreCase))
            .Sum(d => LivesImpact.GetValueOrDefault(NormalizeType(d.DonationType), 1));
    }

    public static decimal CalculateVolumeLiters(IEnumerable<Donation> donations)
    {
        return donations
            .Where(d => string.Equals(d.Status, "Successful", StringComparison.OrdinalIgnoreCase))
            .Sum(d => d.Volume) / 1000m;
    }
}
