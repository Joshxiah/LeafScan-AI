/**
 * A single statistic tile on the dashboard.
 */

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  accent?: 'default' | 'success' | 'warning' | 'danger';
  hint?: string;
}

const ACCENT_STYLES = {
  default: 'bg-leaf-50 text-leaf-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
};

export function StatCard({
  label,
  value,
  icon,
  accent = 'default',
  hint,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>

          {/* toLocaleString turns 1234 into "1,234" */}
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>

          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${ACCENT_STYLES[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
