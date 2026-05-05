# 📋 Demo Plan — GlowBook

---

## 1. Titulli i Projektit

**GlowBook** — Sistem i Menaxhimit të Sallonit të Thonjve  
*Nail Salon Management System*

---

## 2. Problemi që Zgjidh

Sallonët e thonjve ende menaxhojnë takimet me telefon, letra dhe mesazhe WhatsApp.
Kjo sjell probleme reale çdo ditë:

- **Rezervimet humbasin** — klienti e kujton një datë, pronari tjetrën
- **Nuk ka histori** — pronari nuk di sa klientë ka, çfarë shërbimesh janë bërë, sa është fitimi
- **Klientët nuk e dinë çfarë shërbimesh ofrohen** — s'ka çmime, s'ka galeri të dizajneve
- **Nuk ka ndarje rolesh** — çdokush sheh çdo gjë, ose s'sheh asgjë

**GlowBook e zgjidh këtë** duke ofruar një sistem të plotë web ku pronari (Admin) menaxhon gjithçka, dhe klientët rezervojnë vetë pa nevojë për telefonatë.

---

## 3. Përdoruesit Kryesorë

| Roli | Kush është | Çfarë bën |
|------|-----------|-----------|
| **👑 Admin** | Pronari i sallonit | Menaxhon takimet, shërbimet, përdoruesit, galerinë |
| **🙋 Klient** | Klienti i sallonit | Regjistrohet, rezervon takim, paguan, shikon historikun |

---

## 4. Flow-i që do ta Demonstrojmë

### Flow kryesor i zgjedhur:
**`Login → Dashboard → Rezervim → Pagim → Konfirmim`**

### Hapat konkret:

```
1. Hap index.html → Login si Admin (admin@glowbook.com / admin123)
2. Shiko Admin Panel → statistikat live (users, takime, pagesa)
3. Shko te Takimet → Shto takim të ri për një klient
4. Shko te Pagesa → Zgjidhni takimin → plotësoni kartën → Konfirmo
5. Kthehu te Dashboard → shiko që takimi u shënua si "Done"
6. Logout → Login si Klient → shiko që klienti sheh vetëm të dhënat e veta
```

### Pse e zgjodhëm pikërisht këtë flow?

Sepse tregon **gjithçka njëherësh**:
- ✅ Autentifikimin dhe sistemin e roleve
- ✅ CRUD-in (shto, shiko, përditëso)
- ✅ Ndarjen Admin / Klient live
- ✅ Persistencën me localStorage (rifresko faqen — të dhënat mbeten)
- ✅ Validimin e formave (karta, CVV, data skadimit)
- ✅ UI/UX konsistente në të gjitha faqet

---

## 5. Një Problem Real që e Kemi Zgjidhur

### ❌ Problemi
**Login-i si Admin nuk funksiononte fare.**

Kur shkruanim `admin@glowbook.com` dhe `admin123`, shfaqej gabimi:
> *"Email ose fjalëkalim i gabuar!"*

edhe pse kredencialet ishin 100% korrekte.

### 📍 Ku ishte problemi
API-ja e backend-it (Render.com) kthente **HTTP 403** me tekstin `"Host not in allowlist"` — jo një gabim rrjeti, por një përgjigje valide.

Kodi i vjetër bënte:
```javascript
try {
    const res = await fetch(API + '/auth/login', ...)
    if (res.ok) {
        // login sukses
    } else {
        showError('Email ose fjalëkalim i gabuar!') // ← ndal këtu
    }
} catch {
    tryLocalLogin() // ← kurrë nuk arrinte këtu
}
```

Meqë `fetch()` **nuk hodhi exception** (serveri u përgjigj me 403), `catch{}` nuk ekzekutohej, dhe fallback-u lokal nuk aktivizohej kurrë.

### ✅ Si e Zgjidhëm

Ndamë logjikën në tre shtresa të qarta:

```javascript
// 1. Kontrollo Content-Type — nëse nuk është JSON, trajto si server i bllokuar
const contentType = res.headers.get('content-type') || '';
if (!contentType.includes('application/json') && !res.ok) {
    return null; // → shko te localStorage login
}

// 2. Nëse API kthen null → provo kredencialet lokale
const localResult = localLogin(email, password);

// 3. Kredencialet admin të ruajtura lokalisht me hash
const LOCAL_USERS = [
    { email: 'admin@glowbook.com', passwordHash: _hash('admin123'), role: 'Admin' }
]
```

**Rezultati:** 6/6 teste kaluan ✅

| Email | Fjalëkalim | Rezultati |
|-------|-----------|-----------|
| `admin@glowbook.com` | `admin123` | 👑 Admin → admin.html |
| `ADMIN@GLOWBOOK.COM` | `admin123` | 👑 Admin (case-insensitive) |
| `admin@glowbook.com` | `gabim` | ❌ Gabim i qartë |
| `user@test.com` | `çfarëdo` | 🙋 Klient → dashboard.html |

---

## 6. Çka Mbetet Ende e Dobët

### 🔴 Dobësia kryesore: Backend i kufizuar

