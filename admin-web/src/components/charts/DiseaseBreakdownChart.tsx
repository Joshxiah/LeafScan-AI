/**
 * "Scans by disease class" - a horizontal bar per class, coloured
 * by that disease's risk level rather than an arbitrary category
 * hue. For a City Agriculture Office reviewing this, the colour
 * carrying real severity is more useful than four decorative hues
 * that mean nothing on their own - and it never rides on colour
 * alone: every bar carries a risk-level text label too.
 */

import type { RiskLevel } from '../../types';

export interface DiseaseBreakdownEntry {
  classLabel: string;
  displayName: string;
  count: number;
  riskLevel: RiskLevel;
}

/**
 * Validated with the dataviz skill's palette checker against the
 * white card surface - see index.css for the token definitions.
 */
const RISK_COLOR: Record<RiskLevel, string> = {
  none: 'var(--color-status-good)',
  low: 'var(--color-status-warning)',
  moderate: 'var(--color-status-serious)',
  high: 'var(--color-status-critical)',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  none: 'No risk',
  low: 'Low risk',
  moderate: 'Moderate risk',
  high: 'High risk',
};

export function DiseaseBreakdownChart({ data }: { data: DiseaseBreakdownEntry[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {sorted.map((entry) => {
        const widthPct = (entry.count / max) * 100;
        const sharePct = total > 0 ? Math.round((entry.count / total) * 100) : 0;

        return (
          <div key={entry.classLabel}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-gray-900">{entry.displayName}</span>
              <span className="text-gray-500">
                {entry.count} <span className="text-gray-400">({sharePct}%)</span>
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${widthPct}%`, backgroundColor: RISK_COLOR[entry.riskLevel] }}
                />
              </div>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: RISK_COLOR[entry.riskLevel] }}
              >
                {RISK_LABEL[entry.riskLevel]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
