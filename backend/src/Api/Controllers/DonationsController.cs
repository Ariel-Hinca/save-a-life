using System.Security.Claims;
using Api.Data;
using Api.DTOs;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/donations")]
public class DonationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly GamificationService _gamification;

    public DonationsController(AppDbContext db, GamificationService gamification)
    {
        _db = db;
        _gamification = gamification;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DonationDto>>> GetAll()
    {
        var userId = CurrentUserId();
        var donations = await _db.Donations
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        return Ok(donations.Select(Map));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DonationDto>> GetById(Guid id)
    {
        var userId = CurrentUserId();
        var donation = await _db.Donations.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (donation is null) return NotFound();
        return Ok(Map(donation));
    }

    [HttpPost]
    public async Task<ActionResult<DonationDto>> Create([FromBody] CreateDonationRequest request)
    {
        var userId = CurrentUserId();
        var type = EligibilityService.NormalizeType(request.DonationType);
        var volume = request.Volume ?? EligibilityService.DefaultVolumesMl.GetValueOrDefault(type, 450m);

        var donation = new Donation
        {
            UserId = userId,
            DonationDate = DateTime.SpecifyKind(request.DonationDate, DateTimeKind.Utc),
            DonationType = type,
            Location = request.Location?.Trim() ?? string.Empty,
            Volume = volume,
            DonationReference = string.IsNullOrWhiteSpace(request.DonationReference)
                ? $"DON-{DateTime.UtcNow:yyyy}-{Random.Shared.Next(10000, 99999)}"
                : request.DonationReference.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Successful" : request.Status.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        await _gamification.RecalculateUserAsync(userId);

        return CreatedAtAction(nameof(GetById), new { id = donation.Id }, Map(donation));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId();
        var donation = await _db.Donations.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (donation is null) return NotFound();

        _db.Donations.Remove(donation);
        await _db.SaveChangesAsync();
        await _gamification.RecalculateUserAsync(userId);

        return NoContent();
    }

    private string CurrentUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    private static DonationDto Map(Donation d) => new()
    {
        Id = d.Id,
        DonationDate = d.DonationDate,
        DonationType = d.DonationType,
        Location = d.Location,
        Volume = d.Volume,
        DonationReference = d.DonationReference,
        Status = d.Status,
        CreatedAt = d.CreatedAt
    };
}
