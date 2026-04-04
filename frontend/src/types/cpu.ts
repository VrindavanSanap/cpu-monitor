/** A single CPU utilisation sample stored in Firebase. */
export interface DataPoint {
  /** Unix-ms timestamp (the Firebase key, converted to number). */
  ts: number
  /** CPU utilisation percentage, 0–100. */
  v: number
}

/** Raw shape of a single sample as stored in Firebase. */
export interface RawSample {
  v: number
}

/** Return type of useCpuHistory. */
export interface CpuHistory {
  /** Most-recent CPU %. null while first data arrives. */
  cpu: number | null
  /** Up to maxPoints samples, chronologically sorted. */
  history: DataPoint[]
  loading: boolean
  error: Error | null
  /** null if no data is available, otherwise the timestamp of the last point */
  lastUpdated: number | null
}
