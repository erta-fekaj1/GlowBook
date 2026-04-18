namespace GlowBook.API.Contracts;

public record CreateUserDto(string Name, string Email, string Password, string PhoneNumber);
public record UpdateUserDto(string Name, string Email, string PhoneNumber);
