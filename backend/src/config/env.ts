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

  // ---------- File uploads (used in Phase 8) ----------
  upload: {
    dir: optionalEnv('UPLOAD_DIR', 'uploads'),
    maxSizeMb: Number(optionalEnv('MAX_UPLOAD_SIZE_MB', '5')),
  },

  // ---------- AI service (used in Phase 13) ----------
  aiServiceUrl: optionalEnv('AI_SERVICE_URL', 'http://localhost:8000'),
};