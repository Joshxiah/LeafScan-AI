/**
 * Decides whether a browser Origin is allowed to call this API.
 *
 * Pulled out of app.ts so this security-relevant decision has its
 * own tests, independent of standing up the whole Express app.
 */

import { env } from '../config/env';

export function isAllowedOrigin(
  origin: string,
  allowedOrigins: string[] = env.allowedOrigins,
  isDevelopment: boolean = env.isDevelopment
): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Development is never reachable from outside this machine, and
  // its origins shift constantly - Vite bumps to the next free port
  // (5173, 5174, ...) whenever an old dev server is still holding
  // the last one, the mobile web build's port depends on how Expo
  // was started, and the dev machine's LAN IP changes with Wi-Fi.
  // Restricting by exact port here (an earlier version of this
  // function did) breaks the moment a stray server is left running,
  // so development trusts any origin and lets ALLOWED_ORIGINS do
  // the real restricting once NODE_ENV is not "development".
  return isDevelopment;
}
