using System;

namespace GlowBook.Core.Entities
{
    public class Appointment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ServiceId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public Appointment()
        {
            Status = "Pending";
            CreatedAt = DateTime.Now;
        }
    }
}