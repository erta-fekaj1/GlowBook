# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

GlowBook is a full-stack Nail Salon booking platform. The backend is Node.js + Express + MongoDB (Mongoose). The frontend is vanilla HTML/CSS/JS, served by the backend on the same port. Legacy .NET projects remain in the repo but are not actively used.

### Prerequisites

- **Node.js** (v22+ available via nvm/system)
- **MongoDB 8.0** installed at system level; data dir at `/data/db`
- `backend/.env` must exist (copy from `backend/.env.example`)

### Running the Backend

```bash
# Start MongoDB first (in a background tmux session):
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017

# Then start the app:
npm --prefix backend start
```

The server listens on `http://localhost:3000` (configurable via `PORT` in `.env`). It serves both the API (`/api/*`) and the frontend (static files from `Frontend/`). Swagger is not used; see `README.md` for the full API route list.

On first start, the seed script auto-creates an admin user (`admin@glowbook.com` / `admin123`) and 5 default services.

### Running Tests

```bash
npm --prefix backend test
```

Tests use **Jest** + **mongodb-memory-server** (no external MongoDB needed for tests). The `mongodb-memory-server` binary is cached at `~/.cache/mongodb-binaries/` after first download.

### Key Environment Variables (backend/.env)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Server listen port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/glowbook` | MongoDB connection string |
| `JWT_SECRET` | `dev-glowbook-secret-change-me` | JWT signing key |
| `JWT_EXPIRES_IN` | `7d` | JWT token lifetime |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

### Gotchas

- MongoDB must be running before `npm --prefix backend start`; otherwise you get `ECONNREFUSED 127.0.0.1:27017`.
- The backend serves the frontend directly — no separate static file server needed.
- The `.env` file is git-ignored; create it from `.env.example` on fresh setup.
- Legacy `.NET` projects (`GlowBook.API/`, `GlowBook.Core/`, etc.) still exist in the repo but are not part of the current active stack.
