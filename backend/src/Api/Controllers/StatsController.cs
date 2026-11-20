using System.Security.Claims;
using Api.Data;
using Api.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EligibilityService _eligibility;
    private readonly GamificationService _gamification;

    public StatsController(AppDbContext db, EligibilityService eligibility, GamificationService gamification)
    {
        _db = db;
        _eligibility = eligibility;
        _gamification = gamification;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<StatsSummaryDto>> Summary()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _db.Users.FirstAsync(u => u.Id == userId);
        var donations = await _db.Donations
            .Where(d => d.UserId == userId)
            .OrderBy(d => d.DonationDate)
            .ToListAsync();

        var successful = donations
            .Where(d => string.Equals(d.Status, "Successful", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var (nextDate, nextType) = _eligibility.GetNextEligible(successful);
        var lives = EligibilityService.CalculateLivesHelped(successful);
        var volume = EligibilityService.CalculateVolumeLiters(successful);
        var plasmaCount = successful.Count(d => EligibilityService.NormalizeType(d.DonationType) == "Plasma");
        var progress = _gamification.GetAchievementProgress(successful.Count, plasmaCount, lives);

        var unlocked = await _db.UserAchievements
            .Where(ua => ua.UserId == userId)
            .Include(ua => ua.Achievement)
            .ToListAsync();

        var achievements = await _db.Achievements.OrderBy(a => a.Name).ToListAsync();

        var cumulative = 0m;
        var volumePoints = successful.Select(d =>
        {
            cumulative += d.Volume / 1000m;
            return new VolumePointDto
            {
                Label = d.DonationDate.ToString("yyyy-MM-dd"),
                CumulativeLiters = Math.Round(cumulative, 2)
            };
        }).ToList();

        return Ok(new StatsSummaryDto
        {
            DonorLevel = user.DonorLevel,
            XP = user.XP,
            TotalDonations = successful.Count,
            TotalLivesHelped = lives,
            TotalBloodVolumeLiters = Math.Round(volume, 2),
            NextEligibleDonationDate = nextDate,
            NextEligibleType = nextType,
            DonationsPerYear = successful
                .GroupBy(d => d.DonationDate.Year)
                .OrderBy(g => g.Key)
                .Select(g => new YearCountDto { Year = g.Key, Count = g.Count() })
                .ToList(),
            DonationTypes = successful
                .GroupBy(d => EligibilityService.NormalizeType(d.DonationType))
                .Select(g => new TypeCountDto { Type = g.Key, Count = g.Count() })
                .OrderByDescending(t => t.Count)
                .ToList(),
            VolumeOverTime = volumePoints,
            Achievements = achievements.Select(a =>
            {
                var ua = unlocked.FirstOrDefault(x => x.AchievementId == a.Id);
                return new AchievementProgressDto
                {
                    Code = a.Code,
                    Name = a.Name,
                    Description = a.Description,
                    Unlocked = ua is not null,
                    UnlockedAt = ua?.UnlockedAt,
                    ProgressPercent = progress.GetValueOrDefault(a.Code, ua is not null ? 100 : 0)
                };
            }).ToList()
        });
    }
}
