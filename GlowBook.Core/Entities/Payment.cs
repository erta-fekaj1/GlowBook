using System;

namespace GlowBook.Core.Entities
{
    public class Payment
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public DateTime PaymentDate { get; set; }
        
        public Payment()
        {
            Status = "Pending";
            PaymentDate = DateTime.Now;
        }
    }
}