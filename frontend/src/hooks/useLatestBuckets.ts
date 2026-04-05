import { useEffect, useRef, useState } from 'react'
import type { DataPoint } from '../types/cpu'

interface UseLatestBucketsResult {
  currentPoints: DataPoint[]
  prevPoints: DataPoint[]
  loading: boolean
  error: Error | null
}

const MAX_POINTS = 60
const TICK_MS = 1000

function randomCpu(): number {
  return Math.round(Math.random() * 60 + 10) // 10–70 %
}

function generateInitialPoints(count: number): DataPoint[] {
  const now = Date.now()
  const points: DataPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    points.push({ ts: now - i * TICK_MS, v: randomCpu() })
  }
  return points
}

export function useLatestBuckets(maxPoints: number): UseLatestBucketsResult {
  const [currentPoints, setCurrentPoints] = useState<DataPoint[]>(() =>
    generateInitialPoints(Math.min(maxPoints, MAX_POINTS)),
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const point: DataPoint = { ts: Date.now(), v: randomCpu() }
      setCurrentPoints((prev) => [...prev.slice(-(maxPoints - 1)), point])
    }, TICK_MS)

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [maxPoints])

  return { currentPoints, prevPoints: [], loading: false, error: null }
}
