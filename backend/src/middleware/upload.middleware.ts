/**
 * Image upload handling for LeafScan AI.
 *
 * Uses multer to parse multipart/form-data and write the file to
 * disk. Every uploaded file is validated on THREE independent
 * checks before it is accepted:
 *
 *   1. MIME type  - what the client claims the file is
 *   2. Extension  - what the filename says it is
 *   3. Size limit - enforced by multer while streaming
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/** Image formats a phone camera or gallery can realistically produce. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/** Absolute path to backend/uploads */
const UPLOAD_DIRECTORY = path.resolve(__dirname, '../../', env.upload.dir);

/**
 * Creates the uploads folder if it is missing.
 *
 * Git cannot store empty folders, so a fresh clone of this
 * project has no uploads directory and multer would crash on the
 * first upload. Creating it at startup removes that failure.
 */
export function ensureUploadDirectoryExists(): void {
  if (!fs.existsSync(UPLOAD_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIRECTORY}`);
  }
}

/**
 * Decides where files go and what they are called.
 */
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOAD_DIRECTORY);
  },

  filename: (req, file, callback) => {
    // NEVER trust the filename sent by the client. A malicious
    // name like "../../server.js" could overwrite your own code.
    // We discard it entirely and generate our own.
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = ALLOWED_EXTENSIONS.includes(extension) ? extension : '.jpg';

    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${safeExtension}`;

    callback(null, uniqueName);
  },
});

/**
 * Rejects anything that is not an allowed image.
 *
 * Checks BOTH the declared MIME type and the file extension. A
 * client can lie about either one, so requiring both to agree
 * raises the bar. Note this is still not proof of file contents -
 * see the security note at the bottom of this file.
 */
function fileFilter(
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void {
  const mimeType = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    callback(
      ApiError.badRequest(
        'Only JPG, PNG, and WEBP images are allowed. Please choose a photo.',
        'UPLOAD_INVALID_TYPE'
      )
    );
    return;
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    callback(
      ApiError.badRequest(
        'Unsupported file extension. Please use a .jpg, .png, or .webp image.',
        'UPLOAD_INVALID_TYPE'
      )
    );
    return;
  }

  callback(null, true);
}

/**
 * The configured multer instance.
 *
 * The size limit is enforced WHILE the file streams in, so an
 * oversized upload is cut off early rather than being written to
 * disk and then deleted.
 */
export const uploadLeafImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxSizeMb * 1024 * 1024,
    files: 1,
  },
}).single('image'); // "image" must match the FormData field name

/**
 * Deletes an uploaded file.
 *
 * Used when a later step fails - for example, if the AI service
 * is unreachable in Phase 13, we do not want an orphaned image
 * sitting on disk with no database record pointing at it.
 */
export function deleteUploadedFile(filename: string): void {
  const filePath = path.join(UPLOAD_DIRECTORY, path.basename(filename));

  fs.unlink(filePath, (error) => {
    if (error) {
      console.error(`[upload] Could not delete ${filePath}:`, error.message);
    }
  });
}

/**
 * SECURITY NOTE
 *
 * MIME type and extension are both supplied by the client and can
 * be forged. A determined attacker could rename a script to
 * .jpg and declare it as image/jpeg.
 *
 * Two things limit the damage here:
 *   - Uploaded files are served as static content and are never
 *     executed by the server.
 *   - In Phase 12 the Python prediction service opens every image
 *     with Pillow, which fails on anything that is not a real
 *     image, so corrupt or fake files are caught there.
 *
 * Content-based verification (reading magic bytes) is discussed
 * again in Phase 24.
 */