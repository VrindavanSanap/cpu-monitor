import { useCpuHistory } from './hooks/useCpuHistory'
import CpuChart from './components/CpuChart'
import './App.css'

const MAX_POINTS = 60

export default function App() {
  const { cpu, history, loading, error, isLive } = useCpuHistory(MAX_POINTS)

  return (
    <div className="app-shell">
      <h1 className="app-title">CPU Monitor</h1>

      {error && (
        <p className="app-error" role="alert">
          Failed to load data: {error.message}
        </p>
      )}

      <div className="cpu-row">
        <p className="cpu-value">
          {loading ? '…' : cpu !== null ? `${cpu.toFixed(1)}%` : '—'}
        </p>
        <div
          className={`status-indicator ${isLive ? 'live' : 'offline'}`}
          aria-live="polite"
          aria-label={isLive ? 'Status: Live' : 'Status: Offline'}
        >
          <span className="dot" />
          <span className="text">{isLive ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <p className="idle-value">
        Idle:&nbsp;
        {loading ? '…' : cpu !== null ? `${(100 - cpu).toFixed(1)}%` : '—'}
      </p>

      <CpuChart history={history} />
    </div>
  )
}
