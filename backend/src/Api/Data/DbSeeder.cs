using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await db.Database.MigrateAsync();

        if (!await db.Achievements.AnyAsync())
        {
            db.Achievements.AddRange(
                new Achievement
                {
                    Code = "FirstDrop",
                    Name = "First Drop",
                    Description = "Complete your first donation.",
                    XPReward = 50
                },
                new Achievement
                {
                    Code = "LifeSaver",
                    Name = "Life Saver",
                    Description = "Reach 5 donations.",
                    XPReward = 100
                },
                new Achievement
                {
                    Code = "BloodHero",
                    Name = "Blood Hero",
                    Description = "Reach 10 donations.",
                    XPReward = 200
                },
                new Achievement
                {
                    Code = "PlasmaChampion",
                    Name = "Plasma Champion",
                    Description = "Complete 10 plasma donations.",
                    XPReward = 250
                },
                new Achievement
                {
                    Code = "HundredLivesClub",
                    Name = "100 Lives Club",
                    Description = "Reach an estimated impact of 100 lives.",
                    XPReward = 500
                }
            );
            await db.SaveChangesAsync();
        }

        const string demoEmail = "donor@demo.be";
        var demoUser = await userManager.FindByEmailAsync(demoEmail);
        if (demoUser is null)
        {
            demoUser = new ApplicationUser
            {
                UserName = demoEmail,
                Email = demoEmail,
                EmailConfirmed = true,
                FirstName = "Alex",
                LastName = "Donor",
                Campus = "Brussels",
                Programme = "Healthcare",
                Availability = "Weekends",
                DonorLevel = 1,
                XP = 0
            };

            var result = await userManager.CreateAsync(demoUser, "Demo123!");
            if (!result.Succeeded)
            {
                return;
            }

            var donations = new[]
            {
                new Donation
                {
                    UserId = demoUser.Id,
                    DonationDate = DateTime.UtcNow.AddMonths(-10),
                    DonationType = "Whole Blood",
                    Location = "Brussels",
                    Volume = 450,
                    DonationReference = "DON-2025-00001",
                    Status = "Successful"
                },
                new Donation
                {
                    UserId = demoUser.Id,
                    DonationDate = DateTime.UtcNow.AddMonths(-6),
                    DonationType = "Plasma",
                    Location = "Leuven",
                    Volume = 600,
                    DonationReference = "DON-2025-00042",
                    Status = "Successful"
                },
                new Donation
                {
                    UserId = demoUser.Id,
                    DonationDate = DateTime.UtcNow.AddMonths(-3),
                    DonationType = "Whole Blood",
                    Location = "Antwerp",
                    Volume = 450,
                    DonationReference = "DON-2026-00088",
                    Status = "Successful"
                },
                new Donation
                {
                    UserId = demoUser.Id,
                    DonationDate = DateTime.UtcNow.AddDays(-20),
                    DonationType = "Platelets",
                    Location = "Ghent",
                    Volume = 250,
                    DonationReference = "DON-2026-00124",
                    Status = "Successful"
                }
            };

            db.Donations.AddRange(donations);
            db.BloodResults.AddRange(
                new BloodResult
                {
                    UserId = demoUser.Id,
                    ResultDate = donations[0].DonationDate,
                    Hemoglobin = 14.2m,
                    Ferritin = 48m,
                    BloodPressure = "120/78",
                    Weight = 72m
                },
                new BloodResult
                {
                    UserId = demoUser.Id,
                    ResultDate = donations[2].DonationDate,
                    Hemoglobin = 14.5m,
                    Ferritin = 52m,
                    BloodPressure = "122/80",
                    Weight = 73m
                },
                new BloodResult
                {
                    UserId = demoUser.Id,
                    ResultDate = donations[3].DonationDate,
                    Hemoglobin = 14.8m,
                    Ferritin = 55m,
                    BloodPressure = "118/76",
                    Weight = 73.5m
                }
            );
            await db.SaveChangesAsync();

            var gamification = scope.ServiceProvider.GetRequiredService<Services.GamificationService>();
            await gamification.RecalculateUserAsync(demoUser.Id);
        }
    }
}
