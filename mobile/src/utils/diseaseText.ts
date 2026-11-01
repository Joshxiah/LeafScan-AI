/**
 * Helpers for reading a disease's text fields, shared by the Diagnosis
 * screen and the Disease detail screen so both show the same content.
 */

/** Turns one blob of prose into individual bullet points. */
export function toBullets(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Favorable conditions and Impact are stored at the end of the description
 * as "Favorable conditions: ..." / "Kahimtang nga paborable sa sakit: ..."
 * and "Impact: ..." / "Epekto: ...". Favorable conditions is pulled out so
 * it can have its own heading; Impact is not shown.
 */
export function splitDescription(text: string | null): {
  description: string | null;
  favorable: string[];
} {
  if (!text) return { description: null, favorable: [] };
  const rest: string[] = [];
  let favorable: string[] = [];
  for (const paragraph of text.split(/\n{2,}/)) {
    const match = paragraph.match(
      /^(?:Favorable conditions|Kahimtang nga paborable sa sakit)\s*:\s*([\s\S]+)$/i,
    );
    if (match) favorable = match[1].split('\n').map((line) => line.trim()).filter(Boolean);
    else if (!/^(?:Impact|Epekto)\s*:/i.test(paragraph)) rest.push(paragraph);
  }
  return { description: rest.join('\n\n') || null, favorable };
}
