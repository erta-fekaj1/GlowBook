using System;

namespace GlowBook.Core.Entities
{
    public class Review
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int AppointmentId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public Review()
        {
            CreatedAt = DateTime.Now;
        }
    }
}