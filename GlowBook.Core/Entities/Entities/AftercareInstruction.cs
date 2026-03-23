using System;
using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class AftercareInstruction
    {
        public int Id { get; set; }
        public string ServiceType { get; set; }       // "Gel Manicure", "Acrylic", "Dip Powder"
        public string Title { get; set; }
        public List<string> Instructions { get; set; }
        public string DosAndDonts { get; set; }
        public int DurationDays { get; set; }          // Për sa ditë duhet ndjekur
        public List<string> RecommendedProducts { get; set; }
        
        public AftercareInstruction()
        {
            Instructions = new List<string>();
            RecommendedProducts = new List<string>();
            DurationDays = 14;
        }
    }
}
