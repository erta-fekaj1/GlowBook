# Project Audit — GlowBook
**Autori:** Erta Fekaj  
**Data:** 15 Prill 2026

---

## 1. Përshkrimi i Shkurtër i Projektit

### Çka bën sistemi?
GlowBook është një sistem menaxhimi për salon thonjsh (nail salon) i ndërtuar me **C# .NET 8** dhe **arkitekturë të shtresëzuar**. Sistemi lejon menaxhimin e përdoruesve, takimeve, shërbimeve dhe ofron një web frontend të lidhur me REST API.

### Kush janë përdoruesit kryesorë?
- **Admin** — menaxhon të gjithë sistemin (përdorues, takime, shërbime)
- **Customer** — rezervon takime dhe shikon shërbimet e disponueshme

### Funksionaliteti kryesor
- Regjistrim dhe autentikim me JWT Token
- CRUD i plotë për Users, Services, Appointments
- Dashboard me statistika live
- Nail Art Gallery me filtrim
- REST API me Swagger dokumentim
- Unit Tests me 19 teste (xUnit)

---

## 2. Çka Funksionon Mirë

1. **Arkitektura e shtresëzuar (Clean Architecture)** — ndarja e qartë midis Core, Infrastructure, Application dhe API e bën kodin të organizuar dhe të mirëmbajtur

2. **Repository Pattern** — `FileRepository<T>` është generic dhe ripërdoret për çdo entitet pa kod të dyfishuar

3. **Error Handling në Repository** — `FileRepository` trajton të gjitha rastet: file mungon, file bosh, input i gabuar, UnauthorizedException, IOException — programi nuk crashon kurrë

4. **Unit Tests** — 19 teste me xUnit që mbulojnë SearchByName, FilterByPrice, GetStatistics, CRUD me validim dhe raste kufitare

5. **JWT Authentication** — login kthen token, `auth.js` e menaxhon në të gjitha faqet dhe ridrejton te login nëse token mungon

6. **Web Frontend i plotë** — 7 faqe (Login, Dashboard, Appointments, Services, Users, Profile, Gallery) të lidhura me API përmes `authFetch()`

---

## 3. Dobësitë e Projektit

### Dobësi 1 — Ruajtja e të dhënave në CSV (jo database reale)
Sistemi përdor CSV skedarë si "database". Kjo ka probleme serioze:
- Nuk mbështet query-e komplekse
- Nëse dy përdorues shkruajnë njëkohësisht, të dhënat mund të korruptohen (race condition)
- Nuk ka transaksione — nëse fshirja dështon në mes, të dhënat mbeten të paplotë
- Çmimi: çdo operacion lexon/shkruan të gjithë skedarin

### Dobësi 2 — Passwordet ruhen si plain text
Në `users.csv`, passwordet ruhen pa enkriptim:

Nëse dikush akseson skedarin CSV, të gjitha passwordet janë të lexueshme. Duhet të përdoret **BCrypt** ose **SHA-256 hashing**.

### Dobësi 3 — Validimi i inputit në Frontend është i mangët
Forma e login dhe regjistrim validon vetëm fushat bosh dhe gjatësinë e password. Nuk ka:
- Validim të formatit të email-it (regex)
- Sanitizim të inputit (XSS protection)
- Rate limiting (dikush mund të provojë 1000 password radhazi)

### Dobësi 4 — Unit Tests nuk mbulojnë AppointmentService
Kemi 19 teste vetëm për `ServiceService`. `AppointmentService` dhe `UserService` nuk kanë teste, megjithëse kanë logjikë validimi komplekse (kontrolli i konflikteve të takimeve, validimi i datave).

### Dobësi 5 — Token JWT ruhet në localStorage
`localStorage` është i ekspozuar ndaj sulmeve XSS. Nëse një skript i keq injektohet në faqe, mund ta vjedhë tokenin. Alternativa më e sigurt është `httpOnly cookie`.

### Dobësi 6 — Nuk ka paginim (pagination)
Nëse sistemi ka 1000+ përdorues ose takime, API i kthen të gjithë njëherësh. Kjo ngadalëson si API-n ashtu edhe frontend-in. Duhet shtuar `?page=1&pageSize=10`.

