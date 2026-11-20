using System.Security.Claims;
using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bloodresults")]
public class BloodResultsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BloodResultsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BloodResultDto>>> GetAll()
    {
        var userId = CurrentUserId();
        var results = await _db.BloodResults
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ResultDate)
            .ToListAsync();

        return Ok(results.Select(Map));
    }

    [HttpPost]
    public async Task<ActionResult<BloodResultDto>> Create([FromBody] CreateBloodResultRequest request)
    {
        var userId = CurrentUserId();
        var result = new BloodResult
        {
            UserId = userId,
            ResultDate = DateTime.SpecifyKind(request.ResultDate, DateTimeKind.Utc),
            Hemoglobin = request.Hemoglobin,
            Ferritin = request.Ferritin,
            BloodPressure = request.BloodPressure,
            Weight = request.Weight,
            CreatedAt = DateTime.UtcNow
        };

        _db.BloodResults.Add(result);
        await _db.SaveChangesAsync();
        return Ok(Map(result));
    }

    private string CurrentUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    private static BloodResultDto Map(BloodResult r) => new()
    {
        Id = r.Id,
        ResultDate = r.ResultDate,
        Hemoglobin = r.Hemoglobin,
        Ferritin = r.Ferritin,
        BloodPressure = r.BloodPressure,
        Weight = r.Weight
    };
}
