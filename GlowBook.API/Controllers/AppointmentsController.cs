using Microsoft.AspNetCore.Mvc;
using GlowBook.API.Contracts;
using GlowBook.Application.Services;
using GlowBook.Core.Entities;

namespace GlowBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppointmentService _appointmentService;

    public AppointmentsController(AppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    // GET: api/appointments
    // GET: api/appointments?userId=1&status=Pending&sortBy=date
    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] int?   userId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null)
    {
        var appointments = _appointmentService.GetAll(userId, status, sortBy);
        return Ok(appointments);
    }

    // GET: api/appointments/1
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var appointment = _appointmentService.GetById(id);
        return Ok(appointment);
    }

    // GET: api/appointments/statistics
    [HttpGet("statistics")]
    public IActionResult GetStatistics()
    {
        var stats = _appointmentService.GetStatistics();
        return Ok(stats);
    }

    // GET: api/appointments/upcoming
    [HttpGet("upcoming")]
    public IActionResult GetUpcoming([FromQuery] int days = 7)
    {
        var upcoming = _appointmentService.GetUpcoming(days);
        return Ok(upcoming);
    }

    // POST: api/appointments
    [HttpPost]
    public IActionResult Create([FromBody] AppointmentDto dto)
    {
        if (dto == null)
            throw new ArgumentException("Të dhënat janë të pavlefshme");

        var appointment = _appointmentService.Add(
            dto.UserId,
            dto.ServiceId,
            dto.AppointmentDate,
            dto.Notes ?? ""
        );
        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
    }

    // PUT: api/appointments/1
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateAppointmentDto dto)
    {
        if (dto == null)
            throw new ArgumentException("Të dhënat janë të pavlefshme");

        var appointment = _appointmentService.Update(
            id,
            dto.AppointmentDate,
            dto.Status ?? "Pending",
            dto.Notes ?? ""
        );
        return Ok(appointment);
    }

    // PATCH: api/appointments/1/status
    [HttpPatch("{id}/status")]
    public IActionResult UpdateStatus(int id, [FromBody] StatusDto dto)
    {
        var appointment = _appointmentService.UpdateStatus(id, dto.Status);
        return Ok(appointment);
    }

    // DELETE: api/appointments/1
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _appointmentService.Delete(id);
        return NoContent();
    }
}