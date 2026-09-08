/**
 * Application configuration for LeafScan AI mobile.
 *
 * WHERE IS THE BACKEND?
 *
 * The backend runs on your computer at port 4000. A phone on the
 * same Wi-Fi can usually reach the Expo/Metro bundler (port 8081)
 * but is often BLOCKED by Windows Firewall from reaching port 4000
 * directly.
 *
 * So in development the app does NOT hit port 4000. It sends every
 * /api and /uploads request to the Metro dev server instead, and
 * Metro forwards it to the backend over loopback on the PC (see the
 * proxy in metro.config.js). This needs no firewall change.
 *
 *   - Phone / emulator (dev) -> Metro host + Metro port  (proxied)
 *   - Web (dev)              -> same page host + Metro port (proxied)
 *   - Production build        -> port 4000 on the resolved host
 *
 * Expo already knows the bundler's address (it is in the QR-code
 * URL); we reuse it. If that lookup fails, the app falls back to
 * DEV_MACHINE_IP below.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ----------------------------------------------------------
// Manual fallback - your computer's IPv4 address on Wi-Fi.
// Only used if Expo's automatic host detection fails.
//
// Find it with `ipconfig` (Windows) / `ifconfig` (macOS/Linux) -
// the "IPv4 Address" of the Wi-Fi adapter, e.g. 192.168.x.x.
// ----------------------------------------------------------
const DEV_MACHINE_IP = '192.168.68.146';

/** Where the real backend listens. Used directly only in production builds. */
const BACKEND_PORT = 4000;

/** Default Metro/Expo port, used when it cannot be read from the host URI. */
const DEFAULT_METRO_PORT = 8081;

/** "192.168.1.9:8081" -> { host, port } */
function parseHostUri(): { host: string; port: number } {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    '';

  const [host, portText] = hostUri.split(':');
  const port = Number(portText);

  return {
    host: host || DEV_MACHINE_IP,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_METRO_PORT,
  };
}

function resolve(): { origin: string } {
  // ---------- Web ----------
  if (Platform.OS === 'web') {
    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';

    if (__DEV__) {
      // The page is served BY Metro, so its port already works.
      const port =
        typeof window !== 'undefined' && window.location?.port
          ? window.location.port
          : String(DEFAULT_METRO_PORT);
      return { origin: `http://${host}:${port}` };
    }
    return { origin: `http://${host}:${BACKEND_PORT}` };
  }

  // ---------- Native device / emulator ----------
  const { host, port } = parseHostUri();

  // Dev: go through the Metro proxy (metro.config.js) on the bundler
  // port. Prod: hit the backend port directly.
  return { origin: `http://${host}:${__DEV__ ? port : BACKEND_PORT}` };
}

const { origin } = resolve();

export const config = {
  /** Base address for API calls. In dev this is the Metro proxy. */
  apiBaseUrl: `${origin}/api`,

  /**
   * The bare origin, no path suffix. A stored file path
   * (detections.image_path, users.avatar_path) is already relative
   * to this - "uploads/xxx.jpg" - so build its URL as
   * `${backendOrigin}/${relativePath}`, never uploadsBaseUrl, or
   * "uploads" ends up doubled.
   */
  backendOrigin: origin,

  /** Where uploaded leaf images are served from. */
  uploadsBaseUrl: `${origin}/uploads`,

  /** Give up on a request after this many milliseconds. */
  requestTimeoutMs: 30000,

  /** Key used to store the login token on the device (Phase 7). */
  tokenStorageKey: 'leafscan_auth_token',

  /** Key used to store the farmer's chosen app language. */
  languageStorageKey: 'leafscan_language',

  /** Largest image we will upload, in megabytes (Phase 8). */
  maxImageSizeMb: 5,
};
