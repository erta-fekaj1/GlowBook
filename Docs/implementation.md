# 📋 Glow Book - Implementation Documentation

## 🎯 Përmbledhje

Glow Book është një sistem për menaxhimin e një saloni thonjsh, i ndërtuar me **Clean Architecture** dhe **Repository Pattern**. Ky dokumentacion përshkruan implementimin e plotë të CRUD operacioneve për entitetin User, si dhe API dhe Frontend.

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

### 3. UI — Console + Web (Ushtrimi 3)

#### Console Menu
| Opsioni | Funksioni |
|---------|-----------|
| 1 | Shiko të gjithë përdoruesit (me filtrim) |
| 2 | Shiko përdorues sipas ID |
| 3 | Shto përdorues të ri (me validim) |
| 4 | Përditëso përdorues |
| 5 | Fshij përdorues |
| 6 | Dil nga programi |

#### Web Frontend
| Funksioni | Përshkrimi |
|-----------|------------|
| **Lista** | Shfaq të gjithë përdoruesit në tabelë |
| **Filtrim** | Filtro sipas emrit dhe rolit |
| **Shto** | Formë për shtim të përdoruesit të ri |
| **Edit** | Modal për përditësim |
| **Delete** | Fshirje me konfirmim |

### 4. REST API (GlowBook.API)

| Endpoint | Metoda | Përshkrimi |
|----------|--------|------------|
| `/api/users` | GET | Merr të gjithë përdoruesit |
| `/api/users/{id}` | GET | Merr përdoruesin sipas ID |
| `/api/users` | POST | Shton përdorues të ri |
| `/api/users/{id}` | PUT | Përditëson përdoruesin |
| `/api/users/{id}` | DELETE | Fshin përdoruesin |
| `/api/services` | GET/POST/PUT/DELETE | CRUD për shërbime |
| `/api/appointments` | GET/POST/PUT/DELETE | CRUD për takime |

---

## 📸 Screenshots

### 1. Swagger UI — Të gjitha Endpoints
![Swagger UI](screenshots/swagger.png)

API e dokumentuar me Swagger, duke shfaqur të gjitha endpoints për Users, Services dhe Appointments.

---

### 2. Swagger — GET /api/users Response
![Swagger Response](screenshots/swagger-response.png)

Testimi i endpoint `GET /api/users` me përgjigje **200 OK** dhe listën e përdoruesve në format JSON.

---

### 3. Frontend — Lista e Përdoruesve
![Frontend](screenshots/frontend.png)

Web frontend me tabelën e përdoruesve, filtrat dhe butonat Edit/Delete të lidhur me API-n.

---

### 4. Terminal — API Running
![Terminal](screenshots/terminal.png)

API po funksionon te `http://localhost:5000` me të gjitha shërbimet aktive.

---

## 🔄 Rrjedha e Plotë e Aplikacionit
```
┌─────────────────────────────────────┐
│           UI LAYER                  │
│  Console Menu  +  Web Frontend      │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           API LAYER                 │
│  UsersController                    │
│  ServicesController                 │
│  AppointmentsController             │
│  CORS → localhost:5500              │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         SERVICE LAYER               │
│  UserService                        │
│  - Validime                         │
│  - Filtrim sipas emrit dhe rolit    │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        REPOSITORY LAYER             │
│  FileRepository<T>                  │
│  - GetAll(), GetById()              │
│  - Add(), Update(), Delete()        │
│  - SaveData() → CSV                 │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         DATA STORAGE                │
│  users.csv                          │
│  services.csv                       │
│  appointments.csv                   │
└─────────────────────────────────────┘
```

---

## 📁 Struktura e Projektit
```
GlowBook/
├── GlowBook.Core/            # Domain Layer
│   ├── Entities/             # User, Service, Appointment
│   └── Interfaces/           # IRepository<T>
├── GlowBook.Infrastructure/  # Data Layer
│   ├── Data/Database/        # CSV files
│   └── Repositories/         # FileRepository<T>
├── GlowBook.Application/     # Business Layer
│   └── Services/             # UserService
├── GlowBook.API/             # API Layer
│   └── Controllers/          # UsersController, ServicesController, AppointmentsController
├── GlowBook.ConsoleUI/       # Console UI Layer
│   └── Program.cs            # Menu interaktive
├── Frontend/                 # Web UI Layer
│   ├── src/index.html        # Faqja kryesore
│   ├── css/style.css         # Stilizimi
│   └── js/app.js             # Logjika JS + fetch API
└── Docs/                     # Dokumentacioni
```

---

## 📊 Përmbledhja e Ushtrimeve

| Ushtrimi | Përshkrimi | Statusi |
|----------|------------|---------|
| **Ushtrimi 1** | Model + Repository (CRUD, CSV me 5+ rekorde) | ✅ Komplet |
| **Ushtrimi 2** | Service me Logjikë (filtrim, validim) | ✅ Komplet |
| **Ushtrimi 3** | UI — Console + Web Frontend + API | ✅ Komplet |
| **Ushtrimi 4** | Dokumentimi (screenshots dhe shpjegim) | ✅ Komplet |

---

## 🎯 Përfundim

Të gjitha ushtrimet janë përfunduar me sukses:

- ✅ **Repository Pattern** i implementuar plotësisht
- ✅ **UserService** me validime dhe filtrim
- ✅ **Console Menu** interaktive me 6 opsione
- ✅ **REST API** me ASP.NET Core Web API + Swagger
- ✅ **Web Frontend** i lidhur me API përmes CORS
- ✅ **Rrjedha** UI → API → Service → Repository → File funksionon komplet
- ✅ **Dokumentimi** me screenshot dhe shpjegim

---

*Data: March 31, 2026*  
*Autori: Erta Fekaj*