# Improvement Report — GlowBook
**Autori:** Erta Fekaj  
**Data:** 18 Prill 2026

---

## Përmbledhje

Ky raport dokumenton tre përmirësime reale të implementuara në projektin GlowBook pas analizës kritike të kodit ekzistues. Çdo përmirësim është i motivuar nga një dobësi konkrete e identifikuar gjatë auditimit të projektit.

---

## Përmirësimi 1 — Password Hashing me PBKDF2
**Kategoria:** Kod / Strukturë + Siguri

### Çka ishte problemi?

Versioni i parë i projektit ruante passwordet si **plain text** direkt në skedarin CSV:

```
Id,Name,Email,Password,...
1,Admin,admin@glowbook.com,admin123,...
2,Erta Fekaj,erta@glowbook.com,1234,...
```

Kjo do të thotë që nëse dikush akseson skedarin `users.csv` — qoftë nga aksesi i drejtpërdrejtë në server, qoftë nga një backup i ekspozuar — **të gjitha llogaritë janë menjëherë të komprometuara**. Nuk ka asnjë shtresë mbrojtjeje.

### Çfarë ndryshova?

Krijova klasën `GlowBook.Application/Security/PasswordSecurity.cs` me algoritmin **PBKDF2-SHA256**:

```csharp
public static class PasswordSecurity
{
    private const int SaltSize   = 16;
    private const int KeySize    = 32;
    private const int Iterations = 100_000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        using var pbkdf2 = new Rfc2898DeriveBytes(
            password, salt, Iterations, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(KeySize);
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length != 3)
            return string.Equals(password, storedHash); // backward compat

        var salt         = Convert.FromBase64String(parts[1]);
        var expectedHash = Convert.FromBase64String(parts[2]);
        using var pbkdf2 = new Rfc2898DeriveBytes(
            password, salt, int.Parse(parts[0]), HashAlgorithmName.SHA256);
        var actualHash = pbkdf2.GetBytes(expectedHash.Length);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
```

Pastaj e integrova në `UserService.AddUser()`:
```csharp
Password = PasswordSecurity.Hash(password)
```

Dhe në `AuthService` gjatë login:
```csharp
bool isValid = PasswordSecurity.Verify(dto.Password, user.Password);
```

### Pse versioni i ri është më i mirë?

| Aspekti | Para | Pas |
|---------|------|-----|
| Ruajtja | Plain text | PBKDF2-SHA256 hash |
| Nëse CSV vidhet | Të gjitha passwordet ekspozohen | Asnjë password nuk mund të rikuperohet |
| Sulmet dictionary | Trivial | 100,000 iteracione e bëjnë brute-force jopraktik |
| Backward compatibility | — | Mbështet passwordet ekzistuese plain text |

PBKDF2 me 100,000 iteracione është standard i industrisë dhe rekomandohet nga OWASP. Çdo password ka **salt unik** — kjo do të thotë që dy përdorues me të njëjtin password kanë hash të ndryshëm.

---

## Përmirësimi 2 — Global Exception Middleware
**Kategoria:** Reliability / Error Handling

### Çka ishte problemi?

Në versionin e parë, çdo Controller duhej të kishte try-catch të veçantë për çdo endpoint:

```csharp
// Kod i përsëritur në çdo controller
[HttpGet("{id}")]
public IActionResult GetById(int id)
{
    try { ... }
    catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    catch (ArgumentException ex)    { return BadRequest(new { message = ex.Message }); }
}

[HttpPost]
public IActionResult Create([FromBody] CreateUserDto dto)
{
    try { ... }
    catch (ArgumentException ex)       { return BadRequest(new { message = ex.Message }); }
    catch (InvalidOperationException ex){ return Conflict(new { message = ex.Message }); }
}
```

Ky kod i duplikuar kishte dy probleme:
1. **DRY violation** — e njëjta logjikë e trajtimit të gabimeve kopjohej në çdo endpoint
2. **Inkonsistencë** — nëse harrohej një catch, API kthente 500 me stack trace të ekspozuar

### Çfarë ndryshova?

Krijova `GlowBook.API/Middleware/GlobalExceptionMiddleware.cs`:

```csharp
public class GlobalExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        try   { await _next(context); }
        catch (Exception ex) { await WriteErrorAsync(context, ex); }
    }

    private static async Task WriteErrorAsync(HttpContext context, Exception exception)
    {
        var (status, title) = exception switch
        {
            KeyNotFoundException      => (HttpStatusCode.NotFound,            "Resource not found"),
            ArgumentException         => (HttpStatusCode.BadRequest,          "Invalid request"),
            InvalidOperationException => (HttpStatusCode.Conflict,            "Business rule violation"),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,      "Unauthorized"),
            _                         => (HttpStatusCode.InternalServerError, "Unexpected server error")
        };

        var payload = new { type, title, status, detail = exception.Message };
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
```

Dhe e regjistrova në `Program.cs`:
```csharp
app.UseMiddleware<GlobalExceptionMiddleware>();
```

Tani Controllers janë të pastra — **asnjë try-catch**:
```csharp
[HttpGet("{id}")]
public IActionResult GetById(int id)
{
    var user = _userService.GetUserById(id); // nëse hedh exception, middleware e kap
    return Ok(user);
}
```

### Pse versioni i ri është më i mirë?

- **Eliminoi ~60 rreshta kod të duplikuar** nëpër 4 Controllers
- **Konsistencë e garantuar** — çdo exception trajtohet njëjtë kudo
- **Format standard** (RFC 7807 Problem Details) — `type`, `title`, `status`, `detail`
- **Stack trace nuk ekspozohet** kurrë tek klienti
- **Lehtë për t'u zgjeruar** — shto një rast të ri në switch dhe aplikohet kudo

