namespace GlowBook.API.Contracts;

public record AppointmentDto(
    int UserId,
    int ServiceId,
    DateTime AppointmentDate,
    string? Notes
);

public record UpdateAppointmentDto(
    DateTime AppointmentDate,
    string? Status,
    string? Notes
);

public record StatusDto(string Status);
