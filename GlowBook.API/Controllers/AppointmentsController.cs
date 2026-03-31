using Microsoft.AspNetCore.Mvc;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IRepository<Appointment> _appointmentRepo;
    public AppointmentsController(IRepository<Appointment> appointmentRepo) { _appointmentRepo = appointmentRepo; }

    [HttpGet]
    public IActionResult GetAll([FromQuery] int? userId, [FromQuery] string? status)
    {
        var apps = _appointmentRepo.GetAll();
        if (userId.HasValue) apps = apps.Where(a => a.UserId == userId.Value);
        if (!string.IsNullOrEmpty(status)) apps = apps.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        return Ok(apps);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var a = _appointmentRepo.GetById(id);
        if (a == null) return NotFound(new { message = $"Takimi me ID {id} nuk u gjet" });
        return Ok(a);
    }

    [HttpPost]
    public IActionResult Create([FromBody] AppointmentDto dto)
    {
        var appointment = new Appointment { UserId = dto.UserId, ServiceId = dto.ServiceId, AppointmentDate = dto.AppointmentDate, Notes = dto.Notes ?? "", Status = "Pending" };
        _appointmentRepo.Add(appointment);
        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateAppointmentDto dto)
    {
        var a = _appointmentRepo.GetById(id);
        if (a == null) return NotFound(new { message = $"Takimi me ID {id} nuk u gjet" });
        a.AppointmentDate = dto.AppointmentDate;
        a.Status = dto.Status ?? a.Status;
        a.Notes = dto.Notes ?? a.Notes;
        _appointmentRepo.Update(a);
        return Ok(a);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var a = _appointmentRepo.GetById(id);
        if (a == null) return NotFound(new { message = $"Takimi me ID {id} nuk u gjet" });
        _appointmentRepo.Delete(id);
        return NoContent();
    }
}

public record AppointmentDto(int UserId, int ServiceId, DateTime AppointmentDate, string? Notes);
public record UpdateAppointmentDto(DateTime AppointmentDate, string? Status, string? Notes);
