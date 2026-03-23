using System;

namespace GlowBook.Core.Entities
{
    public class NailProduct
    {
        public int Id { get; set; }
        public string Brand { get; set; }            // "OPI", "CND", "Gelish", "Kiara Sky"
        public string ProductName { get; set; }       // "Base Coat", "Top Coat", "Color: Bubble Bath"
        public string Type { get; set; }              // "Polish", "Gel", "Acrylic Powder", "Lamp", "Tool"
        public string Color { get; set; }             // Për polishes
        public string ColorCode { get; set; }         // Kodi i ngjyrës (p.sh., "OPI NLA65")
        public int StockQuantity { get; set; }
        public int LowStockThreshold { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string Supplier { get; set; }
        
        public bool IsLowStock => StockQuantity <= LowStockThreshold;
        
        public NailProduct()
        {
            LowStockThreshold = 5;
        }
    }
}