/**
 * Password hashing for LeafScan AI.
 *
 * Every password in the system passes through this file. Keeping
 * it in one place means the cost factor and algorithm can be
 * changed once, and there is exactly one place to audit.
 */

import bcrypt from 'bcrypt';

/**
 * The bcrypt cost factor. 12 means 2^12 = 4096 internal rounds,
 * which takes roughly 250ms on typical hardware.
 *
 * Higher is more secure but slower. Lower than 10 is considered
 * inadequate today. 12 is the current common recommendation.
 */
const SALT_ROUNDS = 12;

/**
 * Turns a plaintext password into a hash for storage.
 *
 * bcrypt generates a unique random salt automatically and embeds
 * it in the returned string, so no separate salt column is needed.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Checks a typed password against a stored hash.
 *
 * bcrypt reads the salt and cost factor out of the stored hash,
 * applies them to the candidate, and compares the results using a
 * timing-safe comparison.
 *
 * Returns true only if they match.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, storedHash);
}