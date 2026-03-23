using System;
using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class AppointmentDetails
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public string NailShape { get; set; }         // "Almond", "Square", "Coffin", "Stiletto", "Round"
        public string NailLength { get; set; }        // "Short", "Medium", "Long", "Extra Long"
        public string BaseColor { get; set; }         // Ngjyra bazë
        public string AccentColor { get; set; }       // Ngjyra accent
        public int? NailArtDesignId { get; set; }     // Dizajni i zgjedhur
        public string SpecialInstructions { get; set; } // "Glossy finish", "Matte top coat"
        public List<string> Allergies { get; set; }    // Alergji ndaj produkteve
        public bool HasArtificialNails { get; set; }   // A ka artificialë aktualisht
        public bool NeedsRemoval { get; set; }         // A ka nevojë për heqje
        public string RemovalType { get; set; }        // "Soak-off", "File-off", "E-file"
        
        public virtual Appointment Appointment { get; set; }
        public virtual NailArtDesign NailArtDesign { get; set; }
        
        public AppointmentDetails()
        {
            Allergies = new List<string>();
            NailShape = "Almond";
            NailLength = "Medium";
        }
    }
}