/**
 * Detection (leaf-scan) routes for LeafScan AI.
 *
 * Mounted at /api/detections in app.ts.
 *   - POST /            farmer only        - the mobile app records a scan
 *   - GET  /            admin or farmer    - CAO: the Detections page + drill-down (any farmerId);
 *                                             farmer: their own Home/History/report numbers only (see controller)
 *   - PATCH /:id/review admin only         - the CAO confirm/correct verdict
 */

import { Router } from 'express';

import * as detectionController from '../controllers/detection.controller';
import { authenticate, requireAdmin, requireFarmer } from '../middleware/auth.middleware';

const router = Router();

/** POST /api/detections - the mobile app records a finished scan. */
router.post('/', authenticate, requireFarmer, detectionController.createDetection);

/**
 * GET /api/detections - the scan list, optionally filtered.
 *
 * Open to both roles: the controller pins a farmer's query to their
 * own userId (so the mobile app's Home/History/report screens can
 * read the exact same rows the CAO sees, instead of trusting an
 * on-device cache that can drift or leak across accounts on a shared
 * phone), while an admin keeps full, unrestricted access.
 */
router.get('/', authenticate, detectionController.listDetections);

/** PATCH /api/detections/:id/review - record a CAO confirm/correct verdict. */
router.patch('/:id/review', authenticate, requireAdmin, detectionController.reviewDetection);

export default router;
