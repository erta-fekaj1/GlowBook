# 📋 Glow Book - Implementation Documentation

## 🎯 Përmbledhje

Glow Book është një sistem për menaxhimin e një saloni thonjsh, i ndërtuar me **Clean Architecture** dhe **Repository Pattern**. Ky dokumentacion përshkruan implementimin e plotë të CRUD operacioneve për entitetin User.

---

## ✅ Funksionalitetet e Implementuara

### 1. Model + Repository (Ushtrimi 1)

| Funksioni | Përshkrimi |
|-----------|------------|
| **GetAll()** | Lexon të gjithë përdoruesit nga CSV file |
| **GetById(id)** | Gjen përdoruesin sipas ID-së |
| **Add(user)** | Shton përdorues të ri me ID automatike |
| **Update(user)** | Përditëson të dhënat e përdoruesit |
| **Delete(id)** | Fshin përdoruesin nga lista |

### 2. Service me Logjikë (Ushtrimi 2)

| Funksioni | Validimet |
|-----------|-----------|
| **GetAllUsers()** | Filtrim sipas emrit dhe rolit |
| **GetUserById()** | Validon nëse ID > 0 dhe ekziston |
| **AddUser()** | Emri jo bosh, email format, password min 4 karaktere, email unik |
| **UpdateUser()** | Validon të dhënat dhe unicitetin e email-it |
| **DeleteUser()** | Kontrollon nëse përdoruesi ekziston |

### 3. UI Menu (Ushtrimi 3)

| Opsioni | Funksioni |
|---------|-----------|
| 1 | Shiko të gjithë përdoruesit (me filtrim) |
| 2 | Shiko përdorues sipas ID |
| 3 | Shto përdorues të ri (me validim) |
| 4 | Përditëso përdorues |
| 5 | Fshij përdorues |
| 6 | Dil nga programi |

---

## 📸 Screenshots

### 1. Fillimi i programit - Testimi i Repository Pattern

![Repository Test](screenshots/repository-test.png)

Programi fillon duke testuar repository-t dhe shfaq të dhënat ekzistuese nga CSV files.

---

### 2. Lista e përdoruesve me filtrim

![GetAll with Filter](screenshots/getall-filter.png)

**Shembull:** Listimi i të gjithë përdoruesve dhe filtrimi sipas rolit "Admin".

---

### 3. Gjetja e përdoruesit sipas ID

![GetById](screenshots/getbyid.png)

**Shembull:** Gjetja e përdoruesit me ID 1 (Admin).

---

### 4. Shtimi i përdoruesit të ri me validim

![Add User](screenshots/add-user.png)

**Shembull:** Shtimi i një përdoruesi të ri me validim të plotë.

---

### 5. Përditësimi i përdoruesit

![Update User](screenshots/update-user.png)

**Shembull:** Përditësimi i emrit të përdoruesit.

---

### 6. Fshirja e përdoruesit

![Delete User](screenshots/delete-user.png)

**Shembull:** Fshirja e përdoruesit me konfirmim.

---

## 🔄 Rrjedha e Plotë e Aplikacionit
┌─────────────────────────────────────────────────────────────────┐
│ UI LAYER │
│ Program.cs (Menu) │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ User zgjedh opsionin → thirret UserService │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVICE LAYER │
│ UserService.cs │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ - Validime (emri jo bosh, email format, password min 4) │ │
│ │ - Filtrim sipas emrit dhe rolit │ │
│ │ - Thirr repository-in për CRUD │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ REPOSITORY LAYER │
│ FileRepository.cs │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ - GetAll() - lexon CSV │ │
│ │ - GetById() - gjen sipas ID │ │
│ │ - Add() - shton dhe gjeneron ID │ │
│ │ - Update() - përditëson │ │
│ │ - Delete() - fshin │ │
│ │ - SaveData() - ruan në CSV │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ DATA STORAGE │
│ CSV Files │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ users.csv, services.csv, appointments.csv │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

## 📁 Struktura e Projektit
GlowBook/
├── GlowBook.Core/ # Domain Layer
│ ├── Entities/ # User, Service, Appointment
│ ├── Enums/ # UserRole, AppointmentStatus
│ └── Interfaces/ # IRepository<T>
├── GlowBook.Infrastructure/ # Data Layer
│ ├── Data/Database/ # CSV files
│ └── Repositories/ # FileRepository<T>
├── GlowBook.Application/ # Business Layer
│ └── Services/ # UserService
├── GlowBook.ConsoleUI/ # UI Layer
│ └── Program.cs # Menu interaktive
├── Docs/ # Dokumentacioni
└── README.md


---

## 📊 Përmbledhja e Ushtrimeve

| Ushtrimi | Përshkrimi | Statusi |
|----------|------------|---------|
| **Ushtrimi 1** | Model + Repository (CRUD, CSV me 5+ rekorde) | ✅ Komplet |
| **Ushtrimi 2** | Service me Logjikë (filtrim, validim) | ✅ Komplet |
| **Ushtrimi 3** | UI — Menu (lidhja UI → Service → Repository → File) | ✅ Komplet |
| **Ushtrimi 4** | Dokumentimi (screenshots dhe shpjegim) | ✅ Komplet |

---

## 🎯 Përfundim

Të gjitha ushtrimet janë përfunduar me sukses:

- ✅ **Repository Pattern** i implementuar plotësisht
- ✅ **UserService** me validime dhe filtrim
- ✅ **UI Menu** interaktive me 6 opsione
- ✅ **Rrjedha** UI → Service → Repository → File funksionon komplet
- ✅ **Dokumentimi** me screenshot dhe shpjegim

---

*Data: March 25, 2026*
*Autori: Erta Fekaj*