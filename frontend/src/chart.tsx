import {
	Axis,
	Grid,
	XYChart,
	Tooltip,
	AreaSeries
} from '@visx/xychart';


interface CpuData {
	timestamp: string; // e.g. ISO string "2026-04-14T18:30:00Z" or whatever your backend sends
	utilization: number;
}

const accessors = {
	xAccessor: (d: CpuData) => new Date(d.timestamp), // ← must be Date for time scale
	yAccessor: (d: CpuData) => d.utilization,
};

const yScale = {
	type: 'linear' as const,
	domain: [0, 100], // This forces the x-axis range of data
	clamp: true
};

export default function Chart({ data }: { data: CpuData[] }) {
	if (!data.length) {
		return <div className="chart-empty">Waiting for data…</div>;
	}

	// Optional: force right edge to "now" for live wall-clock feel
	const now = new Date();
	const windowMs = 60 * 1000; // last 1 minutes (adjust as needed)
	const domainStart = new Date(now.getTime() - windowMs);

	return (
		<XYChart
			height={300}
			xScale={{
				type: 'time',           // ← changed from 'band'
				domain: [domainStart, now], // ← optional wall-clock sync
				clamp: true
				// remove domain line if you want the scale to auto-fit your data only
			}}
			yScale={yScale}
		>
			<Axis
				orientation="bottom"
				tickFormat={(date: Date) =>
					date.toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
					})
				} // nice HH:MM clock labels
				numTicks={6} // adjust as you like
			/>
			<Axis
				orientation="left"
				tickFormat={(value: number) => `${value}%`}
				numTicks={5}
			/>
			<Grid columns={false} numTicks={4} />
			<AreaSeries
				dataKey="CPU % Area"
				data={data}
				{...accessors}
				fillOpacity={0.15}
			/>
			<Tooltip
				snapTooltipToDatumX
				snapTooltipToDatumY
				showVerticalCrosshair
				showSeriesGlyphs
				renderTooltip={({ tooltipData, colorScale }) => {
					const nearest = tooltipData?.nearestDatum;
					if (!nearest) return null;
					return (
						<div>
							<div style={{ color: colorScale?.(nearest.key) ?? '#fff' }}>
								{nearest.key}
							</div>
							{accessors.xAccessor(nearest.datum as CpuData).toLocaleTimeString('en-US', {
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
							})}
							{', '}
							{accessors.yAccessor(nearest.datum as CpuData)}%
						</div>
					);
				}}
			/>
		</XYChart>
	);
}