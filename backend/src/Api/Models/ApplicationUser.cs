using Microsoft.AspNetCore.Identity;

namespace Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Campus { get; set; } = string.Empty;
    public string Programme { get; set; } = string.Empty;
    public string Availability { get; set; } = string.Empty;
    public int DonorLevel { get; set; } = 1;
    public int XP { get; set; }

    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
    public ICollection<BloodResult> BloodResults { get; set; } = new List<BloodResult>();
    public ICollection<UserAchievement> UserAchievements { get; set; } = new List<UserAchievement>();
}