### Dobësi 7 — CORS lejon `"null"` origin
Në `Program.cs`:
```csharp
"null" // file:// (hapja direkte e HTML)
```
Kjo është rrezik sigurie — lejon çdo faqe të hapura si file lokale të komunikojë me API-n.

---

## 4. Tre Përmirësimet që do t'i Implementoj

### Përmirësimi 1 — Password Hashing me BCrypt

**Problemi:** Passwordet ruhen si plain text në CSV. Nëse skedari vidhet, të gjitha llogaritë janë të komprometuara.

**Zgjidhja:**
```csharp
// Gjatë regjistrimit
string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

// Gjatë login
bool isValid = BCrypt.Net.BCrypt.Verify(inputPassword, hashedPassword);
```

**Pse ka rëndësi:** Siguria e të dhënave të përdoruesve është detyrim ligjor (GDPR) dhe etik. Hashing është standardi minimal i industrisë.

---

### Përmirësimi 2 — Unit Tests për AppointmentService

**Problemi:** `AppointmentService` ka logjikë komplekse (kontrolli i konflikteve, validimi i datave) por nuk ka asnjë test. Nëse dikush ndryshon kodin, gabimet nuk zbulohen automatikisht.

**Zgjidhja:** Shto minimum 5 teste:
```csharp
[Fact]
public void Add_PastDate_ThrowsArgumentException()
{
    var service = CreateService();
    Assert.Throws<ArgumentException>(() =>
        service.Add(1, 1, DateTime.Now.AddDays(-1), ""));
}

[Fact]
public void Add_ConflictingTime_ThrowsInvalidOperationException()
{
    // Shto dy takime në të njëjtën kohë
}

[Fact]
public void UpdateStatus_InvalidStatus_ThrowsException() { }

[Fact]
public void GetStatistics_ReturnsCorrectCounts() { }

[Fact]
public void GetUpcoming_ReturnsOnlyFutureAppointments() { }
```

**Pse ka rëndësi:** Testet automatike parandalojnë regresione — ndryshimet e reja nuk prishin funksionalitetin ekzistues.

---

### Përmirësimi 3 — Paginim në API

**Problemi:** `GET /api/users` kthen të gjithë përdoruesit pa limit. Me 10,000 rekorde kjo do ngadalësonte sisteminë rëndë.

**Zgjidhja:**
```csharp
// Controller
[HttpGet]
public IActionResult GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
{
    var all    = _userService.GetAllUsers();
    var paged  = all.Skip((page - 1) * pageSize).Take(pageSize);
    return Ok(new {
        data       = paged,
        total      = all.Count,
        page       = page,
        totalPages = (int)Math.Ceiling(all.Count / (double)pageSize)
    });
}
```

**Pse ka rëndësi:** Performanca e API-t ndikon drejtpërdrejt në përvojën e përdoruesit. Paginimi është standard në çdo API profesionale.

---

## 5. Një Pjesë që Ende Nuk e Kuptoj Plotësisht

**JWT Token Refresh dhe Expiry Handling**

E kuptoj se si gjenerohet token-i dhe si dërgohet me çdo request. Por nuk e kuptoj plotësisht mekanizmin e **refresh token**:

- Kur token-i skadon pas 24 orësh, useri duhet të kyçet sërish
- Në sistemet profesionale ekziston koncepti i **refresh token** — një token tjetër me jetëgjatësi më të madhe (7 ditë) që gjeneron automatikisht access token të ri
- Nuk e kuptoj si implementohet kjo në mënyrë të sigurt, si ruhet refresh token (database? cookie?) dhe si sinkronizohet me frontend-in pa e ndërprerë përvojën e përdoruesit

Do të doja ta studioja këtë koncept më thellë sepse çdo aplikacion real ka nevojë për session management të mirë.

---

## Përmbledhje

| Kategoria | Statusi |
|-----------|---------|
| Arkitektura | ✅ E mirë |
| Error Handling | ✅ E mirë |
| Unit Tests | ⚠️ Jo e plotë |
| Siguria | ⚠️ Nevojitet përmirësim |
| Performanca | ⚠️ Mungon paginimi |
| Dokumentimi | ✅ E mirë |
| Frontend | ✅ E mirë |
| Database | ❌ CSV nuk është zgjidhje e shkallëzueshme |