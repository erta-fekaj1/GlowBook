using Microsoft.AspNetCore.Mvc;
using GlowBook.API.Contracts;
using GlowBook.Application.Services;
using System.Security.Claims;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        if (dto == null)
            throw new ArgumentException("Të dhënat janë të pavlefshme");

        var result = _authService.Login(dto.Email, dto.Password);
        var user = result.User;

        return Ok(new
        {
            token   = result.Token,
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
            throw new ArgumentException("Të dhënat janë të pavlefshme");

        var result = _authService.Register(dto.Name, dto.Email, dto.Password, dto.PhoneNumber);
        var user = result.User;

        return Ok(new
        {
            token   = result.Token,
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
        var user   = _authService.GetCurrentUser(userId);

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
}