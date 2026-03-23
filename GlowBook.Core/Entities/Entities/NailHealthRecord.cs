using System;

namespace GlowBook.Core.Entities
{
    public class NailHealthRecord
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime RecordDate { get; set; }
        public string Condition { get; set; }         // "Healthy", "Brittle", "Fungal", "Damaged"
        public string Notes { get; set; }
        public string Recommendations { get; set; }    // "Use cuticle oil", "Take break from gel"
        public string TreatmentGiven { get; set; }
        public DateTime NextCheckup { get; set; }
        public int TechnicianId { get; set; }          // Manikuristi që bëri vlerësimin
        
        public virtual User User { get; set; }
        
        public NailHealthRecord()
        {
            RecordDate = DateTime.Now;
            Condition = "Healthy";
        }
    }
}