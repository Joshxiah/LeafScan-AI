/** Longest number the admin forms accept: a Philippine mobile, 09XXXXXXXXX. */
export const PHONE_MAX_LENGTH = 11;

/**
 * Keeps digits only, capped at PHONE_MAX_LENGTH. Run it on every
 * keystroke so letters, spaces, dashes and "+" can't be typed or pasted
 * into a phone field.
 */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH);
}
