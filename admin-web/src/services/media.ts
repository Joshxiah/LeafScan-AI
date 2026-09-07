/**
 * URL helpers for files the backend serves from /uploads.
 *
 * That route requires a valid login token (see
 * backend/src/middleware/auth.middleware.ts#authenticateAsset), and
 * an <img> tag cannot send an Authorization header, so the token
 * travels as a query parameter instead - the same trick the mobile
 * app uses.
 */

import { getToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

/** "http://localhost:4000" - the API base with the trailing /api removed. */
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Builds a displayable, authenticated URL for a stored relative
 * path such as "uploads/xxx.jpg".
 */
export function mediaUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;

  const clean = relativePath.replace(/^\/+/, '');
  const token = getToken();
  const url = `${BACKEND_ORIGIN}/${clean}`;

  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

/** The base for opening an EventSource - it also needs the token in the query. */
export function streamUrl(path: string): string {
  const token = getToken();
  const url = `${API_BASE_URL}${path}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}
