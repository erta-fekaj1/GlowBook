using System;
using System.Collections.Generic;
using System.Linq;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;

namespace GlowBook.Application.Services;

public class AppointmentService
{
    private readonly IRepository<Appointment> _appointmentRepository;
    private readonly IRepository<User>        _userRepository;
    private readonly IRepository<Service>     _serviceRepository;

    public AppointmentService(
        IRepository<Appointment> appointmentRepository,
        IRepository<User>        userRepository,
        IRepository<Service>     serviceRepository)
    {
        _appointmentRepository = appointmentRepository;
        _userRepository        = userRepository;
        _serviceRepository     = serviceRepository;
    }

    // ============================================================
    // 1. LISTO ME FILTRIM DHE SORTIM
    // ============================================================

    /// <summary>
    /// Kthen të gjitha takimet me filtrim opsional
    /// </summary>
    public List<Appointment> GetAll(
        int?    userId    = null,
        string  status    = null,
        string  sortBy    = null)
    {
        var appointments = _appointmentRepository.GetAll();

        // Filtrim sipas userId
        if (userId.HasValue)
            appointments = appointments.Where(a => a.UserId == userId.Value);

        // Filtrim sipas statusit
        if (!string.IsNullOrWhiteSpace(status))
            appointments = appointments.Where(a =>
                a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

        // Sortim
        appointments = sortBy?.ToLower() switch
        {
            "date"       => appointments.OrderBy(a => a.AppointmentDate),
            "date_desc"  => appointments.OrderByDescending(a => a.AppointmentDate),
            "status"     => appointments.OrderBy(a => a.Status),
            _            => appointments.OrderByDescending(a => a.CreatedAt)
        };

        return appointments.ToList();
    }

    /// <summary>
    /// Gjej takim sipas ID
    /// </summary>
    public Appointment GetById(int id)
    {
        if (id <= 0)
            throw new ArgumentException("ID duhet të jetë më e madhe se 0");

        var appointment = _appointmentRepository.GetById(id);
        if (appointment == null)
            throw new KeyNotFoundException($"Takimi me ID {id} nuk u gjet");

        return appointment;
    }

    // ============================================================
    // 2. SHTO ME VALIDIM
    // ============================================================

    /// <summary>
    /// Shton takim të ri me validim të plotë
    /// </summary>
    public Appointment Add(
        int      userId,
        int      serviceId,
        DateTime appointmentDate,
        string   notes = "")
    {
        // Validimi: useri ekziston
        var user = _userRepository.GetById(userId);
        if (user == null)
            throw new KeyNotFoundException($"Përdoruesi me ID {userId} nuk u gjet");

        // Validimi: shërbimi ekziston
        var service = _serviceRepository.GetById(serviceId);
        if (service == null)
            throw new KeyNotFoundException($"Shërbimi me ID {serviceId} nuk u gjet");

        // Validimi: data nuk mund të jetë në të kaluarën
        if (appointmentDate < DateTime.Now)
            throw new ArgumentException("Data e takimit nuk mund të jetë në të kaluarën");

        // Validimi: useri nuk ka takim tjetër në të njëjtën kohë
        var conflict = _appointmentRepository.GetAll()
            .Any(a => a.UserId == userId &&
                      a.Status != "Cancelled" &&
                      Math.Abs((a.AppointmentDate - appointmentDate).TotalMinutes) < 60);

        if (conflict)
            throw new InvalidOperationException(
                "Ky përdorues ka tashmë një takim në këtë interval kohor");

        var appointment = new Appointment
        {
            UserId          = userId,
            ServiceId       = serviceId,
            AppointmentDate = appointmentDate,
            Notes           = notes ?? "",
            Status          = "Pending",
            CreatedAt       = DateTime.Now
        };

        _appointmentRepository.Add(appointment);
        return appointment;
    }

    // ============================================================
    // 3. PËRDITËSO STATUSIN
    // ============================================================

    /// <summary>
    /// Përditëson statusin e takimit
    /// </summary>
    public Appointment UpdateStatus(int id, string status)
    {
        var validStatuses = new[] { "Pending", "Confirmed", "Done", "Cancelled" };

        if (!validStatuses.Contains(status))
            throw new ArgumentException(
                $"Statusi i pavlefshëm. Statuset e vlefshme: {string.Join(", ", validStatuses)}");

        var appointment = GetById(id);
        appointment.Status = status;
        _appointmentRepository.Update(appointment);
        return appointment;
    }

    /// <summary>
    /// Përditëson takimin
    /// </summary>
    public Appointment Update(int id, DateTime appointmentDate, string status, string notes)
    {
        var appointment = GetById(id);

        if (appointmentDate < DateTime.Now && status != "Done" && status != "Cancelled")
            throw new ArgumentException("Data e takimit nuk mund të jetë në të kaluarën");

        var validStatuses = new[] { "Pending", "Confirmed", "Done", "Cancelled" };
        if (!validStatuses.Contains(status))
            throw new ArgumentException("Statusi i pavlefshëm");

        appointment.AppointmentDate = appointmentDate;
        appointment.Status          = status;
        appointment.Notes           = notes ?? appointment.Notes;

        _appointmentRepository.Update(appointment);
        return appointment;
    }

    // ============================================================
    // 4. FSHIJ
    // ============================================================

    public bool Delete(int id)
    {
        var appointment = GetById(id);
        _appointmentRepository.Delete(id);
        return true;
    }

    // ============================================================
    // 5. STATISTIKA
    // ============================================================

    /// <summary>
    /// Kthen statistikat e takimeve
    /// </summary>
    public AppointmentStatistics GetStatistics()
    {
        var appointments = _appointmentRepository.GetAll().ToList();

        return new AppointmentStatistics
        {
            Total       = appointments.Count,
            Pending     = appointments.Count(a => a.Status == "Pending"),
            Confirmed   = appointments.Count(a => a.Status == "Confirmed"),
            Done        = appointments.Count(a => a.Status == "Done"),
            Cancelled   = appointments.Count(a => a.Status == "Cancelled"),
            TodayCount  = appointments.Count(a =>
                a.AppointmentDate.Date == DateTime.Today),
            ThisWeek    = appointments.Count(a =>
                a.AppointmentDate >= DateTime.Today &&
                a.AppointmentDate <= DateTime.Today.AddDays(7))
        };
    }

    /// <summary>
    /// Kthen takimet e ardhshme
    /// </summary>
    public List<Appointment> GetUpcoming(int days = 7)
    {
        return _appointmentRepository.GetAll()
            .Where(a =>
                a.AppointmentDate >= DateTime.Now &&
                a.AppointmentDate <= DateTime.Now.AddDays(days) &&
                a.Status != "Cancelled")
            .OrderBy(a => a.AppointmentDate)
            .ToList();
    }
}

// ============================================================
// MODEL PËR STATISTIKA
// ============================================================
public class AppointmentStatistics
{
    public int Total      { get; set; }
    public int Pending    { get; set; }
    public int Confirmed  { get; set; }
    public int Done       { get; set; }
    public int Cancelled  { get; set; }
    public int TodayCount { get; set; }
    public int ThisWeek   { get; set; }
}