using Microsoft.AspNetCore.Mvc;
using GlowBook.Application.Services;
using GlowBook.API.DTOs;
using GlowBook.Core.Entities;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public IActionResult GetAll([FromQuery] string? name, [FromQuery] string? role)
    {
        try
        {
            var users = _userService.GetAllUsers(name, role);
            
            var response = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                PhoneNumber = u.PhoneNumber,
                CreatedAt = u.CreatedAt
            });
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gabim i brendshëm: {ex.Message}" });
        }
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        try
        {
            var user = _userService.GetUserById(id);
            
            var response = new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            };
            
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gabim i brendshëm: {ex.Message}" });
        }
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateUserDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var user = _userService.AddUser(dto.Name, dto.Email, dto.Password, dto.PhoneNumber);
            
            var response = new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            };
            
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gabim i brendshëm: {ex.Message}" });
        }
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var user = _userService.UpdateUser(id, dto.Name, dto.Email, dto.PhoneNumber);
            
            var response = new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            };
            
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gabim i brendshëm: {ex.Message}" });
        }
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try
        {
            _userService.DeleteUser(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gabim i brendshëm: {ex.Message}" });
        }
    }
}