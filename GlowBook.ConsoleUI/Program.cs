using System.IO;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;
using GlowBook.Infrastructure.Repositories;

namespace GlowBook.ConsoleUI;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("🌟 Glow Book - Repository Pattern Test 🌟");
        Console.WriteLine("========================================\n");
        
        // Përdor rrugën absolute
        string desktopPath = @"C:\Users\pc\OneDrive\Desktop\GlowBook";
        string basePath = Path.Combine(desktopPath, "GlowBook.Infrastructure", "Data", "Database");
        
        string userPath = Path.Combine(basePath, "users.csv");
        string servicePath = Path.Combine(basePath, "services.csv");
        string appointmentPath = Path.Combine(basePath, "appointments.csv");
        
        // Kontrollo nëse skedarët ekzistojnë
        Console.WriteLine($"Checking files in: {basePath}");
        Console.WriteLine($"Users.csv exists: {File.Exists(userPath)}");
        Console.WriteLine($"Services.csv exists: {File.Exists(servicePath)}");
        Console.WriteLine($"Appointments.csv exists: {File.Exists(appointmentPath)}");
        
        if (!File.Exists(userPath))
        {
            Console.WriteLine("\n❌ ERROR: users.csv not found!");
            Console.WriteLine("Please create the CSV files first.");
            Console.ReadKey();
            return;
        }
        
        // Testo User Repository
        IRepository<User> userRepo = new FileRepository<User>(userPath);
        
        Console.WriteLine("\n📋 Users in database:");
        var users = userRepo.GetAll();
        foreach (var user in users)
        {
            Console.WriteLine($"   ID: {user.Id}, Name: {user.Name}, Email: {user.Email}, Role: {user.Role}");
        }
        Console.WriteLine($"\n✅ Total users: {users.Count()}");
        
        // Testo Service Repository
        IRepository<Service> serviceRepo = new FileRepository<Service>(servicePath);
        
        Console.WriteLine("\n💅 Services offered:");
        var services = serviceRepo.GetAll();
        foreach (var service in services)
        {
            Console.WriteLine($"   ID: {service.Id}, Name: {service.Name}, Price: ${service.Price}");
        }
        Console.WriteLine($"\n✅ Total services: {services.Count()}");
        
        // Testo Appointment Repository
        IRepository<Appointment> appointmentRepo = new FileRepository<Appointment>(appointmentPath);
        
        Console.WriteLine("\n📅 Appointments:");
        var appointments = appointmentRepo.GetAll();
        foreach (var app in appointments)
        {
            Console.WriteLine($"   ID: {app.Id}, UserId: {app.UserId}, ServiceId: {app.ServiceId}, Status: {app.Status}");
        }
        Console.WriteLine($"\n✅ Total appointments: {appointments.Count()}");
        
        Console.WriteLine("\n✨ Repository Pattern test completed successfully!");
        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }

        Console.WriteLine("1. Shiko të gjithë përdoruesit");
        Console.WriteLine("2. Shto përdorues të ri");
        Console.WriteLine("3. Dil");

        string choice = Console.ReadLine();

        if (choice == "1")
       {
        var users = userRepo.GetAll();
        foreach (var user in users)
        Console.WriteLine($"{user.Id}. {user.Name} - {user.Email}");
       }
       else if (choice == "2")
      {
       var newUser = new User();
       Console.Write("Emri: "); newUser.Name = Console.ReadLine();
       Console.Write("Email: "); newUser.Email = Console.ReadLine();
       Console.Write("Password: "); newUser.Password = Console.ReadLine();
    
       userRepo.Add(newUser);
       Console.WriteLine("✅ Përdoruesi u shtua!");
 }
}