/**
 * "Scans over time" line chart - a single series (there is only
 * one thing being measured: how many scans happened that day), so
 * per the dataviz method this needs no legend, just a clear title
 * and a hover crosshair + tooltip so an exact value is always one
 * hover away.
 */

import { useMemo, useState } from 'react';

export interface ScanTrendPoint {
  date: string;
  count: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 };

export function ScanTrendChart({ data }: { data: ScanTrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  // Round the axis ceiling up to a friendlier number than the raw max.
  const yMax = Math.max(4, Math.ceil(maxCount / 4) * 4);

  const points = useMemo(
    () =>
      data.map((d, i) => {
        const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * plotWidth;
        const y = PADDING.top + plotHeight - (d.count / yMax) * plotHeight;
        return { x, y, ...d };
      }),
    [data, plotWidth, plotHeight, yMax]
  );

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${
    PADDING.top + plotHeight
  } L ${points[0]?.x ?? 0} ${PADDING.top + plotHeight} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Show at most ~7 x-axis labels, evenly spaced, so 14-30 days
  // of dates never overlap each other.
  const labelStride = Math.max(1, Math.ceil(data.length / 7));

  function handleMove(event: React.MouseEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const fraction = relativeX / rect.width;
    const index = Math.round(fraction * (data.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Scans recorded per day over the last two weeks"
      >
        {/* ---------- Gridlines ---------- */}
        {gridLines.map((fraction) => {
          const y = PADDING.top + plotHeight * (1 - fraction);
          return (
            <line
              key={fraction}
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y}
              y2={y}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
          );
        })}

        {/* ---------- Y-axis labels ---------- */}
        {gridLines.map((fraction) => (
          <text
            key={fraction}
            x={PADDING.left - 8}
            y={PADDING.top + plotHeight * (1 - fraction) + 3}
            textAnchor="end"
            fontSize={10}
            fill="#898781"
          >
            {Math.round(yMax * fraction)}
          </text>
        ))}

        {/* ---------- Area + line ---------- */}
        <path d={areaPath} fill="#2a752c" fillOpacity={0.08} stroke="none" />
        <path d={linePath} fill="none" stroke="#2a752c" strokeWidth={2} strokeLinejoin="round" />

        {/* ---------- X-axis labels ---------- */}
        {points.map((p, i) =>
          i % labelStride === 0 || i === points.length - 1 ? (
            <text
              key={p.date}
              x={p.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#898781"
            >
              {new Date(p.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </text>
          ) : null
        )}

        {/* ---------- Hover crosshair ---------- */}
        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={PADDING.top + plotHeight}
              stroke="#c3c2b7"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill="#2a752c" stroke="#ffffff" strokeWidth={2} />
          </>
        )}

        {/* ---------- Invisible hover-capture layer ---------- */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <p className="font-medium text-gray-900">
            {new Date(hovered.date).toLocaleDateString('en-PH', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-gray-500">{hovered.count} scan{hovered.count === 1 ? '' : 's'}</p>
        </div>
      )}
    </div>
  );
}
