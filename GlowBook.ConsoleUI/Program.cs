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
        
        // ==================== CRUD MENU ====================
        Console.WriteLine("\n" + new string('=', 50));
        Console.WriteLine("💅 GLOW BOOK - CRUD OPERATIONS MENU 💅");
        Console.WriteLine(new string('=', 50));
        
        bool running = true;
        while (running)
        {
            Console.WriteLine("\n📋 MAIN MENU");
            Console.WriteLine("1. Shiko të gjithë përdoruesit (GetAll)");
            Console.WriteLine("2. Shiko përdorues sipas ID (GetById)");
            Console.WriteLine("3. Shto përdorues të ri (Add)");
            Console.WriteLine("4. Përditëso përdorues (Update)");
            Console.WriteLine("5. Fshij përdorues (Delete)");
            Console.WriteLine("6. Dil nga programi");
            Console.Write("\nZgjidhni opsionin (1-6): ");

            string choice = Console.ReadLine();

            switch (choice)
            {
                case "1":
                    Console.WriteLine("\n📋 LISTA E PËRDORUESVE:");
                    var allUsers = userRepo.GetAll();
                    foreach (var user in allUsers)
                    {
                        Console.WriteLine($"   ID: {user.Id}, Emri: {user.Name}, Email: {user.Email}, Roli: {user.Role}");
                    }
                    Console.WriteLine($"\n✅ Total përdorues: {allUsers.Count()}");
                    break;

                case "2":
                    Console.Write("\nShkruani ID-në e përdoruesit: ");
                    if (int.TryParse(Console.ReadLine(), out int id))
                    {
                        var user = userRepo.GetById(id);
                        if (user != null)
                        {
                            Console.WriteLine($"\n✅ Përdoruesi u gjet:");
                            Console.WriteLine($"   ID: {user.Id}");
                            Console.WriteLine($"   Emri: {user.Name}");
                            Console.WriteLine($"   Email: {user.Email}");
                            Console.WriteLine($"   Roli: {user.Role}");
                            Console.WriteLine($"   Telefoni: {user.PhoneNumber}");
                            Console.WriteLine($"   Krijuar: {user.CreatedAt}");
                        }
                        else
                        {
                            Console.WriteLine($"\n❌ Përdoruesi me ID {id} nuk u gjet!");
                        }
                    }
                    else
                    {
                        Console.WriteLine("\n❌ ID e pavlefshme!");
                    }
                    break;

                case "3":
                    Console.WriteLine("\n🆕 SHTO PËRDORUES TË RI:");
                    var newUser = new User();
                    
                    Console.Write("Emri: ");
                    newUser.Name = Console.ReadLine();
                    
                    Console.Write("Email: ");
                    newUser.Email = Console.ReadLine();
                    
                    Console.Write("Password: ");
                    newUser.Password = Console.ReadLine();
                    
                    Console.Write("Telefoni: ");
                    newUser.PhoneNumber = Console.ReadLine();
                    
                    newUser.Role = "Customer";
                    newUser.CreatedAt = DateTime.Now;
                    
                    userRepo.Add(newUser);
                    Console.WriteLine($"\n✅ Përdoruesi u shtua me sukses! ID e krijuar: {newUser.Id}");
                    break;

                case "4":
                    Console.Write("\nShkruani ID-në e përdoruesit për përditësim: ");
                    if (int.TryParse(Console.ReadLine(), out int updateId))
                    {
                        var existingUser = userRepo.GetById(updateId);
                        if (existingUser != null)
                        {
                            Console.WriteLine($"\n📝 Përdoruesi aktual: {existingUser.Name} - {existingUser.Email}");
                            Console.Write("Emri i ri (Enter për të lënë pa ndryshim): ");
                            string newName = Console.ReadLine();
                            if (!string.IsNullOrEmpty(newName)) existingUser.Name = newName;
                            
                            Console.Write("Email i ri (Enter për të lënë pa ndryshim): ");
                            string newEmail = Console.ReadLine();
                            if (!string.IsNullOrEmpty(newEmail)) existingUser.Email = newEmail;
                            
                            Console.Write("Telefoni i ri (Enter për të lënë pa ndryshim): ");
                            string newPhone = Console.ReadLine();
                            if (!string.IsNullOrEmpty(newPhone)) existingUser.PhoneNumber = newPhone;
                            
                            userRepo.Update(existingUser);
                            Console.WriteLine("\n✅ Përdoruesi u përditësua me sukses!");
                        }
                        else
                        {
                            Console.WriteLine($"\n❌ Përdoruesi me ID {updateId} nuk u gjet!");
                        }
                    }
                    break;

                case "5":
                    Console.Write("\nShkruani ID-në e përdoruesit për fshirje: ");
                    if (int.TryParse(Console.ReadLine(), out int deleteId))
                    {
                        var userToDelete = userRepo.GetById(deleteId);
                        if (userToDelete != null)
                        {
                            Console.Write($"\n⚠️ A jeni i sigurt që doni të fshini '{userToDelete.Name}'? (po/jo): ");
                            if (Console.ReadLine().ToLower() == "po")
                            {
                                userRepo.Delete(deleteId);
                                Console.WriteLine("\n✅ Përdoruesi u fshi me sukses!");
                            }
                            else
                            {
                                Console.WriteLine("\n❌ Fshirja u anulua.");
                            }
                        }
                        else
                        {
                            Console.WriteLine($"\n❌ Përdoruesi me ID {deleteId} nuk u gjet!");
                        }
                    }
                    break;

                case "6":
                    running = false;
                    Console.WriteLine("\n👋 Mirupafshim! Faleminderit që përdorët Glow Book!");
                    break;

                default:
                    Console.WriteLine("\n❌ Opsion i pavlefshëm! Zgjidhni 1-6.");
                    break;
            }
        }
        
        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }
}