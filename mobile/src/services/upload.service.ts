/**
 * Image upload calls for LeafScan AI.
 *
 * Turns a local image URI from the camera or gallery into a
 * multipart/form-data request the backend can read.
 */

import { Platform } from 'react-native';
import { File as LocalFile } from 'expo-file-system';

import { uploadFile, ApiError } from './api';
import { config } from '../constants/config';

/** What POST /api/uploads returns inside "data". */
export interface UploadResult {
  fileName: string;
  imagePath: string;
  imageUrl: string;
  sizeBytes: number;
  mimeType: string;
  uploadedBy: number | null;
}

/**
 * Works out the MIME type from the file extension.
 *
 * React Native does not tell us the type of a local file, and
 * the backend rejects anything whose declared type is not an
 * allowed image, so we have to state it correctly.
 */
function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';

  // Camera output on Android is JPEG, so this is the safe default.
  return 'image/jpeg';
}

/**
 * Extracts a filename from a local file URI.
 *
 * "file:///data/user/0/host.exp.exponent/cache/abc123.jpg"
 *   becomes "abc123.jpg"
 */
function extractFileName(uri: string): string {
  const parts = uri.split('/');
  const last = parts[parts.length - 1];

  return last && last.includes('.') ? last : `leaf-${Date.now()}.jpg`;
}

/**
 * Rejects an oversized photo before it is ever sent.
 *
 * The backend enforces MAX_UPLOAD_SIZE_MB regardless, but that
 * rejection only arrives after the full file has uploaded - a real
 * cost on the "weak rural Wi-Fi" this app is built for. Catching it
 * here means a farmer who picked something too large finds out
 * immediately instead of after a slow, wasted upload.
 */
function assertWithinSizeLimit(sizeBytes: number): void {
  const maxBytes = config.maxImageSizeMb * 1024 * 1024;

  if (sizeBytes > maxBytes) {
    throw new ApiError(
      413,
      `That photo is too large. Please use one under ${config.maxImageSizeMb} MB.`,
      'UPLOAD_TOO_LARGE'
    );
  }
}

/**
 * Uploads one image to the backend - a corn leaf photo, a profile
 * picture, whatever the caller is sending. POST /api/uploads does
 * not care which; it just stores the file and hands back its path.
 *
 * Native and web disagree on how a file goes into FormData:
 *
 *   - React Native accepts a { uri, name, type } object and reads
 *     the file from disk while sending. TypeScript does not know
 *     about this, which is why the cast is needed.
 *   - The browser has no file-system URIs. The picker and camera
 *     hand back a blob: or data: URL, so we fetch it into a real
 *     Blob and append that instead.
 */
export async function uploadImage(imageUri: string): Promise<UploadResult> {
  const formData = new FormData();
  const fileName = extractFileName(imageUri);

  if (Platform.OS === 'web') {
    const blob = await (await fetch(imageUri)).blob();
    assertWithinSizeLimit(blob.size);

    const type = blob.type || guessMimeType(fileName);

    formData.append('image', new File([blob], fileName, { type }));
  } else {
    try {
      const { size } = new LocalFile(imageUri);
      if (typeof size === 'number') {
        assertWithinSizeLimit(size);
      }
    } catch (error) {
      // Some URI schemes (content://, ph://) do not always expose a
      // readable size up front - not fatal, since the backend still
      // enforces the limit. Only re-throw our own deliberate
      // "too large" rejection; swallow anything else and let the
      // upload proceed.
      if (error instanceof ApiError) {
        throw error;
      }
    }

    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: guessMimeType(imageUri),
    } as unknown as Blob);
  }

  // "image" above MUST match .single('image') in the backend's
  // upload.middleware.ts. A mismatch produces "No image was
  // received" even though a file was clearly sent.
  return uploadFile<UploadResult>('/uploads', formData);
}

/** Kept as a named alias so existing "scan a leaf" call sites read naturally. */
export const uploadLeafImage = uploadImage;
