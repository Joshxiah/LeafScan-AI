/**
 * HTTP client for the LeafScan AI backend.
 *
 * Mirrors the mobile app's api.ts, with one difference: the
 * token is kept in localStorage rather than SecureStore, because
 * browsers have no equivalent of the Android Keystore.
 */

import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const TOKEN_KEY = 'leafscan_admin_token';

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ---------- Token storage ----------

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function deleteToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * SECURITY NOTE ON localStorage
 *
 * localStorage is readable by any JavaScript running on this
 * page, so a cross-site scripting (XSS) flaw could expose the
 * token. The more secure alternative is an httpOnly cookie,
 * which JavaScript cannot read at all.
 *
 * We use localStorage here because it works with the existing
 * Bearer-token backend and keeps the mobile and web flows
 * identical. React escapes rendered values by default, which
 * removes the most common XSS vector. This trade-off is
 * revisited in Phase 24.
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  requiresAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.error('[api] Network failure:', endpoint, error);

    throw new ApiError(
      0,
      'Cannot reach the server. Make sure the backend is running.'
    );
  }

  const rawText = await response.text();

  let payload: ApiResponse<T> | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiResponse<T>;
    } catch {
      throw new ApiError(response.status, 'The server sent an unexpected response.');
    }
  }

  if (!response.ok) {
    // A 401 means the token is gone or expired. Clear it so the
    // app does not keep retrying with a dead credential.
    if (response.status === 401) {
      deleteToken();
    }

    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed (${response.status})`
    );
  }

  if (!payload || payload.data === undefined) {
    return undefined as T;
  }

  return payload.data;
}

export const api = {
  get: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'GET', requiresAuth }),

  post: <T>(endpoint: string, body?: unknown, requiresAuth = true) =>
    request<T>(endpoint, { method: 'POST', body, requiresAuth }),

  put: <T>(endpoint: string, body?: unknown, requiresAuth = true) =>
    request<T>(endpoint, { method: 'PUT', body, requiresAuth }),

  delete: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'DELETE', requiresAuth }),
};
