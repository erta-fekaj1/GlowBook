using System;
using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class NailArtDesign
    {
        public int Id { get; set; }
        public string Name { get; set; }              // "Floral Fantasy", "Marble Effect", "Glitter Gradient"
        public string Description { get; set; }
        public string Complexity { get; set; }        // "Simple", "Medium", "Complex"
        public decimal AdditionalPrice { get; set; }   // Çmimi shtesë mbi shërbimin bazë
        public int EstimatedMinutes { get; set; }      // Koha shtesë
        public List<string> RequiredTools { get; set; } // "Dotting Tool", "Striper Brush", "Stamper"
        public List<string> ImageUrls { get; set; }    // Fotot e dizajnit
        public bool IsTrending { get; set; }
        
        public NailArtDesign()
        {
            RequiredTools = new List<string>();
            ImageUrls = new List<string>();
            AdditionalPrice = 0;
            EstimatedMinutes = 15;
        }
    }
}