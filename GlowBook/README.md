# 💅 Glow Book - Nail Salon Management System

![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![C#](https://img.shields.io/badge/C%23-12.0-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📌 About
Glow Book është një sistem për menaxhimin e një saloni thonjsh. Aplikacioni digjitalizon procesin e rezervimeve duke zëvendësuar bllokun tradicional me një sistem automatik që menaxhon klientët, shërbimet, stafin dhe financat. Projekti është ndërtuar me **Clean Architecture** dhe **Repository Pattern** duke përdorur **C# 12** dhe **.NET 8**.

## ✨ Features

**Klientët:**
- Regjistrim dhe login
- Shikimi i shërbimeve
- Rezervim dhe anulim terminesh
- Historiku i rezervimeve
- Komente dhe vlerësime

**Admin:**
- Menaxhimi i rezervimeve (pranim/refuzim)
- Shtimi dhe fshirja e shërbimeve
- Menaxhimi i stafit
- Statistikat e të ardhurave

**Specifike për Salon:**
- Katalog shërbimesh (Manicure, Pedicure, Acrylic, Gel, Nail Art)
- Menaxhimi i produkteve dhe stokut
- Program besnikërie me pikë
- Forma dhe gjatësi të ndryshme thonjsh

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         GlowBook.ConsoleUI              │  ← Presentation
├─────────────────────────────────────────┤
│         GlowBook.Application            │  ← Business Logic
├─────────────────────────────────────────┤
│           GlowBook.Core                 │  ← Domain (Entities, Interfaces)
├─────────────────────────────────────────┤
│       GlowBook.Infrastructure           │  ← Data Access (CSV)
└─────────────────────────────────────────┘
```

**4 shtresa me Clean Architecture:**
- **Core** - Entitetet, Enums, Interfaces
- **Infrastructure** - FileRepository, CSV storage
- **Application** - Logjika e biznesit, Services
- **ConsoleUI** - Ndërfaqja e përdoruesit

## 🛠 Tech Stack

| Technology | Version |
|------------|---------|
| C# | 12.0 |
| .NET | 8.0 |
| CSV | Data Storage |
| Git/GitHub | Version Control |

## 📂 Project Structure

```
GlowBook/
├── GlowBook.Core/                 # Domain Layer
│   ├── Entities/                  # User, Service, Appointment
│   ├── Enums/                     # UserRole, AppointmentStatus
│   └── Interfaces/                # IRepository<T>
├── GlowBook.Infrastructure/       # Data Layer
│   ├── Data/
│   │   └── Database/              # CSV files
│   └── Repositories/              # FileRepository<T>
├── GlowBook.Application/          # Business Layer
│   └── Services/
├── GlowBook.ConsoleUI/            # UI Layer
│   └── Program.cs
├── Docs/                          # Documentation
└── README.md
```

## 🚀 Getting Started

```bash
git clone https://github.com/ertafekaj/GlowBook.git
cd GlowBook
dotnet restore
dotnet run --project GlowBook.ConsoleUI
📚 Documentation
Architecture

Class Documentation

Repository Pattern

👩‍💻 Author
Erta Fekaj

📌 Version
1.0.0
