/**
 * Image upload routes for LeafScan AI.
 *
 * Mounted at /api/uploads in app.ts.
 */

import { Router } from 'express';

import * as uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadLeafImage } from '../middleware/upload.middleware';

const router = Router();

/**
 * POST /api/uploads
 *
 * PROTECTED - only a logged-in user may upload.
 *
 * Middleware order matters and is deliberate:
 *   authenticate    runs FIRST, so an unauthorised request is
 *                   rejected before any file is written to disk
 *   uploadLeafImage runs second, parsing and saving the file
 *   uploadImage     responds
 *
 * Reversing the first two would let anyone fill your disk with
 * files simply by posting to this endpoint.
 */
router.post('/', authenticate, uploadLeafImage, uploadController.uploadImage);

export default router;