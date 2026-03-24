# 📦 Ushtrimi 3: Repository Pattern Implementation

## 🎯 Qëllimi
Implementimi i Repository Pattern për të abstraktuar aksesin në të dhëna dhe për të mundësuar ndërrimin e lehtë të storage (CSV → SQL).

## 🏗️ Struktura e Repository Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    IRepository<T>                           │
│                    (Interface)                              │
├─────────────────────────────────────────────────────────────┤
│ + GetAll(): IEnumerable<T>                                  │
│ + GetById(id): T                                            │
│ + Find(predicate): IEnumerable<T>                           │
│ + Add(entity): void                                         │
│ + Update(entity): void                                      │
│ + Delete(id): void                                          │
└─────────────────────────────────────────────────────────────┘
                              △
                              │
                              │ implements
                              │
┌─────────────────────────────────────────────────────────────┐
│                  FileRepository<T>                          │
│                 (CSV Implementation)                        │
├─────────────────────────────────────────────────────────────┤
│ - _filePath: string                                         │
│ - _data: List<T>                                            │
├─────────────────────────────────────────────────────────────┤
│ + FileRepository(filePath)                                  │
│ + GetAll(): IEnumerable<T>                                  │
│ + GetById(id): T                                            │
│ + Add(entity): void                                         │
│ + Update(entity): void                                      │
│ + Delete(id): void                                          │
│ - LoadData(): void                                          │
│ - SaveData(): void                                          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Vendodhja e Skedarëve

| Skedari | Vendodhja |
|---------|-----------|
| `IRepository.cs` | `GlowBook.Core/Interfaces/` |
| `FileRepository.cs` | `GlowBook.Infrastructure/Repositories/` |
| CSV Files | `GlowBook.Infrastructure/Data/Database/` |

## 🔧 Metodat e IRepository

| Metoda | Përshkrimi |
|--------|------------|
| `GetAll()` | Merr të gjitha entitetet |
| `GetById(int id)` | Merr entitetin sipas ID |
| `Find(Expression<Func<T, bool>> predicate)` | Gjen entitete që plotësojnë kushtin |
| `Add(T entity)` | Shton entitet të ri |
| `Update(T entity)` | Përditëson entitetin ekzistues |
| `Delete(int id)` | Fshin entitetin sipas ID |

## 💾 Formati CSV

### users.csv
```csv
Id,Name,Email,PasswordHash,PhoneNumber,Role,CreatedAt,IsDeleted
1,Erta Fekaj,erta@email.com,hash123,123456789,Customer,2026-03-24,False
```

### services.csv
```csv
Id,Name,Description,Price,DurationMinutes,IsActive
1,Gel Manicure,Gel polish application,25.00,60,True
```

### appointments.csv
```csv
Id,UserId,ServiceId,TechnicianId,AppointmentDate,EndTime,Status,Notes,CreatedAt,IsDeleted
1,1,1,1,2026-03-24 10:00,2026-03-24 11:00,Confirmed,,2026-03-23,False
```

## 🎯 Shembull Përdorimi

```csharp
// Krijo repository për User
var userRepo = new FileRepository<User>("GlowBook.Infrastructure/Data/Database/users.csv");

// Merr të gjithë përdoruesit
var allUsers = userRepo.GetAll();

// Merr përdoruesin me ID=1
var user = userRepo.GetById(1);

// Shto përdorues të ri
var newUser = new User { Name = "Klient i Ri", Email = "klient@email.com" };
userRepo.Add(newUser);

// Përditëso përdoruesin
user.Name = "Emri i Ndryshuar";
userRepo.Update(user);

// Fshij përdoruesin
userRepo.Delete(1);
```

## ✅ Përfitimet

| Përfitimi | Përshkrimi |
|-----------|------------|
| **Abstraksion** | Logjika e biznesit nuk varet nga storage |
| **Testability** | Lehtë për tu testuar me mock objects |
| **Fleksibilitet** | Mund të kalosh nga CSV në SQL pa ndryshuar kodin e biznesit |
| **Konsistencë** | E njëjta interface për të gjitha entitetet |

## 🚀 Përmirësime të Ardhshme

- [ ] Shtimi i metodave async (GetAllAsync, AddAsync)
- [ ] Implementimi me SQL Server/PostgreSQL
- [ ] Shtimi i caching layer
- [ ] Transaction support

---

*Data e Implementimit: March 24, 2026*
*Statusi: ✅ Complete*