import { useEffect, useRef, useState } from 'react'
import {
  get,
  limitToLast,
  onValue,
  orderByKey,
  query,
  ref,
} from 'firebase/database'
import { database } from '../firebase'
import type { DataPoint, RawSample } from '../types/cpu'

/**
 * Parses a raw Firebase snapshot value (Record<string, RawSample>) into a
 * chronologically-sorted DataPoint array without any unsafe casts.
 */
function parseSnapshot(data: Record<string, RawSample>): DataPoint[] {
  return Object.entries(data)
    .map(([key, sample]): DataPoint => ({ ts: Number(key), v: sample.v }))
    .sort((a, b) => a.ts - b.ts)
}

/**
 * Type-guard that validates a Firebase snapshot value as Record<string, RawSample>.
 * Avoids `as` casts throughout the hook.
 */
function isRawBucket(val: unknown): val is Record<string, RawSample> {
  return (
    typeof val === 'object' &&
    val !== null &&
    Object.values(val).every(
      (v) => typeof v === 'object' && v !== null && typeof (v as RawSample).v === 'number',
    )
  )
}

interface UseLatestBucketsResult {
  currentPoints: DataPoint[]
  prevPoints: DataPoint[]
  loading: boolean
  error: Error | null
}

/**
 * Low-level hook that:
 *  1. Fetches the two latest hour-bucket keys from `cpu_util_samples` using
 *     `orderByKey + limitToLast(2)` — never downloads more than 2 buckets.
 *  2. Opens real-time `onValue` listeners on each bucket, limited to
 *     `maxPoints` entries.
 *  3. Returns raw DataPoint arrays for each bucket; merging is left to callers.
 *
 * Two buckets are used because at the start of a new hour the current bucket
 * may have fewer samples than `maxPoints`. The previous bucket fills the gap
 * so the chart always shows a full window of data.
 */
export function useLatestBuckets(maxPoints: number): UseLatestBucketsResult {
  const [currentPoints, setCurrentPoints] = useState<DataPoint[]>([])
  const [prevPoints, setPrevPoints]       = useState<DataPoint[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<Error | null>(null)

  // useRef so listener callbacks always see the latest unsub functions
  // without needing to be re-created on every render.
  const unsubCurrentRef = useRef<(() => void) | null>(null)
  const unsubPrevRef    = useRef<(() => void) | null>(null)

  useEffect(() => {
    let cancelled = false

    const bucketListQuery = query(
      ref(database, 'cpu_util_samples'),
      orderByKey(),
      limitToLast(2), // ← only the two latest buckets, never all
    )

    get(bucketListQuery)
      .then((snap) => {
        if (cancelled) return

        if (!snap.exists()) {
          setLoading(false)
          return
        }

        // snap.val() is the top-level shape: { [bucketKey]: { [ts]: RawSample } }
        const topLevel = snap.val() as Record<string, unknown>
        const bucketKeys = Object.keys(topLevel).sort() // ISO strings sort correctly
        const currentKey = bucketKeys[bucketKeys.length - 1]
        const prevKey    = bucketKeys[bucketKeys.length - 2] as string | undefined

        // Subscribe to the current (latest) bucket with real-time updates.
        unsubCurrentRef.current = onValue(
          query(ref(database, `cpu_util_samples/${currentKey}`), limitToLast(maxPoints)),
          (snapshot) => {
            const val = snapshot.val()
            setCurrentPoints(isRawBucket(val) ? parseSnapshot(val) : [])
            setLoading(false)
          },
          (err) => {
            setError(err)
            setLoading(false)
          },
        )

        // Subscribe to the previous bucket only if it exists.
        if (prevKey) {
          unsubPrevRef.current = onValue(
            query(ref(database, `cpu_util_samples/${prevKey}`), limitToLast(maxPoints)),
            (snapshot) => {
              const val = snapshot.val()
              setPrevPoints(isRawBucket(val) ? parseSnapshot(val) : [])
            },
            (err) => setError(err),
          )
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubCurrentRef.current?.()
      unsubPrevRef.current?.()
    }
  }, [maxPoints])

  return { currentPoints, prevPoints, loading, error }
}
