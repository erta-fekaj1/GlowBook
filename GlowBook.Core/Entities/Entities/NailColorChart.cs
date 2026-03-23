using System;
using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class NailColorChart
    {
        public int Id { get; set; }
        public string Brand { get; set; }
        public string Collection { get; set; }        // "Summer 2024", "Neon Collection", "Pastel Dreams"
        public string ColorName { get; set; }
        public string ColorCode { get; set; }
        public string HexCode { get; set; }            // #FF69B4 për rozë
        public string Category { get; set; }           // "Red", "Pink", "Nude", "Blue", "Green", "Purple"
        public string Finish { get; set; }             // "Glossy", "Matte", "Glitter", "Chrome", "Holographic"
        public bool IsInStock { get; set; }
        public string SwatchImage { get; set; }        // Foto e ngjyrës
        public int TimesUsed { get; set; }              // Sa herë është përdorur
        
        public NailColorChart()
        {
            IsInStock = true;
            TimesUsed = 0;
        }
    }
}