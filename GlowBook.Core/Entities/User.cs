using System;

namespace GlowBook.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public User()
        {
            CreatedAt = DateTime.Now;
            Role = "Customer";
        }
    }
}