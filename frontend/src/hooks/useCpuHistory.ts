import { useEffect, useMemo, useRef, useState } from 'react'
import { useLatestBuckets } from './useLatestBuckets'
import type { CpuHistory, DataPoint } from '../types/cpu'

const DEFAULT_MAX_POINTS = 60
const LIVE_THRESHOLD_MS = 2000

export function useCpuHistory(maxPoints: number = DEFAULT_MAX_POINTS): CpuHistory {
  const { currentPoints, prevPoints, loading, error } = useLatestBuckets(maxPoints)
  const [isLive, setIsLive] = useState(false)
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const history = useMemo<DataPoint[]>(() => {
    const needed = maxPoints - currentPoints.length
    const merged: DataPoint[] =
      needed > 0
        ? [...prevPoints.slice(-needed), ...currentPoints]
        : currentPoints

    return [...merged].sort((a, b) => a.ts - b.ts)
  }, [currentPoints, prevPoints, maxPoints])

  const lastUpdated = history.length > 0 ? history[history.length - 1].ts : null

  // Watchdog: mark live on every new data point, reset timeout.
  useEffect(() => {
    if (lastUpdated === null) return

    setIsLive(true)

    if (watchdogRef.current !== null) clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(() => setIsLive(false), LIVE_THRESHOLD_MS)

    return () => {
      if (watchdogRef.current !== null) clearTimeout(watchdogRef.current)
    }
  }, [lastUpdated])

  const cpu = history.length > 0 ? history[history.length - 1].v : null

  return { cpu, history, loading, error, lastUpdated, isLive }
}
