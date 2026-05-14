# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

GlowBook is a Nail Salon Management System built with .NET 8 (C# 12), Clean Architecture, and Repository Pattern. Data is stored in CSV files (no database needed). The frontend is vanilla HTML/CSS/JS.

### Prerequisites

- .NET 8 SDK (API and all library projects target `net8.0`)
- .NET 9 SDK (test project targets `net9.0`)
- Both are installed at `/usr/share/dotnet` with a symlink at `/usr/local/bin/dotnet`

### Running the Application

**API server** (port 8080):
```bash
dotnet run --project GlowBook.API
```
The API serves Swagger UI at the root URL (`/`). CSV data files are auto-created in `<cwd>/Database/`.

**Frontend** (port 5500):
```bash
cd Frontend && python3 -m http.server 5500
```
Pages are under `Frontend/pages/` (e.g., `index.html` is the login page). CORS is already configured for `localhost:5500`.

**Important**: The frontend's API URL in `Frontend/js/role.js` is hardcoded to the Render.com deployment URL. For local dev, the frontend uses a local fallback mode via `localStorage` when the remote API is unreachable. To fully connect to the local API, change `GB.API` in `role.js` to `http://localhost:8080/api`.

### Testing

```bash
dotnet test GlowBook.Tests/GlowBook.Tests.csproj
```
All 19 tests are xUnit unit tests covering CRUD, search, filter, and statistics operations.

### Building

```bash
dotnet build GlowBook.API/GlowBook.API.csproj
```

### Key Gotchas

- No `.sln` file exists. Build/restore individual `.csproj` files directly.
- `GlowBook.ConsoleUI` has hardcoded Windows paths and will not work on Linux.
- JWT key is configured in `GlowBook.API/appsettings.json` with a default test key.
- The API listens on `0.0.0.0:8080` by default (or `$PORT` env var).
