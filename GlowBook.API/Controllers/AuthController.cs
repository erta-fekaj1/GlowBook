using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GlowBook.Core.Interfaces;
using GlowBook.Core.Entities;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IRepository<User> _userRepository;
    private readonly IConfiguration    _configuration;

    public AuthController(
        IRepository<User> userRepository,
        IConfiguration    configuration)
    {
        _userRepository = userRepository;
        _configuration  = configuration;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Email dhe password janë të detyrueshme" });

        // Gjej userin
        var user = _userRepository.GetAll()
            .FirstOrDefault(u =>
                u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase) &&
                u.Password == dto.Password);

        if (user == null)
            return Unauthorized(new { message = "Email ose password i gabuar" });

        // Gjenero JWT Token
        var token = GenerateToken(user);

        return Ok(new
        {
            token   = token,
            user    = new
            {
                id          = user.Id,
                name        = user.Name,
                email       = user.Email,
                role        = user.Role,
                phoneNumber = user.PhoneNumber
            },
            expiresIn = 86400 // 24 ore
        });
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Të dhënat janë të pavlefshme" });

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Emri nuk mund të jetë bosh" });

        if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains("@"))
            return BadRequest(new { message = "Email nuk është valid" });

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 4)
            return BadRequest(new { message = "Password duhet të ketë min. 4 karaktere" });

        // Kontrollo nëse email ekziston
        var existing = _userRepository.GetAll()
            .Any(u => u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase));

        if (existing)
            return Conflict(new { message = $"Email '{dto.Email}' është tashmë në përdorim" });

        // Krijo userin
        var user = new User
        {
            Name        = dto.Name,
            Email       = dto.Email,
            Password    = dto.Password,
            PhoneNumber = dto.PhoneNumber ?? "",
            Role        = "Customer",
            CreatedAt   = DateTime.Now
        };

        _userRepository.Add(user);

        // Gjenero token direkt
        var token = GenerateToken(user);

        return Ok(new
        {
            token   = token,
            user    = new
            {
                id          = user.Id,
                name        = user.Name,
                email       = user.Email,
                role        = user.Role,
                phoneNumber = user.PhoneNumber
            },
            expiresIn = 86400
        });
    }

    // GET: api/auth/me
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public IActionResult Me()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var user   = _userRepository.GetById(userId);

        if (user == null)
            return NotFound(new { message = "Përdoruesi nuk u gjet" });

        return Ok(new
        {
            id          = user.Id,
            name        = user.Name,
            email       = user.Email,
            role        = user.Role,
            phoneNumber = user.PhoneNumber,
            createdAt   = user.CreatedAt
        });
    }

    private string GenerateToken(User user)
    {
        var jwtKey    = _configuration["Jwt:Key"] ?? "GlowBookSecretKey2026!SuperSecret";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "GlowBookAPI";

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim(ClaimTypes.Name,           user.Name),
            new Claim(ClaimTypes.Role,           user.Role)
        };

        var token = new JwtSecurityToken(
            issuer:             jwtIssuer,
            audience:           jwtIssuer,
            claims:             claims,
            expires:            DateTime.Now.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginDto(string Email, string Password);
public record RegisterDto(string Name, string Email, string Password, string? PhoneNumber);