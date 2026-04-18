using Microsoft.AspNetCore.Mvc;
using GlowBook.API.Contracts;
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
        return Ok(_userService.GetUserById(id));
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateUserDto dto)
    {
        var user = _userService.AddUser(dto.Name, dto.Email, dto.Password, dto.PhoneNumber);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = _userService.UpdateUser(id, dto.Name, dto.Email, dto.PhoneNumber);
        return Ok(user);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _userService.DeleteUser(id);
        return NoContent();
    }
}
