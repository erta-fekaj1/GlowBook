using Microsoft.AspNetCore.Mvc;
using GlowBook.Application.Services;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;
    public UsersController(UserService userService) { _userService = userService; }

    [HttpGet]
    public IActionResult GetAll([FromQuery] string? name, [FromQuery] string? role)
        => Ok(_userService.GetAllUsers(name, role));

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        try { return Ok(_userService.GetUserById(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateUserDto dto)
    {
        try
        {
            var user = _userService.AddUser(dto.Name, dto.Email, dto.Password, dto.PhoneNumber);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var user = _userService.UpdateUser(id, dto.Name, dto.Email, dto.PhoneNumber);
            return Ok(user);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try { _userService.DeleteUser(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

public record CreateUserDto(string Name, string Email, string Password, string PhoneNumber);
public record UpdateUserDto(string Name, string Email, string PhoneNumber);
