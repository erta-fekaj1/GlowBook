namespace GlowBook.API.DTOs;

public class UserResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}