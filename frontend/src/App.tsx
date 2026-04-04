import { useEffect, useState } from 'react'
import { ref, onValue, query, limitToLast } from 'firebase/database'
import { database } from './firebase'
import './App.css'

function App() {
  const [cpu, setCpu] = useState<number | null>(null)

  useEffect(() => {
    const now = new Date()
    const hourBucket = now.toISOString().slice(0, 13).replace('T', '-')
    const cpuRef = query(ref(database, `cpu_util_samples/${hourBucket}`), limitToLast(1))

    const unsub = onValue(cpuRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const latest = Object.values(data)[0] as { v: number }
        setCpu(latest.v)
      }
    })

    return () => unsub()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>CPU Monitor</h1>
      <p style={{ fontSize: '4rem', fontWeight: 'bold' }}>
        {cpu !== null ? `${cpu.toFixed(1)}%` : '...'}
      </p>
      <p style={{ fontSize: '1.5rem', color: '#888' }}>
        Idle: {cpu !== null ? `${(100 - cpu).toFixed(1)}%` : '...'}
      </p>
    </div>
  )
}

export default App
