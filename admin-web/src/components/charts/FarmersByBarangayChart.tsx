/**
 * "Registered Farmers by Barangay" - a vertical bar per barangay,
 * sorted highest first.
 *
 * Unlike DiseaseBreakdownChart/BarangayRiskChart (a handful of
 * categories, so a stack of horizontal bars fits fine), a city can
 * have dozens of barangays. Cramming that many vertical bars into a
 * fixed-width chart is what makes labels overlap and bars
 * indistinguishable, so bars keep a fixed width here and the plot
 * area scrolls horizontally on its own - the surrounding dashboard
 * card never gets wider. The Y-axis stays outside that scroll area
 * so it's always visible. A search box and a Top 10/15/All toggle
 * keep a long list navigable without ever hiding the full dataset.
 */

import { useMemo, useState } from 'react';

import type { FarmerBarangayCount } from '../../types';

const BAR_WIDTH = 40;
const BAR_GAP = 20;
const PLOT_HEIGHT = 200;
/** Reserved at the top of the plot so the value label never collides with a full-height bar. */
const VALUE_LABEL_SPACE = 18;
const LABEL_HEIGHT = 44;
const AXIS_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

type ViewMode = 'top10' | 'top15' | 'all';

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: 'Top 10 barangays', value: 'top10' },
  { label: 'Top 15 barangays', value: 'top15' },
  { label: 'All barangays', value: 'all' },
];

/** Rounds a chart's max value up to a "nice" number so axis labels read cleanly (5, 10, 20, 50, 100, ...). */
function niceAxisMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export function FarmersByBarangayChart({ data }: { data: FarmerBarangayCount[] }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(data.length > 15 ? 'top10' : 'all');

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.total - a.total || a.barangay.localeCompare(b.barangay)),
    [data]
  );

  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? sorted.filter((row) => row.barangay.toLowerCase().includes(query)) : sorted;
  }, [sorted, search]);

  const visible =
    viewMode === 'all' ? searched : searched.slice(0, viewMode === 'top10' ? 10 : 15);

  const yMax = niceAxisMax(Math.max(...visible.map((row) => row.total), 1));
  const chartHeight = PLOT_HEIGHT + LABEL_HEIGHT;

  return (
    <div>
      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search barangay…"
          aria-label="Search barangay"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
        />

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          aria-label="Number of barangays to show"
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
        >
          {VIEW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === 'all' ? `All barangays (${sorted.length})` : option.label}
            </option>
          ))}
        </select>
      </div>

      {/* ---------- Chart / no-match state ---------- */}
      {visible.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No barangay matches “{search}”.</p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-2 text-xs font-medium text-leaf-700 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs text-gray-400">
            Sorted by registered farmers, highest to lowest
            {viewMode !== 'all' && searched.length > visible.length
              ? ` — showing ${visible.length} of ${searched.length}`
              : ''}
            . Scroll the chart to see more barangays.
          </p>

          <div className="mt-2 flex">
            {/* ---------- Fixed Y-axis (never scrolls) ---------- */}
            <div
              className="relative shrink-0 select-none"
              style={{ width: 30, height: chartHeight }}
              aria-hidden="true"
            >
              {AXIS_FRACTIONS.map((fraction) => (
                <span
                  key={fraction}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-gray-400"
                  style={{ top: PLOT_HEIGHT * (1 - fraction) }}
                >
                  {Math.round(yMax * fraction)}
                </span>
              ))}
            </div>

            {/* ---------- Scrollable bars ---------- */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="relative inline-block" style={{ height: chartHeight }}>
                {AXIS_FRACTIONS.map((fraction) => (
                  <div
                    key={fraction}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: PLOT_HEIGHT * (1 - fraction) }}
                  />
                ))}

                <div className="flex" style={{ gap: BAR_GAP, paddingLeft: 4, paddingRight: 4 }}>
                  {visible.map((row) => {
                    const barHeight = Math.max(
                      (row.total / yMax) * (PLOT_HEIGHT - VALUE_LABEL_SPACE),
                      3
                    );
                    const farmerWord = row.total === 1 ? 'farmer' : 'farmers';

                    return (
                      <div
                        key={row.barangay}
                        className="flex shrink-0 flex-col items-center"
                        style={{ width: BAR_WIDTH }}
                      >
                        <div
                          className="flex w-full flex-col items-center justify-end"
                          style={{ height: PLOT_HEIGHT }}
                        >
                          <span className="mb-1 text-[11px] font-semibold tabular-nums text-gray-700">
                            {row.total}
                          </span>
                          <button
                            type="button"
                            title={`${row.barangay} — ${row.total} registered ${farmerWord}`}
                            aria-label={`${row.barangay}: ${row.total} registered ${farmerWord}`}
                            className="w-full rounded-t-md bg-leaf-600 transition-colors hover:bg-leaf-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                            style={{ height: barHeight }}
                          />
                        </div>

                        <div
                          className="mt-1.5 flex w-full justify-center"
                          style={{ height: LABEL_HEIGHT }}
                        >
                          <span
                            title={row.barangay}
                            className="line-clamp-2 break-words text-center text-[10px] leading-tight text-gray-500"
                          >
                            {row.barangay}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
