/**
 * Application configuration for LeafScan AI mobile.
 *
 * IMPORTANT - API_BASE_URL:
 * A phone cannot reach "localhost", because to the phone,
 * localhost means the phone itself. It must use your computer's
 * address on the Wi-Fi network.
 *
 * Find that address by running "ipconfig" in a terminal on your
 * computer and reading the IPv4 Address under your Wi-Fi adapter.
 *
 * This address CHANGES when you reconnect to a different Wi-Fi
 * network, so if the app suddenly cannot reach the server, check
 * here first.
 */

// ----------------------------------------------------------
// CHANGE THIS LINE to match your computer's IPv4 address
// ----------------------------------------------------------
const DEV_MACHINE_IP = '192.168.68.119';

const BACKEND_PORT = 4000;

export const config = {
  /** Base address of the Node.js backend. */
  apiBaseUrl: `http://${DEV_MACHINE_IP}:${BACKEND_PORT}/api`,

  /** Where uploaded leaf images are served from. */
  uploadsBaseUrl: `http://${DEV_MACHINE_IP}:${BACKEND_PORT}/uploads`,

  /** Give up on a request after this many milliseconds. */
  requestTimeoutMs: 30000,

  /** Key used to store the login token on the device (Phase 7). */
  tokenStorageKey: 'leafscan_auth_token',

  /** Largest image we will upload, in megabytes (Phase 8). */
  maxImageSizeMb: 5,
};