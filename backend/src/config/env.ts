/**
 * Environment configuration for LeafScan AI backend.
 *
 * Loads values from the .env file and validates that the
 * required ones are actually present. Every other file in the
 * project imports settings from HERE, never from process.env
 * directly, so there is exactly one place to look.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load the .env file that sits at the root of the backend folder.
// __dirname is backend/src/config, so we go up two levels.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Reads a required variable. Crashes immediately with a clear
 * message if it is missing, instead of failing mysteriously later.
 */
function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Check that backend/.env exists and contains a line "${name}=..."`
    );
  }

  return value;
}

/**
 * Reads an optional variable, using a fallback if it is absent.
 */
function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // ---------- Server ----------
  port: Number(optionalEnv('PORT', '4000')),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',

  // ---------- CORS ----------
  // Exact origins allowed to call this API from a browser, e.g.
  // "https://admin.leafscan.example,https://app.leafscan.example".
  // In development, the admin site and the mobile app's web build
  // are additionally allowed from any host (their dev servers are
  // reachable at a LAN IP that changes with the Wi-Fi network) as
  // long as the port matches - see isAllowedOrigin() in app.ts.
  allowedOrigins: optionalEnv('ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // ---------- Database ----------
  db: {
    host: requireEnv('DB_HOST'),
    port: Number(optionalEnv('DB_PORT', '3306')),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
  },

  // ---------- Authentication (used in Phase 5) ----------
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
  },

  // ---------- Outgoing SMS (password reset) ----------
  // Optional. When SEMAPHORE_API_KEY is blank the code is printed
  // to the server console instead of being texted, so the reset
  // flow still works before an SMS account is set up.
  // Sign up at https://semaphore.co to get an API key.
  sms: {
    apiKey: optionalEnv('SEMAPHORE_API_KEY', ''),
    // Must be a sender name already approved on the Semaphore
    // account. Left blank, Semaphore uses its shared default sender.
    senderName: optionalEnv('SEMAPHORE_SENDER_NAME', ''),
  },

  // Shown in the reset SMS and used for the reset-code lifetime.
  appName: optionalEnv('APP_NAME', 'LeafScan AI'),
  passwordResetTtlMinutes: Number(optionalEnv('PASSWORD_RESET_TTL_MINUTES', '15')),

  // ---------- File uploads (used in Phase 8) ----------
  upload: {
    dir: optionalEnv('UPLOAD_DIR', 'uploads'),
    maxSizeMb: Number(optionalEnv('MAX_UPLOAD_SIZE_MB', '5')),
  },

  // ---------- AI service (used in Phase 13) ----------
  aiServiceUrl: optionalEnv('AI_SERVICE_URL', 'http://localhost:8000'),
};