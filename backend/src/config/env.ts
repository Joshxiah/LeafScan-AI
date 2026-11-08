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
  // Two token lifetimes, picked by the "Remember me" box at login:
  //   - expiresIn:         box UNCHECKED - a short session token
  //   - rememberExpiresIn: box CHECKED - a long token the phone keeps,
  //     so a farmer can stay signed in and use the app offline for
  //     weeks between trips into signal range.
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '1d'),
    rememberExpiresIn: optionalEnv('JWT_REMEMBER_EXPIRES_IN', '90d'),
  },

  // ---------- Outgoing SMS (password reset) ----------
  // Optional. Two providers, tried in this order:
  //   1. An Android phone running the free, open-source "SMS Gateway
  //      for Android" app (SMS_GATEWAY_*): the text goes out from that
  //      phone's own SIM, so there is no service fee.
  //   2. Semaphore (SEMAPHORE_*), a paid service.
  // When neither is set the code is printed to the server console
  // instead of being texted, so the reset flow still works before an
  // SMS account or gateway phone is set up.
  sms: {
    apiKey: optionalEnv('SEMAPHORE_API_KEY', ''),
    // Must be a sender name already approved on the Semaphore
    // account. Left blank, Semaphore uses its shared default sender.
    senderName: optionalEnv('SEMAPHORE_SENDER_NAME', ''),
    // Full URL of the gateway's send endpoint, e.g.
    // http://192.168.1.50:8080/message (Local Server mode, phone and
    // PC on the same Wi-Fi) or
    // https://api.sms-gate.app/3rdparty/v1/messages (Cloud mode).
    gatewayUrl: optionalEnv('SMS_GATEWAY_URL', '').trim(),
    // The username / password the app shows in its Local Server or
    // Cloud Server section.
    gatewayUsername: optionalEnv('SMS_GATEWAY_USERNAME', '').trim(),
    gatewayPassword: optionalEnv('SMS_GATEWAY_PASSWORD', '').trim(),
  },

  // ---------- Outgoing email (CAO password reset) ----------
  // Optional. When GMAIL_USER / GMAIL_APP_PASSWORD are blank the code
  // is printed to the server console instead of being emailed, so the
  // CAO reset flow still works before a sender account is set up.
  // The password must be a Google "App password" (Google Account ->
  // Security -> 2-Step Verification -> App passwords), NOT the normal
  // Gmail password. Google shows it in 4 groups of 4 letters; the
  // spaces are ignored here.
  mail: {
    user: optionalEnv('GMAIL_USER', '').trim(),
    appPassword: optionalEnv('GMAIL_APP_PASSWORD', '').replace(/\s+/g, ''),
  },

  // Shown in the reset SMS / email and used for the reset-code lifetime.
  appName: optionalEnv('APP_NAME', 'LeafScan AI'),
  passwordResetTtlMinutes: Number(optionalEnv('PASSWORD_RESET_TTL_MINUTES', '15')),

  // ---------- File uploads (used in Phase 8) ----------
  upload: {
    dir: optionalEnv('UPLOAD_DIR', 'uploads'),
    maxSizeMb: Number(optionalEnv('MAX_UPLOAD_SIZE_MB', '5')),
  },

  // ---------- AI service (used in Phase 13) ----------
  // 127.0.0.1 rather than "localhost": Node may resolve localhost to
  // IPv6 (::1) while uvicorn listens on IPv4 only.
  aiServiceUrl: optionalEnv('AI_SERVICE_URL', 'http://127.0.0.1:8000'),
  // How long Express waits for the Python service before giving up.
  aiServiceTimeoutMs: Number(optionalEnv('AI_SERVICE_TIMEOUT_MS', '30000')),
  // The labels.json that ships with the model. detections.model_version is
  // read from it (see detection.service.ts). The default is the copy in this
  // repo (backend/src/config -> ../../../ai-model/models); set AI_LABELS_PATH
  // when the backend runs on a machine that does not have the ai-model folder.
  aiLabelsPath: optionalEnv(
    'AI_LABELS_PATH',
    path.resolve(__dirname, '../../../ai-model/models/labels.json')
  ),
};