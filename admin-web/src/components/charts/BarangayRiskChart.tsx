/**
 * "Risk per disease, by barangay" - one horizontal stacked bar per
 * barangay, each segment a disease coloured by that disease's risk
 * level (not a decorative hue), so the CAO can see at a glance which
 * barangay is carrying the most high-risk disease pressure.
 *
 * Colours and the colour-carries-severity rationale match
 * DiseaseBreakdownChart.tsx; every segment also names its disease and
 * risk in its tooltip, so it never rides on colour alone.
 */

import type { BarangayBreakdownRow, RiskLevel } from '../../types';

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

/** Risk levels worth a legend entry here - "none" is healthy leaves, not shown. */
const LEGEND_ORDER: RiskLevel[] = ['low', 'moderate', 'high'];

export function BarangayRiskChart({ data }: { data: BarangayBreakdownRow[] }) {
  const rows = data.filter((row) => row.diseases.length > 0);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No diseased scans to break down for this filter.
      </p>
    );
  }

  const max = Math.max(...rows.map((row) => row.diseased), 1);

  return (
    <div className="space-y-4">
      {/* ---------- Legend ---------- */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND_ORDER.map((risk) => (
          <span key={risk} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: RISK_COLOR[risk] }}
            />
            {RISK_LABEL[risk]}
          </span>
        ))}
      </div>

      {/* ---------- Bars ---------- */}
      <div className="space-y-3">
        {rows.map((row) => {
          const widthPct = (row.diseased / max) * 100;

          return (
            <div key={row.barangay}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-gray-900">{row.barangay}</span>
                <span className="text-gray-500">
                  {row.diseased} diseased
                </span>
              </div>

              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="flex h-full" style={{ width: `${widthPct}%` }}>
                  {row.diseases.map((disease) => (
                    <div
                      key={disease.classLabel}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${(disease.count / row.diseased) * 100}%`,
                        backgroundColor: RISK_COLOR[disease.riskLevel],
                      }}
                      title={`${disease.displayName} — ${disease.count} (${RISK_LABEL[disease.riskLevel]})`}
                    />
                  ))}
                </div>
              </div>

              {/* ---------- Per-disease detail ---------- */}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                {row.diseases.map((disease) => (
                  <span key={disease.classLabel} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: RISK_COLOR[disease.riskLevel] }}
                    />
                    {disease.displayName} {disease.count}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
