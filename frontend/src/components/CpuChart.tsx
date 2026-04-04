import React, { useCallback, useMemo } from 'react'
import { XYChart, LineSeries, Axis, Grid, Tooltip } from '@visx/xychart'
import type { DataPoint } from '../types/cpu'
import '../App.css'

interface CpuChartProps {
  history: DataPoint[]
}

/**
 * Pure, memoised chart component. Re-renders only when `history` reference
 * changes (guaranteed by useMemo in useCpuHistory).
 *
 * xScale uses 'time' with Date objects — passing raw ms integers directly
 * causes visx to treat them as linear numbers, breaking tick formatting.
 */
const CpuChart = React.memo(function CpuChart({ history }: CpuChartProps) {
  // Convert ts (ms) → Date once, memoised alongside history.
  const chartData = useMemo(
    () => history.map((d) => ({ ...d, date: new Date(d.ts) })),
    [history],
  )

  type ChartDatum = (typeof chartData)[number]

  const xAccessor = useCallback((d: ChartDatum) => d.date, [])
  const yAccessor = useCallback((d: ChartDatum) => d.v, [])

  const accessors = useMemo(() => ({ xAccessor, yAccessor }), [xAccessor, yAccessor])

  if (chartData.length < 2) return null

  return (
    <div className="chart-wrapper">
      <XYChart
        height={200}
        width={600}
        margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
        xScale={{ type: 'time' }}
        yScale={{ type: 'linear', domain: [0, 100] }}
      >
        <Grid columns={false} numTicks={4} stroke="rgba(255,255,255,0.08)" />

        <Axis
          orientation="bottom"
          numTicks={4}
          stroke="#666"
          tickStroke="#666"
          tickLabelProps={{ fill: '#888', fontSize: 11 }}
          label="Time"
          labelOffset={8}
          labelProps={{ fill: '#aaa', fontSize: 12, fontWeight: 600, textAnchor: 'middle' }}
        />

        <Axis
          orientation="left"
          numTicks={4}
          stroke="#666"
          tickStroke="#666"
          tickLabelProps={{ fill: '#888', fontSize: 11 }}
          tickFormat={(v: number) => `${v}%`}
          label="CPU %"
          labelOffset={40}
          labelProps={{ fill: '#aaa', fontSize: 12, fontWeight: 600, textAnchor: 'middle' }}
        />

        <LineSeries dataKey="cpu" data={chartData} stroke="#38bdf8" {...accessors} />

        <Tooltip<ChartDatum>
          snapTooltipToDatumX
          snapTooltipToDatumY
          renderTooltip={({ tooltipData }) => {
            const d = tooltipData?.nearestDatum?.datum
            return d ? <span className="chart-tooltip-value">{d.v.toFixed(1)}%</span> : null
          }}
        />
      </XYChart>
    </div>
  )
})

export default CpuChart
