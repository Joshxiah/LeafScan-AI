/**
 * Multi-barangay picker for the Add/Edit Agriculturist forms.
 *
 * One agriculturist can handle several barangays, so this shows the
 * chosen ones as removable chips and offers a dropdown of the
 * remaining ones to add more. It only offers the fixed barangay list
 * (backend/src/constants/barangays.ts, served via
 * farmerService.listBarangays()) - no free text, so values can't drift
 * into spelling variants.
 *
 * A chip whose barangay is no longer in the fixed list (a legacy
 * record) is shown in amber so it's clear it can't be re-saved as-is;
 * remove it, or replace it with one from the list.
 */

export function BarangayMultiSelect({
  value,
  onChange,
  barangays,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  /** The fixed list of barangays to choose from. */
  barangays: string[];
}) {
  const remaining = barangays.filter((b) => !value.includes(b));
  // Only call a value "legacy" once the list has actually loaded.
  const isLegacy = (b: string) => barangays.length > 0 && !barangays.includes(b);

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Barangays
      </span>

      <div className="mt-1 flex min-h-9 flex-wrap gap-1.5">
        {value.length === 0 ? (
          <span className="py-1.5 text-sm text-gray-400">No barangay selected</span>
        ) : (
          value.map((b) => (
            <span
              key={b}
              title={isLegacy(b) ? 'Not in the barangay list - remove it or pick one from the list' : undefined}
              className={`inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium ${
                isLegacy(b) ? 'bg-amber-50 text-amber-700' : 'bg-leaf-50 text-leaf-700'
              }`}
            >
              {b}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== b))}
                aria-label={`Remove ${b}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none hover:bg-black/10"
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      <select
        value=""
        disabled={remaining.length === 0}
        onChange={(e) => {
          if (e.target.value) onChange([...value, e.target.value]);
        }}
        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="">
          {remaining.length === 0 && barangays.length > 0
            ? 'All barangays added'
            : '+ Add a barangay…'}
        </option>
        {remaining.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}
