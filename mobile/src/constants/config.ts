/**
 * Application configuration for LeafScan AI mobile.
 *
 * WHERE IS THE BACKEND?
 *
 * The backend runs on your computer at port 4000. How a device
 * reaches it depends on where the app is running:
 *
 *   - Web browser on this computer  -> http://localhost:4000
 *   - Web browser opened by LAN IP  -> that same IP, port 4000
 *   - Expo Go / dev build on a phone -> your computer's Wi-Fi IP
 *
 * The phone case is handled automaticwally: Expo already knows the
 * IP of the machine running `expo start` (it is in the QR-code
 * URL), and we reuse it here. If that lookup ever fails, the app
 * falls back to DEV_MACHINE_IP below.
 *
 * The IP changes when you switch Wi-Fi networks. If the phone
 * suddenly cannot reach the server, update DEV_MACHINE_IP to the
 * IPv4 address shown by `ipconfig`.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ----------------------------------------------------------
// Manual fallback - your computer's IPv4 address on Wi-Fi.
// Only used if automatic detection fails.
// ----------------------------------------------------------
const DEV_MACHINE_IP = '10.85.164.25';

const BACKEND_PORT = 4000;

/**
 * Figures out the host name or IP the backend is reachable at.
 */
function resolveBackendHost(): string {
  // On the web, use whatever host the page itself was loaded from.
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    return 'localhost';
  }

  // On a device, borrow the IP of the Metro bundler that Expo is
  // already talking to. hostUri looks like "192.168.1.9:8081".
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    '';

  const host = hostUri.split(':')[0];

  return host || DEV_MACHINE_IP;
}

const BACKEND_HOST = resolveBackendHost();

export const config = {
  /** Base address of the Node.js backend. */
  apiBaseUrl: `http://${BACKEND_HOST}:${BACKEND_PORT}/api`,

  /** Where uploaded leaf images are served from. */
  uploadsBaseUrl: `http://${BACKEND_HOST}:${BACKEND_PORT}/uploads`,

  /** Give up on a request after this many milliseconds. */
  requestTimeoutMs: 30000,

  /** Key used to store the login token on the device (Phase 7). */
  tokenStorageKey: 'leafscan_auth_token',

  /** Key used to store the farmer's chosen app language. */
  languageStorageKey: 'leafscan_language',

  /** Largest image we will upload, in megabytes (Phase 8). */
  maxImageSizeMb: 5,
};
