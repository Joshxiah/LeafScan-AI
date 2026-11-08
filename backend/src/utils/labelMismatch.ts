/**
 * Compares the classes the Python AI service actually scored against the
 * classes labels.json says the current model has.
 *
 * The service loads its model once, at startup. If the model files are
 * swapped while it keeps running, it still answers with the OLD classes -
 * e.g. a 4-class model cannot say "not_corn", so a photo of a park comes
 * back as "Healthy 98%". Comparing the two lists is how the backend notices.
 */

/**
 * Returns null when both lists name the same classes (order does not matter,
 * the service maps each score to its label itself), otherwise one sentence
 * saying what differs.
 */
export function describeLabelMismatch(
  serviceLabels: readonly string[],
  expectedLabels: readonly string[]
): string | null {
  const service = new Set(serviceLabels);
  const expected = new Set(expectedLabels);

  const missing = [...expected].filter((label) => !service.has(label));
  const unexpected = [...service].filter((label) => !expected.has(label));

  if (missing.length === 0 && unexpected.length === 0) return null;

  const parts: string[] = [];
  if (missing.length > 0) parts.push(`it has no score for ${missing.join(', ')}`);
  if (unexpected.length > 0) parts.push(`it scored ${unexpected.join(', ')}, which labels.json does not list`);

  return `The AI service is not running the model that labels.json describes: ${parts.join('; ')}`;
}
