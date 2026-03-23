using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class NailService
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }          // "Manicure", "Pedicure", "Acrylic", "Gel", "Nail Art"
        public string SubCategory { get; set; }       // "French Tip", "Ombre", "3D Art", "Chrome"
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public List<string> IncludedItems { get; set; } // "Cuticle Care", "Shaping", "Polish"
        public List<string> AvailableColors { get; set; } // Lista e ngjyrave në dispozicion
        public bool IsPopular { get; set; }
        public int TimesBooked { get; set; }           // Sa herë është rezervuar
        
        public NailService()
        {
            IncludedItems = new List<string>();
            AvailableColors = new List<string>();
            DurationMinutes = 60;
            IsPopular = false;
            TimesBooked = 0;
        }
    }
}