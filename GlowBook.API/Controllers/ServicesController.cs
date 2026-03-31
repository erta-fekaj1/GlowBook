using Microsoft.AspNetCore.Mvc;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IRepository<Service> _serviceRepo;
    public ServicesController(IRepository<Service> serviceRepo) { _serviceRepo = serviceRepo; }

    [HttpGet]
    public IActionResult GetAll() => Ok(_serviceRepo.GetAll());

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var s = _serviceRepo.GetById(id);
        if (s == null) return NotFound(new { message = $"Sherbimi me ID {id} nuk u gjet" });
        return Ok(s);
    }

    [HttpPost]
    public IActionResult Create([FromBody] ServiceDto dto)
    {
        var service = new Service { Name = dto.Name, Description = dto.Description, Price = dto.Price, DurationMinutes = dto.DurationMinutes };
        _serviceRepo.Add(service);
        return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] ServiceDto dto)
    {
        var service = _serviceRepo.GetById(id);
        if (service == null) return NotFound(new { message = $"Sherbimi me ID {id} nuk u gjet" });
        service.Name = dto.Name; service.Description = dto.Description;
        service.Price = dto.Price; service.DurationMinutes = dto.DurationMinutes;
        _serviceRepo.Update(service);
        return Ok(service);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var service = _serviceRepo.GetById(id);
        if (service == null) return NotFound(new { message = $"Sherbimi me ID {id} nuk u gjet" });
        _serviceRepo.Delete(id);
        return NoContent();
    }
}

public record ServiceDto(string Name, string Description, decimal Price, int DurationMinutes);
