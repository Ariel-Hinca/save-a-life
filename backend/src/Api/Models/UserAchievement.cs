namespace Api.Models;

public class UserAchievement
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public Guid AchievementId { get; set; }
    public Achievement? Achievement { get; set; }

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
}
