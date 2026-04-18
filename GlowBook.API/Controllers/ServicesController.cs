using Microsoft.AspNetCore.Mvc;
using GlowBook.API.Contracts;
using GlowBook.Application.Services;
using GlowBook.Core.Entities;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly ServiceService _serviceService;
    public ServicesController(ServiceService serviceService) { _serviceService = serviceService; }

    [HttpGet]
    public IActionResult GetAll() => Ok(_serviceService.GetAll());

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        return Ok(_serviceService.GetById(id));
    }

    [HttpPost]
    public IActionResult Create([FromBody] ServiceDto dto)
    {
        var service = _serviceService.Add(dto.Name, dto.Description, dto.Price, dto.DurationMinutes);
        return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] ServiceDto dto)
    {
        var service = _serviceService.Update(id, dto.Name, dto.Description, dto.Price, dto.DurationMinutes);
        return Ok(service);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _serviceService.Delete(id);
        return NoContent();
    }
}
