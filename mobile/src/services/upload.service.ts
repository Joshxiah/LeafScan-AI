/**
 * Image upload calls for LeafScan AI.
 *
 * Turns a local image URI from the camera or gallery into a
 * multipart/form-data request the backend can read.
 */

import { Platform } from 'react-native';

import { uploadFile } from './api';

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
 * Uploads one corn leaf image to the backend.
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
export async function uploadLeafImage(imageUri: string): Promise<UploadResult> {
  const formData = new FormData();
  const fileName = extractFileName(imageUri);

  if (Platform.OS === 'web') {
    const blob = await (await fetch(imageUri)).blob();
    const type = blob.type || guessMimeType(fileName);

    formData.append('image', new File([blob], fileName, { type }));
  } else {
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
