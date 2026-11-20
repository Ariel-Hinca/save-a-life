using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Campus { get; set; } = string.Empty;
    public string Programme { get; set; } = string.Empty;
    public string Availability { get; set; } = string.Empty;
    public int DonorLevel { get; set; }
    public int XP { get; set; }
}

public class UpdateUserRequest
{
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    public string Campus { get; set; } = string.Empty;
    public string Programme { get; set; } = string.Empty;
    public string Availability { get; set; } = string.Empty;
}
