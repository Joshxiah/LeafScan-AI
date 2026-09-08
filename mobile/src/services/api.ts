/**
 * HTTP client for the LeafScan AI backend.
 *
 * Handles the things every request needs:
 *   - prefixing the base URL
 *   - attaching the Bearer token
 *   - timing out instead of hanging forever
 *   - turning backend errors into clear messages
 *
 * Screens never call fetch directly. They call these functions.
 */

import { config } from '../constants/config';
import { getToken } from './storage';
import { ApiResponse } from '../types';

/**
 * An error carrying the HTTP status code, so screens can react
 * differently to 401 (log in again) versus 409 (email taken).
 */
export class ApiError extends Error {
  public readonly status: number;

  /** The backend's stable error identifier (e.g. "INVALID_CREDENTIALS"), if it sent one. Used to look up a localized message instead of showing `message` (always English) as-is. */
  public readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

/**
 * Turns any caught error into text a screen can show.
 *
 * A caught ApiError whose `code` has a translation is shown in the
 * farmer's chosen language (`apiErrors` in src/i18n/translations.ts).
 * Anything else - an ApiError with an unmapped code, a network
 * failure, a timeout - falls back to that error's own message,
 * since it is already a complete sentence written for a screen (see
 * the messages built in request()/uploadFile() above). Only a
 * non-ApiError, unexpected failure falls back to the caller's
 * generic message.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string,
  apiErrors: Partial<Record<string, string>>
): string {
  if (error instanceof ApiError) {
    if (error.code && apiErrors[error.code]) {
      return apiErrors[error.code] as string;
    }
    return error.message || fallback;
  }

  return fallback;
}

/** Options accepted by the request helper. */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set false for register and login, which have no token yet. */
  requiresAuth?: boolean;
}

/**
 * Makes one request to the backend and returns the parsed data.
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const url = `${config.apiBaseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Attach the token when the endpoint is protected.
  if (requiresAuth) {
    const token = await getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Without a timeout, a request to an unreachable server hangs
  // forever and the farmer sees a spinner that never stops.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // fetch throws only for network-level failures, never for
    // HTTP error statuses like 404 or 500.
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        408,
        'The request took too long. Please check your connection and try again.'
      );
    }

    console.error('[api] Network failure:', url, error);

    throw new ApiError(
      0,
      __DEV__
        ? `Cannot reach the server at ${config.backendOrigin}. Check the phone and PC share one Wi-Fi, and that Windows Firewall allows port 4000 (run scripts/allow-lan-dev.ps1 as admin).`
        : 'Cannot reach the server. Please check your internet connection and try again.'
    );
  }

  clearTimeout(timeoutId);

  // Read the body as text first, because an error page might be
  // HTML rather than JSON and JSON.parse would throw.
  const rawText = await response.text();

  let payload: ApiResponse<T> | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiResponse<T>;
    } catch {
      throw new ApiError(
        response.status,
        'The server sent an unexpected response.'
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed (${response.status})`,
      payload?.code
    );
  }

  if (!payload || payload.data === undefined) {
    // Some endpoints legitimately return no data.
    return undefined as T;
  }

  return payload.data;
}

/**
 * Uploads a file using multipart/form-data.
 *
 * Kept separate from request() because a file upload differs in
 * two important ways:
 *   - the body is FormData, not JSON
 *   - the Content-Type header must NOT be set manually
 */
export async function uploadFile<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${config.apiBaseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // NOTE: Content-Type is deliberately absent.
  //
  // multipart/form-data requires a randomly generated "boundary"
  // marker in the header. Setting the header by hand omits that
  // boundary, and the server then cannot find the file at all.
  // Leaving it out lets fetch generate the correct header.

  const token = await getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Uploads need longer than normal requests - a 3 MB photo over
  // weak rural Wi-Fi can legitimately take a while.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        408,
        'The upload took too long. Please check your connection and try again.'
      );
    }

    console.error('[api] Upload failed:', url, error);

    throw new ApiError(
      0,
      'Cannot reach the server. Make sure you are connected to the same network as the server.'
    );
  }

  clearTimeout(timeoutId);

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
    throw new ApiError(
      response.status,
      payload?.message ?? `Upload failed (${response.status})`,
      payload?.code
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

  patch: <T>(endpoint: string, body?: unknown, requiresAuth = true) =>
    request<T>(endpoint, { method: 'PATCH', body, requiresAuth }),

  delete: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'DELETE', requiresAuth }),
};