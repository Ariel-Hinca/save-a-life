# Red Cross Donor Companion

Mobile-first full-stack portfolio app that turns blood donation into a long-term journey: donation history, eligibility tracking, gamification, Chart.js stats, and Tesseract.js OCR for donation documents.

> **Disclaimer:** Unofficial demo project for portfolio / educational purposes. Not affiliated with the Belgian Red Cross / Rode Kruis Vlaanderen / Croix-Rouge de Belgique.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 20, Tailwind CSS, Chart.js, Tesseract.js |
| Backend | ASP.NET Core 10 Web API, Identity, JWT |
| Data | Entity Framework Core + SQL Server |
| Infra | Docker Compose (SQL Server) |

## Features

- JWT register / login with ASP.NET Core Identity
- Donor dashboard (level, XP, lives impacted, liters donated, next eligible date)
- Donation history + manual add
- OCR scan flow (camera / upload → Tesseract.js → API parse → review → save)
- Blood test results (hemoglobin, ferritin, blood pressure, weight)
- Gamification (levels, XP, badges)
- Statistics with Chart.js (bar / pie / line + achievement progress)

## Quick start

### Prerequisites

- Node.js 20+
- .NET 10 SDK
- Docker (for SQL Server)

### 1. Start SQL Server

```bash
docker compose up -d
```

Default SA password: `RedCross_Donor_2026!` (see `docker-compose.yml`).

### 2. Run the API

```bash
cd backend/src/Api
dotnet restore
dotnet run --launch-profile http
```

API: [http://localhost:5000](http://localhost:5000)  
Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)  
OpenAPI: [http://localhost:5000/openapi/v1.json](http://localhost:5000/openapi/v1.json)

On first run, EF migrations apply automatically and seed:

- Achievements (First Drop, Life Saver, Blood Hero, Plasma Champion, 100 Lives Club)
- Demo user (see below)

### 3. Run the frontend

```bash
cd frontend
npm install
npm start
```

App (laptop): [http://localhost:4200](http://localhost:4200)

`npm start` binds to all interfaces and proxies `/api` to the ASP.NET API on port 5000, so a phone on the same Wi‑Fi can use the app without editing IPs.

### Test on your phone (same Wi‑Fi)

1. Keep Docker + API + frontend running on your laptop.
2. Find your laptop’s LAN IP:
   - macOS/Linux: `ipconfig getifaddr en0` or `hostname -I`
   - Windows: `ipconfig` → IPv4 address
3. On your phone, open `http://<LAN-IP>:4200` (example: `http://192.168.1.42:4200`).
4. Log in with the demo account below.

Notes:

- Phone and laptop must be on the same Wi‑Fi (guest/isolated networks often block this).
- Allow Node through the OS firewall if the page does not load.
- Live camera OCR may be blocked on plain HTTP; use **Upload image** on iPhone. Laptop camera still works on `localhost`.

## Demo account

```text
Email:    donor@demo.be
Password: Demo123!
```

## Project layout

```text
/
├── frontend/                 # Angular 20 SPA
├── backend/
│   ├── RedCrossDonor.sln
│   └── src/Api/              # ASP.NET Core 10 API
├── docker-compose.yml
└── README.md
```

## Main API routes

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET/PUT | `/api/user`, `/api/user/{id}` | JWT |
| GET/POST/DELETE | `/api/donations` | JWT |
| GET/POST | `/api/bloodresults` | JWT |
| POST | `/api/ocr/scan` | JWT |
| GET | `/api/stats/summary` | JWT |

## Eligibility rules (demo)

- Whole Blood: wait **120 days**
- Plasma: wait **14 days**
- Platelets: wait **14 days**

## Gamification

| Donation type | XP |
|---------------|----|
| Whole Blood | 100 |
| Plasma | 150 |
| Platelets | 200 |

Levels by successful donation count: 0 → L1, 3 → L2, 5 → L3, 10 → L4, 15 → L5, 25 → L6, 40 → L7.

## OCR flow

1. Open camera or upload an image in `/scan`
2. Tesseract.js extracts text in the browser
3. `POST /api/ocr/scan` parses donation ID, date, type, center + confidence
4. User reviews fields and saves a donation (optional blood metrics)

## UI theme

- Primary `#DC2626` · Accent `#2563EB` · Success `#16A34A` · Background `#F8FAFC`
- Mobile-first, card-based healthcare UI with bottom navigation

## Portfolio highlights

Angular · ASP.NET Core · Identity · JWT · EF Core · SQL Server · OCR · Camera · Dashboards · Chart.js · Gamification · REST APIs · Full-stack architecture
