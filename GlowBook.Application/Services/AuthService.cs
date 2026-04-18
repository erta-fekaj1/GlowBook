using GlowBook.Application.Security;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GlowBook.Application.Services;

public class AuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IRepository<User> userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public AuthResult Login(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Email dhe password janë të detyrueshme");

        var user = _userRepository.GetAll()
            .FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

        if (user == null || !PasswordSecurity.Verify(password, user.Password))
            throw new UnauthorizedAccessException("Email ose password i gabuar");

        if (string.Equals(user.Password, password, StringComparison.Ordinal))
        {
            user.Password = PasswordSecurity.Hash(password);
            _userRepository.Update(user);
        }

        return new AuthResult(GenerateToken(user), user);
    }

    public AuthResult Register(string name, string email, string password, string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Emri nuk mund të jetë bosh");
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
            throw new ArgumentException("Email nuk është valid");
        if (string.IsNullOrWhiteSpace(password) || password.Length < 4)
            throw new ArgumentException("Password duhet të ketë min. 4 karaktere");

        var exists = _userRepository.GetAll()
            .Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        if (exists)
            throw new InvalidOperationException($"Email '{email}' është tashmë në përdorim");

        var user = new User
        {
            Name = name,
            Email = email,
            Password = PasswordSecurity.Hash(password),
            PhoneNumber = phoneNumber ?? string.Empty,
            Role = "Customer",
            CreatedAt = DateTime.Now
        };

        _userRepository.Add(user);
        return new AuthResult(GenerateToken(user), user);
    }

    public User GetCurrentUser(int userId)
    {
        if (userId <= 0)
            throw new ArgumentException("Kërkesa e token-it është e pavlefshme");

        var user = _userRepository.GetById(userId);
        if (user == null)
            throw new KeyNotFoundException("Përdoruesi nuk u gjet");
        return user;
    }

    private string GenerateToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key mungon në konfigurim");
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer mungon në konfigurim");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtIssuer,
            claims: claims,
            expires: DateTime.Now.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record AuthResult(string Token, User User);