Projekti aktualisht funksionon **100% me localStorage** si bazë të dhënash.
Kjo do të thotë:

- **Të dhënat janë vetëm në browser** — nëse pastron cache, humbasin
- **Nuk ka sinkronizim** midis browserave ose pajisjeve të ndryshme
- **Nuk ka siguri reale** — passwordet ruhen me hash të thjeshtë, jo bcrypt

### 🟡 Gjëra të tjera që mund të forcohen:
- Faqja e galerisë ende nuk ka imazhe reale (placeholder paths)
- Nuk ka sistem notifikimesh (email konfirmimi pas rezervimit)
- Nuk ka raporte/eksport të të dhënave për pronarin

### 💡 Çfarë do të bënim nëse do të kishim kohë:
Lidhim me backend-in real (ASP.NET API tashmë ekziston) dhe heqim varësinë nga localStorage.

---

## 7. Struktura e Prezantimit (5–7 minuta)

### ⏱️ Minuta 0:00 — 0:45 | Hyrja
> *"Sistemi quhet GlowBook. Zgjidh një problem shumë konkret: sallonët e thonjve ende menaxhojnë rezervimet me telefon dhe WhatsApp. GlowBook e bën këtë online, automatikisht, me ndarje rolesh midis pronarit dhe klientit."*

- Shfaq faqen e login-it
- Shpjego dy rolet: Admin dhe Klient

---

### ⏱️ Minuta 0:45 — 3:30 | Demo Live

**Si Admin:**
1. Login → `admin@glowbook.com / admin123`
2. Admin Panel → statistikat (users, takime, pagesa)
3. Takimet → Shto takim të ri
4. Pagesa → Zgjidhni takimin → plotëso kartën → Konfirmo
5. Shiko modal-in e suksesit me ID transaksionit

**Si Klient:**
6. Logout → Regjistro llogari të re
7. Dashboard → shiko vetëm takimet e veta
8. Çdo buton admin mungon plotësisht

---

### ⏱️ Minuta 3:30 — 5:00 | Shpjegimi Teknik

> *"Sistemi është ndërtuar vetëm me HTML, CSS dhe JavaScript vanilla — pa framework. Çdo gjë ruhet në localStorage si bazë e dhënash lokale. Kemi një skedar qendror `auth.js` që menaxhon:"*

- Regjistrim / Login me hash fjalëkalimi
- Detektim automatik të rolit (Admin/Klient)
- Guard-ë: nëse klienti hap `/admin.html` manualisht, ridrejtohet
- CRUD i plotë: users, takime, shërbime, galeri, pagesa
- CSS role-based: `body.role-client [data-admin] { display: none }`

---

### ⏱️ Minuta 5:00 — 6:00 | Problemi + Zgjidhja

> *"Problemi më i madh që zgjidhëm ishte login-i i Admin-it që nuk funksiononte fare..."*

- Shpjego bug-un e API 403 (30 sekonda)
- Shpjego zgjidhjen me 3 shtresa (30 sekonda)
- Trego rezultatin: klik → login → admin.html (live)

---

### ⏱️ Minuta 6:00 — 7:00 | Mbyllja

> *"Projekti funksionon plotësisht si frontend. Hapi tjetër do të ishte lidhja me backend-in real. Sfida kryesore mbetet persistenca e të dhënave jashtë browser-it."*

- Pranoni pyetje
- Tregoni README nëse ka konfuzion

---

## 📌 Plan B — Nëse Diçka Nuk Funksionon Live

| Situata | Plan B |
|---------|--------|
| Browser nuk hap projektin | Hap nga dosja lokale me `file://` |
| localStorage u pastrua | Klik "Plotëso si Admin" → kredencialet mbushen vetë |
| Demo flow prishet | Shfaq screenshot-et në `docs/screenshots/` |
| Pyetje teknike e vështirë | *"Kjo është në listën e përmirësimeve — e kemi dokumentuar"* |

---

## 🗂️ Struktura e Projektit (për README)

```
GlowBook/
├── Frontend/
│   ├── pages/
│   │   ├── index.html        ← Login (pika hyrëse)
│   │   ├── admin.html        ← Dashboard admin (vetëm admin)
│   │   ├── dashboard.html    ← Dashboard klient
│   │   ├── appointments.html ← Rezervimet
│   │   ├── services.html     ← Shërbimet
│   │   ├── gallery.html      ← Galeria nail art
│   │   ├── payment.html      ← Pagesa
│   │   ├── users.html        ← Menaxhim users (vetëm admin)
│   │   └── profile.html      ← Profili
│   ├── css/
│   │   └── style.css         ← I vetmi CSS file
│   └── js/
│       └── auth.js           ← Sistemi qendror (auth + db + roles + ui)
└── docs/
    └── demo-plan.md          ← Ky file
```

---

## 🔑 Kredencialet Demo

| Roli | Email | Fjalëkalimi |
|------|-------|-------------|
| 👑 Admin | `admin@glowbook.com` | `admin123` |
| 🙋 Klient | Regjistrohu me çfarëdo email | Min. 4 karaktere |

---

*Dokument i përgatitur për demo live — GlowBook · 2025*