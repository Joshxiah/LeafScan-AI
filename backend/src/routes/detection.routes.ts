/**
 * Detection (leaf-scan) routes for LeafScan AI.
 *
 * Mounted at /api/detections in app.ts.
 *   - POST /            farmer only - the mobile app records a scan
 *   - GET  /            admin only  - the CAO's Detections page + drill-down
 *   - PATCH /:id/review admin only  - the CAO confirm/correct verdict
 */

import { Router } from 'express';

import * as detectionController from '../controllers/detection.controller';
import { authenticate, requireAdmin, requireFarmer } from '../middleware/auth.middleware';

const router = Router();

/** POST /api/detections - the mobile app records a finished scan. */
router.post('/', authenticate, requireFarmer, detectionController.createDetection);

/** GET /api/detections - the scan list, optionally filtered. */
router.get('/', authenticate, requireAdmin, detectionController.listDetections);

/** PATCH /api/detections/:id/review - record a CAO confirm/correct verdict. */
router.patch('/:id/review', authenticate, requireAdmin, detectionController.reviewDetection);

export default router;
