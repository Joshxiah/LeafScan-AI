/**
 * "Top scans by disease class" - one horizontal bar per class,
 * longest first, with the exact count printed at the end of each bar.
 * Healthy leaves are drawn in green and diseased classes in the
 * colour of their risk level, so a glance separates "how many scans
 * found a disease" from "how many were fine".
 */

import type { DiseaseCount, RiskLevel } from '../../types';

const BAR_COLOR: Record<RiskLevel, string> = {
  none: '#2a752c',
  low: '#84a82f',
  moderate: '#e0a100',
  high: '#d64545',
};

export function DiseaseClassChart({ data }: { data: DiseaseCount[] }) {
  const rows = [...data].sort((a, b) => b.count - a.count);
  const max = Math.max(...rows.map((row) => row.count), 1);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (rows.length === 0 || total === 0) {
    return <p className="text-sm text-gray-400">No scans recorded for this period.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.classLabel} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-gray-700" title={row.displayName}>
            {row.displayName}
          </span>
          <div className="h-6 flex-1 rounded bg-gray-100">
            <div
              className="h-6 rounded"
              style={{
                width: `${(row.count / max) * 100}%`,
                minWidth: row.count > 0 ? 4 : 0,
                backgroundColor: BAR_COLOR[row.riskLevel],
              }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums text-gray-900">
            <span className="font-semibold">{row.count.toLocaleString()}</span>
            <span className="ml-1 text-xs text-gray-400">
              ({Math.round((row.count / total) * 100)}%)
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
