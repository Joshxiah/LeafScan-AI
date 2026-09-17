/**
 * Barangay picker for the Add/Edit Farmer forms.
 *
 * A closed dropdown of the fixed barangay list (see
 * backend/src/constants/barangays.ts, served via
 * farmerService.listBarangays()). No free-text entry - that's what
 * used to let a barangay drift into "San Jose" / "san jose" /
 * "SAN  JOSE" variants. Reused by both the Create and Edit Farmer
 * modals so the two stay identical.
 */

export function BarangayInput({
  value,
  onChange,
  barangays,
}: {
  value: string;
  onChange: (value: string) => void;
  barangays: string[];
}) {
  // A value that isn't in the list (e.g. a legacy record from before
  // the fixed list) falls back to unselected rather than a mismatched option.
  const selectValue = barangays.includes(value) ? value : '';

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Barangay
      </span>
      <select
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
      >
        <option value="">— None selected —</option>
        {barangays.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </label>
  );
}
