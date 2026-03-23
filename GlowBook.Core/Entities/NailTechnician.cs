using System;
using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class NailTechnician
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string TechnicianNumber { get; set; }     // MAN-001, MAN-002
        public string Specialization { get; set; }       // "Acrylic", "Gel", "Polygel", "Dip Powder", "All"
        public int YearsOfExperience { get; set; }
        public string Certifications { get; set; }       // Lista e certifikatave
        public string Portfolio { get; set; }            // Linku i portofolit
        public bool IsAvailable { get; set; }
        public decimal BaseSalary { get; set; }
        public decimal CommissionPerService { get; set; } // % komisioni për çdo shërbim
        
        public virtual User User { get; set; }
        public virtual ICollection<Appointment> Appointments { get; set; }
        
        public NailTechnician()
        {
            IsAvailable = true;
            CommissionPerService = 30; // 30% komision
        }
    }
}