import { useEffect, useRef, useState } from 'react'
import type { DataPoint } from '../types/cpu'

interface UseLatestBucketsResult {
  currentPoints: DataPoint[]
  prevPoints: DataPoint[]
  loading: boolean
  error: Error | null
}

const POLL_MS = 1000
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8443'

interface CPUDataPoint {
  utilization: number
  timestamp: string
}

function toDataPoint(d: CPUDataPoint): DataPoint {
  return { ts: new Date(d.timestamp).getTime(), v: d.utilization }
}

export function useLatestBuckets(_maxPoints: number): UseLatestBucketsResult {
  const [currentPoints, setCurrentPoints] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/cpu`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw: CPUDataPoint[] = await res.json()
        setCurrentPoints(raw.map(toDataPoint))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    poll()
    timerRef.current = setInterval(poll, POLL_MS)
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [])

  return { currentPoints, prevPoints: [], loading, error }
}
