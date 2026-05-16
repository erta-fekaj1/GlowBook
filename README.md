# GlowBook 💅

Modern salon booking platform with a premium frontend and a real backend API.

## Overview

GlowBook is a full-stack booking application for nail salons.

It includes:
- centralized booking flow (service + design + date + time + payment)
- admin control center (appointments, users, services, gallery, reviews, settings)
- reviews and loyalty logic
- scheduled appointment reminders (email/SMS-ready with dedupe)
- role-based access (admin/client)
- MongoDB persistence (no longer localStorage-only)

## Tech Stack

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing

## Repository Structure

```bash
GlowBook/
├── Frontend/                     # UI (pages, styles, client scripts)
├── backend/                      # Node/Express API
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── database/
│   ├── services/
│   └── uploads/
├── Docs/                         # project docs
├── GlowBook.Core/                # legacy .NET modules (kept in repo)
├── GlowBook.Application/
├── GlowBook.Infrastructure/
├── GlowBook.ConsoleUI/
└── README.md
```

## Quick Start

### 1) Clone

```bash
git clone https://github.com/ertafekaj/GlowBook.git
cd GlowBook
```

### 2) Configure backend env

Create:

`backend/.env`

From:

`backend/.env.example`

Example:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/glowbook
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
REMINDER_ENABLED=false
REMINDER_INTERVAL_MINUTES=30
REMINDER_LOOKAHEAD_HOURS=24
```

### 3) Install backend dependencies

### macOS / Linux / Command Prompt
```bash
npm --prefix backend install
```

### Windows PowerShell (if script policy blocks npm)
```powershell
npm.cmd --prefix backend install
```

### 4) Start backend

### macOS / Linux / Command Prompt
```bash
npm --prefix backend start
```

### Windows PowerShell
```powershell
npm.cmd --prefix backend start
```

When running, open:

`http://localhost:3000`

### 5) Run backend tests

```bash
npm --prefix backend test
```

## Default Admin Seed

Backend seed creates:

- Email: `admin@glowbook.com`
- Password: `admin123`

## API Modules

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users` (admin)
- `GET/POST/PUT/DELETE /api/services`
- `GET/POST/PUT/DELETE /api/appointments`
- `GET/POST/DELETE /api/reviews`
- `GET/POST /api/payments`
- `POST /api/payments/checkout-session`
- `POST /api/payments/webhook`
- `GET/PUT /api/settings/admin` (admin)
- `POST /api/uploads/review-image`
- `GET /api/analytics/overview` (admin)
- `GET /api/data/sync` (frontend sync payload)

## Notes

- Frontend design is intentionally kept unchanged while backend was integrated.
- Old client pages were cleaned up; legacy URLs are redirected safely.
- Backend and frontend are now clearly separated for scalability.

## Troubleshooting

### `ECONNREFUSED 127.0.0.1:27017`
MongoDB is not running. Start MongoDB service or use Atlas URI in `backend/.env`.

### `Route not found: /admin.html`
Ensure backend is started from latest code and reload browser (`Ctrl + F5`).

### PowerShell cannot run npm
Use `npm.cmd` commands or set:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## License

MIT
