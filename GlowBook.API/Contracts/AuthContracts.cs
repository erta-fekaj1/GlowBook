namespace GlowBook.API.Contracts;

public record LoginDto(string Email, string Password);
public record RegisterDto(string Name, string Email, string Password, string? PhoneNumber);
