using System;
using System.Collections.Generic;

namespace GlowBook.Core.Entities
{
    public class PackageDeal
    {
        public int Id { get; set; }
        public string Name { get; set; }              // "Bridal Package", "Spa Day", "Gel Maintenance"
        public string Description { get; set; }
        public List<int> ServiceIds { get; set; }     // Shërbimet e përfshira
        public decimal PackagePrice { get; set; }      // Çmimi total i paketës
        public decimal DiscountPercentage { get; set; } // Zbritja krahasuar me çmimet individuale
        public int ValidityDays { get; set; }          // Për sa ditë është e vlefshme
        public bool IsSeasonal { get; set; }
        public string Season { get; set; }             // "Summer", "Winter", "Wedding Season"
        
        public PackageDeal()
        {
            ServiceIds = new List<int>();
            ValidityDays = 30;
            DiscountPercentage = 15;
        }
    }
}