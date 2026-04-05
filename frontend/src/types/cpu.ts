/** A single CPU utilisation sample. */
export interface DataPoint {
  /** Unix-ms timestamp. */
  ts: number
  /** CPU utilisation percentage, 0–100. */
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
  /** true when data was received within the last LIVE_THRESHOLD_MS */
  isLive: boolean
}
