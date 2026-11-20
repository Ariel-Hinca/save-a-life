using System.Security.Claims;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<UserDto>> GetCurrent()
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        return Ok(Map(user));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(string id)
    {
        var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentId != id) return Forbid();

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();
        return Ok(Map(user));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(string id, [FromBody] UpdateUserRequest request)
    {
        var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentId != id) return Forbid();

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Campus = request.Campus?.Trim() ?? string.Empty;
        user.Programme = request.Programme?.Trim() ?? string.Empty;
        user.Availability = request.Availability?.Trim() ?? string.Empty;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(error.Code, error.Description);
            }
            return ValidationProblem(ModelState);
        }

        return Ok(Map(user));
    }

    private async Task<ApplicationUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return id is null ? null : await _userManager.FindByIdAsync(id);
    }

    private static UserDto Map(ApplicationUser user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email ?? string.Empty,
        Campus = user.Campus,
        Programme = user.Programme,
        Availability = user.Availability,
        DonorLevel = user.DonorLevel,
        XP = user.XP
    };
}
