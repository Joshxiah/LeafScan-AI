/**
 * Helpers for an agriculturist's service area - the list of barangays
 * they handle (one agriculturist can cover several).
 */

/** True when both lists hold the same barangays, ignoring order. */
export function sameBarangays(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((barangay) => set.has(barangay));
}

/**
 * "Danlugan, Dao +1 more" - the first `max` barangays, then a count of
 * the rest, so a long service area still fits in a table cell or a
 * dropdown option. Empty list -> "—".
 */
export function formatServiceArea(barangays: string[], max = 2): string {
  if (barangays.length === 0) return '—';
  if (barangays.length <= max) return barangays.join(', ');
  return `${barangays.slice(0, max).join(', ')} +${barangays.length - max} more`;
}
