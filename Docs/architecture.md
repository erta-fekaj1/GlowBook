# 🏗️ Glow Book - Architecture Documentation

## Shtresat e Projektit

Glow Book ka 4 shtresa:

### 1. Core Layer (GlowBook.Core)
- **Përgjegjësia:** Entitetet dhe interfaces
- **Përmban:** User.cs, Service.cs, Appointment.cs, Payment.cs, Review.cs, IRepository.cs, Enums
- **Varësi:** Asnjë

### 2. Infrastructure Layer (GlowBook.Infrastructure)
- **Përgjegjësia:** Ruajtja e të dhënave
- **Përmban:** FileRepository.cs, CSV files (users.csv, services.csv, appointments.csv)
- **Varësi:** Varet nga Core

### 3. Application Layer (GlowBook.Application)
- **Përgjegjësia:** Logjika e biznesit
- **Përmban:** Services, DTOs, Validators
- **Varësi:** Varet nga Core

### 4. Presentation Layer (GlowBook.ConsoleUI)
- **Përgjegjësia:** Ndërfaqja e përdoruesit
- **Përmban:** Program.cs, Menus
- **Varësi:** Varet nga Application dhe Infrastructure

## Rrjedha e Varësive

ConsoleUI ──→ Application ──→ Core ←── Infrastructure

**Shpjegimi:**
- Core nuk varet nga asnjë shtresë tjetër
- Application varet vetëm nga Core
- Infrastructure varet vetëm nga Core
- ConsoleUI varet nga Application dhe Infrastructure

## Vendimet e Arkitekturës

| Vendimi | Arsyeja |
|---------|---------|
| Clean Architecture | Ndarje e qartë e përgjegjësive, lehtë për tu testuar dhe mirëmbajtur |
| Repository Pattern | Abstraksion i aksesit në të dhëna, mund të kalojmë lehtë nga CSV në SQL |
| CSV Storage | Thjeshtësi, pa setup database, të dhënat janë të lexueshme |
| Generic Repository | Ripërdorim i kodit, interface e njëjtë për të gjitha entitetet |
| Auto-ID Generation | Gjenerim automatik i ID-ve, siguron unike |

## Rrjedha e të Dhënave

### Leximi i të dhënave:

Kërkesa e Përdoruesit → ConsoleUI → Repository.GetAll() → CSV File → Kthimi i të Dhënave

### Shkrimi i të dhënave:

Input i Përdoruesit → ConsoleUI → Repository.Add() → CSV File → Ruajtja e Ndryshimeve


## Teknologjitë

| Teknologjia | Versioni | Përshkrimi |
|-------------|----------|------------|
| C# | 12.0 | Gjuha programuese |
| .NET | 8.0 | Framework |
| CSV | - | Formati i ruajtjes së të dhënave |
| Git | - | Version control |
| GitHub | - | Hosting i repository-t |

## Përmirësime të Ardhshme

| Përmirësimi | Prioriteti |
|-------------|------------|
| Migrimi në SQL Database (Entity Framework) | I Lartë |
| Shtimi i Unit Tests (xUnit) | I Lartë |
| Authentication me JWT dhe password hashing (BCrypt) | I Lartë |
| Web API (ASP.NET Core) | I Mesëm |
| Async Methods (GetAllAsync, AddAsync) | I Mesëm |
| Caching Layer | I Ulët |
| Transaction Support | I Ulët |

## Përfitimet e Kësaj Arkitekture

| Përfitimi | Përshkrimi |
|-----------|------------|
| **Testability** | Çdo shtresë mund të testohet veçmas |
| **Maintainability** | Ndarja e qartë e bën mirëmbajtjen më të lehtë |
| **Flexibility** | Mund të ndërrojmë implementime lehtë (CSV → SQL) |
| **Scalability** | Mund të shkallëzohet nga lokal në cloud |
| **Code Reusability** | Core mund të ripërdoret për frontende të ndryshme |

## 🎯 SOLID Principles Applied

| Principle | Implementation in Glow Book |
|-----------|----------------------------|
| **S**ingle Responsibility | 4 projekte të ndara: Core (domain), Infrastructure (data), Application (logic), ConsoleUI (presentation). Çdo shtresë ka vetëm një përgjegjësi. |
| **O**pen/Closed | `IRepository<T>` është e hapur për extension (mund të shtojmë `SqlRepository<T>`), por e mbyllur për modification. |
| **L**iskov Substitution | `FileRepository<T>` mund të zëvendësojë `IRepository<T>` pa ndryshuar asnjë rresht kodi në shtresat e larta. |
| **I**nterface Segregation | `IRepository<T>` ka metoda të fokusuara (GetAll, GetById, Add, Update, Delete) – jo një interface të madhe dhe të panevojshme. |
| **D**ependency Inversion | Core nuk varet nga Infrastructure. Të dyja varen nga abstraksioni (`IRepository<T>`). Dependencies point inward. |

### Code Examples

#### Dependency Inversion
```csharp
// Core layer - defines abstraction
public interface IRepository<T> { ... }

// Infrastructure layer - implements abstraction
public class FileRepository<T> : IRepository<T> { ... }

// Application layer - depends on abstraction, not concrete
public class AppointmentService
{
    private readonly IRepository<Appointment> _repo;
    public AppointmentService(IRepository<Appointment> repo) { ... }
}

// Open for extension - we can add SQL implementation
public class SqlRepository<T> : IRepository<T> { ... }

// Closed for modification - no changes needed in existing code
// The IRepository interface remains unchanged

Versioni: 1.0
Data: March 25, 2026