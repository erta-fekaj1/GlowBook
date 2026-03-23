using System;

namespace GlowBook.Core.Entities
{
    public class Service
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        
        public Service()
        {
            DurationMinutes = 60; // default 1 hour
        }
    }
}