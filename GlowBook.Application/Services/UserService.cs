using System;
using System.Collections.Generic;
using System.Linq;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;

namespace GlowBook.Application.Services;

public class UserService
{
    private readonly IRepository<User> _userRepository;

    // Service merr Repository si parameter (Dependency Injection)
    public UserService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    // 1. Listo me filtrim (sipas emrit ose rolit)
    public List<User> GetAllUsers(string filterByName = null, string filterByRole = null)
    {
        var users = _userRepository.GetAll().ToList();

        // Filtro sipas emrit (nëse është dhënë)
        if (!string.IsNullOrWhiteSpace(filterByName))
        {
            users = users.Where(u => u.Name.Contains(filterByName, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Filtro sipas rolit (nëse është dhënë)
        if (!string.IsNullOrWhiteSpace(filterByRole))
        {
            users = users.Where(u => u.Role.Equals(filterByRole, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return users;
    }

    // 2. Gjej sipas ID
    public User GetUserById(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("ID duhet të jetë më e madhe se 0");
        }

        var user = _userRepository.GetById(id);
        if (user == null)
        {
            throw new KeyNotFoundException($"Përdoruesi me ID {id} nuk u gjet");
        }

        return user;
    }

    // 3. Shto me validim
    public User AddUser(string name, string email, string password, string phoneNumber, string role = "Customer")
    {
        // Validimi: emri jo bosh
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Emri nuk mund të jetë bosh");
        }

        // Validimi: email jo bosh dhe format i vlefshëm
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email nuk mund të jetë bosh");
        }
        if (!email.Contains("@") || !email.Contains("."))
        {
            throw new ArgumentException("Email nuk është në format të vlefshëm");
        }

        // Validimi: password jo bosh
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password nuk mund të jetë bosh");
        }
        if (password.Length < 4)
        {
            throw new ArgumentException("Password duhet të ketë të paktën 4 karaktere");
        }

        // Validimi: telefoni jo bosh
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new ArgumentException("Numri i telefonit nuk mund të jetë bosh");
        }

        // Validimi: email unik (nuk ekziston tashmë)
        var existingUsers = _userRepository.GetAll();
        if (existingUsers.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException($"Email '{email}' tashmë është në përdorim");
        }

        // Krijo përdoruesin e ri
        var newUser = new User
        {
            Name = name,
            Email = email,
            Password = password,
            PhoneNumber = phoneNumber,
            Role = role,
            CreatedAt = DateTime.Now
        };

        _userRepository.Add(newUser);
        return newUser;
    }

    // Metodë shtesë: Përditëso përdoruesin me validim
    public User UpdateUser(int id, string name, string email, string phoneNumber)
    {
        var existingUser = GetUserById(id);

        // Validimi: emri jo bosh
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Emri nuk mund të jetë bosh");
        }

        // Validimi: email jo bosh dhe format i vlefshëm
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email nuk mund të jetë bosh");
        }
        if (!email.Contains("@") || !email.Contains("."))
        {
            throw new ArgumentException("Email nuk është në format të vlefshëm");
        }

        // Validimi: email unik (përveç përdoruesit aktual)
        var existingUsers = _userRepository.GetAll();
        if (existingUsers.Any(u => u.Id != id && u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException($"Email '{email}' tashmë është në përdorim nga një përdorues tjetër");
        }

        existingUser.Name = name;
        existingUser.Email = email;
        existingUser.PhoneNumber = phoneNumber;

        _userRepository.Update(existingUser);
        return existingUser;
    }

    // Metodë shtesë: Fshij përdoruesin
    public bool DeleteUser(int id)
    {
        var user = GetUserById(id);
        _userRepository.Delete(id);
        return true;
    }
}