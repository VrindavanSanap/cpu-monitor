import { useEffect, useState } from 'react'
import { ref, onValue, query, limitToLast } from 'firebase/database'
import { database } from './firebase'
import {
  XYChart,
  LineSeries,
  Axis,
  Grid,
  Tooltip,
} from '@visx/xychart'
import './App.css'

interface DataPoint {
  ts: number
  v: number
}

const MAX_POINTS = 60

function App() {
  const [cpu, setCpu] = useState<number | null>(null)
  const [history, setHistory] = useState<DataPoint[]>([])

  useEffect(() => {
    const now = new Date()
    const hourBucket = now.toISOString().slice(0, 13).replace('T', '-')
    const cpuRef = query(ref(database, `cpu_util_samples/${hourBucket}`), limitToLast(MAX_POINTS))

    const unsub = onValue(cpuRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const points: DataPoint[] = Object.entries(data).map(([ts, val]) => ({
          ts: Number(ts),
          v: (val as { v: number }).v,
        }))
        points.sort((a, b) => a.ts - b.ts)
        setCpu(points[points.length - 1].v)
        setHistory(points)
      }
    })

    return () => unsub()
  }, [])

  const accessors = {
    xAccessor: (d: DataPoint) => d.ts,
    yAccessor: (d: DataPoint) => d.v,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '8px' }}>
      <h1>CPU Monitor</h1>
      <p style={{ fontSize: '4rem', fontWeight: 'bold', margin: 0 }}>
        {cpu !== null ? `${cpu.toFixed(1)}%` : '...'}
      </p>
      <p style={{ fontSize: '1.5rem', color: '#888', margin: 0 }}>
        Idle: {cpu !== null ? `${(100 - cpu).toFixed(1)}%` : '...'}
      </p>

      {history.length > 1 && (
        <XYChart
          height={200}
          width={600}
          margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
          xScale={{ type: 'time' }}
          yScale={{ type: 'linear', domain: [0, 100] }}
        >
          <Grid columns={false} numTicks={4} stroke="rgba(255,255,255,0.1)" />
          <Axis orientation="bottom" numTicks={4} stroke="#999" tickStroke="#999" tickLabelProps={{ fill: '#555', fontSize: 11 }} label="Time" labelOffset={8} labelProps={{ fill: '#222', fontSize: 13, fontWeight: 600, textAnchor: 'middle' }} />
          <Axis orientation="left" numTicks={4} stroke="#999" tickStroke="#999" tickLabelProps={{ fill: '#555', fontSize: 11 }} tickFormat={(v) => `${v}%`} label="CPU %" labelOffset={40} labelProps={{ fill: '#222', fontSize: 13, fontWeight: 600, textAnchor: 'middle' }} />
          <LineSeries dataKey="cpu" data={history} stroke="#000000" {...accessors} />
          <Tooltip
            snapTooltipToDatumX
            snapTooltipToDatumY
            renderTooltip={({ tooltipData }) => {
              const d = tooltipData?.nearestDatum?.datum as DataPoint | undefined
              return d ? <span style={{ color: '#00e5ff' }}>{d.v.toFixed(1)}%</span> : null
            }}
          />
        </XYChart>
      )}
    </div>
  )
}

export default App
