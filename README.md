# cpu-monitor

A real-time CPU utilization dashboard — live at **[cpu.vrindavansanap.com](https://cpu.vrindavansanap.com)**.

A monitoring agent samples system CPU every second, a Go backend stores and serves the data, and a React frontend visualizes it as a live rolling chart.

## Stack

| Layer | Tech |
|-------|------|
| Monitoring | Go, gopsutil |
| Backend API | Go, SQLite |
| Frontend | React, TypeScript, Vite, Visx |

## Running Locally

**Prerequisites:** Go 1.21+, Bun 1.0+

```bash
# Backend
cd backend && API_KEY=your-secret go run .

# Monitoring (separate terminal)
cd monitoring && API_KEY=your-secret go run .

# Frontend (separate terminal)
cd frontend && bun install && VITE_API_BASE_URL=http://localhost:8443 bun run dev
```

Open `http://localhost:5173`.

## Docs

- [Project structure & API reference](docs/projectstructure.md)
