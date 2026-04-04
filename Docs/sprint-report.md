# Sprint 2 Report — Erta Fekaj

## Çka Përfundova

### 1. Feature e Re — Kërkim, Filtrim dhe Statistika
- Implementova `ServiceService` me metodat:
  - `SearchByName()` — kërkon shërbime sipas emrit (case-insensitive)
  - `FilterByPrice()` — filtron sipas çmimit minimal dhe maksimal
  - `Search()` — kërkim i kombinuar: emri + çmimi + kohëzgjatja
  - `GetStatistics()` — kthen: total, mesatare, max, min çmim, kohëzgjatje mesatare
- Feature ndjek arkitekturën: UI → Service → Repository → File

### 2. Error Handling
- `FileRepository` tani trajton:
  - File mungon → krijon file të ri automatikisht
  - File bosh → mesazh informues, vazhdon normalisht
  - Input i gabuar → mesazh i qartë, programi nuk mbyllet
  - `UnauthorizedException` → mesazh "Nuk keni leje"
  - `IOException` → mesazh specifik për gabimin
- `ServiceService` tani trajton:
  - Emër bosh → `ArgumentException` me mesazh të qartë
  - Çmim ≤ 0 → `ArgumentException`
  - ID që nuk ekziston → `KeyNotFoundException`
  - Emër duplikat → `InvalidOperationException`

### 3. Unit Tests — 19 teste ✅
- `SearchTests` — 4 teste për SearchByName
- `FilterTests` — 3 teste për FilterByPrice
- `StatisticsTests` — 5 teste për GetStatistics
- `CrudTests` — 7 teste për Add, Delete, GetById

### 4. REST API
- `UsersController`, `ServicesController`, `AppointmentsController`
- Swagger UI: `http://localhost:5000/swagger`
- CORS konfiguruar për frontend

### 5. Web Frontend
- `login.html` — autentikim me API
- `dashboard.html` — statistika live
- `appointments.html` — CRUD i plotë
- `services.html` — CRUD i plotë
- Frontend deployuar: https://glowbook-frontend.onrender.com

---

## Çka Mbeti

- API deployment në Render.com — gabim me Dockerfile (port binding)
- Auth guard — mbrojtja e faqeve pa login
- Users page — faqja e re e përdoruesve në stilin e ri

---

## Çka Mësova

- Si të ndërtoj **Mock Repository** për teste pa file system
- Si të trajtoj **Error Handling** në të gjitha shtresat e arkitekturës
- Si të konfiguroj **CORS** për komunikim Frontend ↔ API
- Si të deployoj aplikacione në **Render.com**
- Rëndësia e **try-catch** specifike — jo vetëm `catch (Exception ex)`

---

## Screenshot

### Testet — 19/19 Kalojnë
### Swagger UI
- URL: http://localhost:5000/swagger
- Endpoints: /api/users, /api/services, /api/appointments

### Frontend Live
- URL: https://glowbook-frontend.onrender.com

---

*Data: 4 Prill 2026*
*Autori: Erta Fekaj*