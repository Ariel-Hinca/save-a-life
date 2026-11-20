using Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<BloodResult> BloodResults => Set<BloodResult>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<UserAchievement> UserAchievements => Set<UserAchievement>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Donation>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.Property(x => x.Volume).HasPrecision(10, 2);
            e.HasOne(x => x.User)
                .WithMany(u => u.Donations)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<BloodResult>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.Property(x => x.Hemoglobin).HasPrecision(10, 2);
            e.Property(x => x.Ferritin).HasPrecision(10, 2);
            e.Property(x => x.Weight).HasPrecision(10, 2);
            e.HasOne(x => x.User)
                .WithMany(u => u.BloodResults)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Achievement>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
        });

        builder.Entity<UserAchievement>(e =>
        {
            e.HasKey(x => new { x.UserId, x.AchievementId });
            e.HasOne(x => x.User)
                .WithMany(u => u.UserAchievements)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Achievement)
                .WithMany(a => a.UserAchievements)
                .HasForeignKey(x => x.AchievementId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
