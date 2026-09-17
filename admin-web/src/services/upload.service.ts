/**
 * Image upload for the CAO admin platform (Profile Image on the
 * Create Account form). Multipart bodies can't go through
 * services/api.ts's request() helper - it always JSON-encodes and
 * sets Content-Type: application/json, which breaks a file upload -
 * so this posts FormData directly instead, mirroring api.ts's own
 * token/error handling.
 */

import { ApiError, getToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface UploadedImage {
  imagePath: string;
  imageUrl: string;
}

/** POST /api/uploads (multipart) - returns the path to store as avatarPath. */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('image', file);

  const token = getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Make sure the backend is running.');
  }

  const rawText = await response.text();
  const payload = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? `Upload failed (${response.status})`);
  }

  return payload.data as UploadedImage;
}
