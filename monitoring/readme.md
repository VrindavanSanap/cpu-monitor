# monitoring

The data-collector service for cpu-monitor. Reads host CPU utilization every second and streams it to the backend API.

## How it works

A ticker fires once per second. Each tick:
1. Reads total CPU utilization via [`gopsutil`](https://github.com/shirou/gopsutil) (`cpu.Percent`)
2. POSTs `{ utilization, timestamp }` to `BACKEND_URL/api/cpu` with an `X-API-Key` header
3. Logs the result via `slog`

A bad read or a failed POST is logged but does not stop the loop. The service shuts down cleanly on `SIGINT`/`SIGTERM`.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | Yes | — | Shared secret; must match the backend's `API_KEY` |
| `BACKEND_URL` | No | `http://localhost:8443` | Base URL of the backend |

## Running

```bash
API_KEY=your-secret go run .
```

Or with a `.env` file:

```
API_KEY=your-secret
BACKEND_URL=http://localhost:8443
```

```bash
go run .
```

## Files

| File | Purpose |
|------|---------|
| `main.go` | Entry point — sampling loop, graceful shutdown |
| `api.go` | HTTP client — serializes and POSTs each sample |
