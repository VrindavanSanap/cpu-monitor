# cpu-monitor

A real-time CPU utilization dashboard. A monitoring service samples system CPU every second, a Go backend stores and serves the data, and a React frontend visualizes it as a live rolling chart.

## Architecture

```
[System CPU]
     |
     | gopsutil (1s interval)
     v
[Monitoring Service]  --  POST /api/cpu (X-API-Key)  -->  [Backend API]
                                                                |
[Frontend]           <--  GET /api/cpu (1s poll)      --------+
```

### Services

| Service | Location | Stack |
|---------|----------|-------|
| Monitoring | `monitoring/` | Go, gopsutil |
| Backend API | `backend/` | Go, SQLite |
| Frontend | `frontend/` | React, TypeScript, Vite, Visx |

---

## Monitoring (`monitoring/`)

Reads system CPU utilization once per second and POSTs it to the backend.

- Uses [`gopsutil`](https://github.com/shirou/gopsutil) for cross-platform CPU sampling
- Attaches an `X-API-Key` header on every POST
- Logs successes and errors via `slog`; failures are non-fatal and do not stop the loop
- Shuts down cleanly on `SIGINT`/`SIGTERM`

**Environment variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | Yes | — | Shared secret; must match backend |
| `BACKEND_URL` | No | `http://localhost:8443` | Backend base URL |

---

## Backend (`backend/`)

HTTP API that accepts CPU data from the monitoring service and serves it to the frontend.

- Maintains an in-memory **ring buffer** of the last 60 seconds of samples for fast reads
- Persists every data point to **SQLite** (`app.db`)
- Requires `X-API-Key` header for write operations

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/cpu` | X-API-Key | Record a CPU data point |
| `GET` | `/api/cpu` | None | Return the last 60s of data |
| `GET` | `/api/hello` | None | Health check |

**POST /api/cpu — request body:**
```json
{
  "utilization": 45.3,
  "timestamp": "2026-04-06T10:30:45Z"
}
```

**GET /api/cpu — response:**
```json
[
  { "utilization": 40.5, "timestamp": "2026-04-06T10:30:00Z" },
  { "utilization": 42.1, "timestamp": "2026-04-06T10:30:01Z" }
]
```

**Environment variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | Yes | — | Secret key required for POST |

---

## Frontend (`frontend/`)

React dashboard that polls the backend every second and renders a live 60-second rolling chart.

- Chart built with [`@visx/xychart`](https://airbnb.io/visx/docs/xychart)
- X-axis is fixed to a 60-second window — it does not shrink as data loads in
- Live/offline status indicator: green pulsing dot when data is received within 2 seconds, gray when stale
- Displays current CPU utilization and idle percentage

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (build-time; defaults to `http://localhost:8443`) |

---

## Running Locally

### Prerequisites

- Go 1.21+
- Bun 1.0+

### 1. Backend

```bash
cd backend
API_KEY=your-secret go run .
```

### 2. Monitoring

```bash
cd monitoring
API_KEY=your-secret go run .
```

### 3. Frontend

```bash
cd frontend
bun install
VITE_API_BASE_URL=http://localhost:8443 bun run dev
```

Open `http://localhost:5173`.

---

## Project Structure

```
cpu-monitor/
├── backend/
│   ├── main.go       # Entry point, DB setup
│   ├── server.go     # HTTP handlers and routes
│   └── buffer.go     # In-memory 60s ring buffer
├── monitoring/
│   ├── main.go       # Sampling loop, shutdown handling
│   └── api.go        # HTTP client for backend
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/
        │   └── CpuChart.tsx        # Chart rendering
        ├── hooks/
        │   ├── useCpuHistory.ts    # State management, live/offline watchdog
        │   └── useLatestBuckets.ts # API polling
        └── types/
            └── cpu.ts
```
