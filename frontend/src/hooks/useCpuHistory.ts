import { useMemo } from 'react'
import { useLatestBuckets } from './useLatestBuckets'
import type { CpuHistory, DataPoint } from '../types/cpu'

/** Default number of data points to display in the chart. */
const DEFAULT_MAX_POINTS = 60

/**
 * Domain-level hook that composes useLatestBuckets and applies the
 * merge strategy:
 *
 *   - If the current bucket already has `maxPoints` entries → show it alone.
 *   - Otherwise → backfill the tail of the previous bucket so we always
 *     display a full window of data even at the top of a new hour.
 *
 * Returns a stable, memoised `history` array to prevent downstream
 * re-renders when the data hasn't actually changed shape.
 */
export function useCpuHistory(maxPoints: number = DEFAULT_MAX_POINTS): CpuHistory {
  const { currentPoints, prevPoints, loading, error } = useLatestBuckets(maxPoints)

  const history = useMemo<DataPoint[]>(() => {
    const needed = maxPoints - currentPoints.length
    const merged: DataPoint[] =
      needed > 0
        ? [...prevPoints.slice(-needed), ...currentPoints]
        : currentPoints

    // Sort is O(n log n) but n ≤ 120, negligible; ensures correct order even
    // if Firebase returns keys out of order in edge cases.
    return [...merged].sort((a, b) => a.ts - b.ts)
  }, [currentPoints, prevPoints, maxPoints])

  const cpu = history.length > 0 ? history[history.length - 1].v : null
  const lastUpdated = history.length > 0 ? history[history.length - 1].ts : null

  return { cpu, history, loading, error, lastUpdated }
}
