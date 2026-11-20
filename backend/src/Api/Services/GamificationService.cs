using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class GamificationService
{
    private static readonly int[] LevelThresholds = [0, 3, 5, 10, 15, 25, 40];

    private readonly AppDbContext _db;

    public GamificationService(AppDbContext db)
    {
        _db = db;
    }

    public static int CalculateLevel(int donationCount)
    {
        var level = 1;
        for (var i = 0; i < LevelThresholds.Length; i++)
        {
            if (donationCount >= LevelThresholds[i])
            {
                level = i + 1;
            }
        }
        return level;
    }

    public async Task RecalculateUserAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return;

        var donations = await _db.Donations
            .Where(d => d.UserId == userId && d.Status == "Successful")
            .ToListAsync();

        var xpFromDonations = donations.Sum(d =>
            EligibilityService.XpRewards.GetValueOrDefault(EligibilityService.NormalizeType(d.DonationType), 100));

        var achievements = await _db.Achievements.ToListAsync();
        var unlocked = await _db.UserAchievements
            .Where(ua => ua.UserId == userId)
            .Select(ua => ua.AchievementId)
            .ToListAsync();

        var totalCount = donations.Count;
        var plasmaCount = donations.Count(d => EligibilityService.NormalizeType(d.DonationType) == "Plasma");
        var lives = EligibilityService.CalculateLivesHelped(donations);

        var newlyUnlocked = new List<Achievement>();

        void TryUnlock(string code, bool condition)
        {
            var achievement = achievements.FirstOrDefault(a => a.Code == code);
            if (achievement is null || unlocked.Contains(achievement.Id) || !condition) return;
            newlyUnlocked.Add(achievement);
            _db.UserAchievements.Add(new UserAchievement
            {
                UserId = userId,
                AchievementId = achievement.Id,
                UnlockedAt = DateTime.UtcNow
            });
        }

        TryUnlock("FirstDrop", totalCount >= 1);
        TryUnlock("LifeSaver", totalCount >= 5);
        TryUnlock("BloodHero", totalCount >= 10);
        TryUnlock("PlasmaChampion", plasmaCount >= 10);
        TryUnlock("HundredLivesClub", lives >= 100);

        var xpFromAchievements = await _db.UserAchievements
            .Where(ua => ua.UserId == userId)
            .Include(ua => ua.Achievement)
            .Select(ua => ua.Achievement!.XPReward)
            .SumAsync();

        // Include newly unlocked in same transaction
        xpFromAchievements += newlyUnlocked.Sum(a => a.XPReward);

        user.XP = xpFromDonations + xpFromAchievements;
        user.DonorLevel = CalculateLevel(totalCount);

        await _db.SaveChangesAsync();
    }

    public Dictionary<string, int> GetAchievementProgress(int totalCount, int plasmaCount, int lives)
    {
        return new Dictionary<string, int>
        {
            ["FirstDrop"] = Math.Min(100, totalCount >= 1 ? 100 : 0),
            ["LifeSaver"] = Math.Min(100, (int)(totalCount / 5.0 * 100)),
            ["BloodHero"] = Math.Min(100, (int)(totalCount / 10.0 * 100)),
            ["PlasmaChampion"] = Math.Min(100, (int)(plasmaCount / 10.0 * 100)),
            ["HundredLivesClub"] = Math.Min(100, (int)(lives / 100.0 * 100))
        };
    }
}