---

## Përmirësimi 3 — Contracts / DTOs si Namespace i Veçantë
**Kategoria:** Kod / Strukturë + Dokumentim

### Çka ishte problemi?

Në versionin e parë, **DTOs (Data Transfer Objects)** ishin të definuara direkt brenda skedarëve të Controllers si `record` të thjeshtë në fund:

```csharp
// UsersController.cs - fund i skedarit
public record CreateUserDto(string Name, string Email, string Password, string PhoneNumber);
public record UpdateUserDto(string Name, string Email, string PhoneNumber);
```

Kjo kishte probleme strukturore:
1. **Nuk janë të ripërdorshme** — nëse dy Controllers nevojnin të njëjtin DTO, duhej kopjuar
2. **Vështirë për t'u gjetur** — një zhvillues i ri nuk dinte ku t'i kërkonte kontratat e API
3. **Shkel parimin e ndarjes së përgjegjësive** — Controller nuk duhet të definojë modelet e input/output

### Çfarë ndryshova?

Krijova folderin `GlowBook.API/Contracts/` me skedarë të veçantë për çdo entitet:

```
GlowBook.API/
└── Contracts/
    ├── UserContracts.cs        ← CreateUserDto, UpdateUserDto
    ├── AuthContracts.cs        ← LoginDto, RegisterDto, AuthResponseDto
    ├── ServiceContracts.cs     ← ServiceDto
    └── AppointmentContracts.cs ← AppointmentDto, UpdateAppointmentDto, StatusDto
```

```csharp
// AuthContracts.cs
namespace GlowBook.API.Contracts;

public record LoginDto(string Email, string Password);
public record RegisterDto(string Name, string Email, string Password, string? PhoneNumber);
public record AuthResponseDto(string Token, UserDto User, int ExpiresIn);
public record UserDto(int Id, string Name, string Email, string Role, string PhoneNumber);
```

Controllers tani importojnë nga namespace-i i dedikuar:
```csharp
using GlowBook.API.Contracts;
```

### Pse versioni i ri është më i mirë?

| Aspekti | Para | Pas |
|---------|------|-----|
| Vendndodhja | Fund i Controller file | Folder i dedikuar `Contracts/` |
| Ripërdorueshmëria | Zero | Plotë — çdo Controller mund ta importojë |
| Dokumentimi | I fshehur | Contracts janë "kontrata publike" e API |
| Navigimi | Duhet lexuar çdo Controller | Shko te `Contracts/` dhe gjej menjëherë |
| Testimi | Vështirë | DTOs mund të testohen të pavarura |

Kjo strukturë pasqyron praktikën e **"Contract-First API Design"** ku kontratat e API janë të definuara qartë dhe të ndara nga logjika e implementimit.

---

## Çka Mbetet Ende e Dobët

Megjithë përmirësimet e realizuara, projekti ka ende dobësi që kërkojnë vëmendje:

### 1. CSV si ruajtje të dhënash (problemi kryesor i pazgjidhur)
Sistemi ende përdor CSV skedarë. Kjo nënkupton:
- Nuk ka transaksione — nëse fshirja dështon në mes, të dhënat mund të korruptohen
- Race conditions nëse dy request shkruajnë njëkohësisht
- Nuk ka query optimization — çdo operacion lexon të gjithë skedarin

Zgjidhja ideale do të ishte migrimi te **SQLite** (pa server) ose **PostgreSQL** (production).

### 2. Unit Tests mungojnë për AppointmentService dhe UserService
Testet ekzistuese mbulojnë vetëm `ServiceService`. `AppointmentService` ka logjikë komplekse (kontrolli i konflikteve kohorë, validimi i datave) që nuk testohet automatikisht.

### 3. Token JWT ruhet në localStorage
`localStorage` është i cenueshëm ndaj sulmeve XSS. Alternativa e sigurt është `httpOnly cookie` i menaxhuar nga serveri, por kjo kërkon ndryshime të mëdha në arkitekturën e autentikimit.

### 4. Mungon paginimi
`GET /api/users` kthen të gjithë përdoruesit pa limit. Me 10,000+ rekorde kjo do ngadalësonte shumë sistemin. Duhet shtuar `?page=1&pageSize=10`.

### 5. Frontend nuk është plotësisht responsiv
Disa faqe (Dashboard, Appointments) ende nuk shfaqen mirë në ekrane të vogla mobile.

---

## Reflektim Personal

Ky ushtrim më bëri të kuptoj diferencën midis **shtimit të kodit** dhe **përmirësimit të kodit**. Ishte shumë më e vështirë të analizoja çka ishte gabim dhe pse, sesa të shtoja feature të reja.

Përmirësimi që më ka mësuar më shumë ishte `GlobalExceptionMiddleware`. Kisha shkruar të njëjtin try-catch dhjetëra herë pa e kuptuar se kjo ishte problem strukturor — jo vetëm ripëtim. Kur e hoqa dhe e vendosa në një vend qendror, kodi u bë dukshëm më i lexueshëm.

Gjithashtu kuptova se **siguria nuk është feature opsionale** — `PasswordSecurity` duhej të ishte implementuar nga dita e parë, jo si përmirësim i mëvonshëm. Kjo është mësim që do ta mbaj për çdo projekt të ardhshëm.

---

*Data: 18 Prill 2026*  
*Autori: Erta Fekaj*  
*GitHub: https://github.com/erta-fekaj1/GlowBook*
