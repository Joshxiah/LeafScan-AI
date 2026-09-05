/**
 * HTTP handler for image uploads.
 *
 * By the time this runs, multer has already parsed the request,
 * validated the file, and written it to backend/uploads. The
 * controller's job is only to report back where it went.
 *
 * In Phase 13 this endpoint is joined by POST /api/detections,
 * which uploads AND runs the AI model in one request.
 */

import { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * POST /api/uploads
 * Protected. Used by the mobile app's image preview screen.
 */
export async function uploadImage(req: Request, res: Response): Promise<void> {
  // multer places the file here. If it is missing, no part named
  // "image" was present in the multipart body.
  if (!req.file) {
    throw ApiError.badRequest(
      'No image was received. Please select or capture a photo and try again.'
    );
  }

  // Build the address the phone can use to display the image.
  // req.get('host') gives the address the client actually used,
  // so this works whether the request came from localhost or
  // from a phone on the Wi-Fi network.
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      fileName: req.file.filename,

      // Relative path - this is what goes in the database, so
      // records stay valid if the server address ever changes.
      imagePath: `uploads/${req.file.filename}`,

      // Absolute URL - for immediate display on the phone.
      imageUrl: publicUrl,

      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.userId ?? null,
    },
  });
}