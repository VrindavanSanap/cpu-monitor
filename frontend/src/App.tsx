import { useEffect, useState } from 'react'
import { useCpuHistory } from './hooks/useCpuHistory'
import CpuChart from './components/CpuChart'
import './App.css'

const MAX_POINTS = 60
const LIVE_THRESHOLD_MS = 2000

export default function App() {
  const { cpu, history, loading, error, lastUpdated } = useCpuHistory(MAX_POINTS)
  const [now, setNow] = useState(Date.now())

  // Force re-render every second so the live status can transition to offline
  // if no new data arrives.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const isLive = lastUpdated !== null && now - lastUpdated < LIVE_THRESHOLD_MS

  return (
    <div className="app-shell">
      <h1 className="app-title">CPU Monitor</h1>

      {error && (
        <p className="app-error" role="alert">
          Failed to load data: {error.message}
        </p>
      )}

      <div className="cpu-row">
        <p className="cpu-value" aria-live="polite">
          {loading ? '…' : cpu !== null ? `${cpu.toFixed(1)}%` : '—'}
        </p>
        <div 
          className={`status-indicator ${isLive ? 'live' : 'offline'}`}
          aria-label={isLive ? 'Status: Live' : 'Status: Offline'}
        >
          <span className="dot" />
          <span className="text">{isLive ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <p className="idle-value" aria-live="polite">
        Idle:&nbsp;
        {loading ? '…' : cpu !== null ? `${(100 - cpu).toFixed(1)}%` : '—'}
      </p>

      <CpuChart history={history} />
    </div>
  )
}
