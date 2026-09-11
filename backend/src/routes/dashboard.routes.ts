/**
 * Dashboard routes for LeafScan AI.
 *
 * Mounted at /api/dashboard in app.ts.
 */

import { Router } from 'express';

import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/dashboard/statistics
 *
 * Two guards, in order:
 *   authenticate  -> is there a valid token?     (401 if not)
 *   requireAdmin  -> is the role 'admin'?        (403 if not)
 *
 * A farmer with a perfectly valid token is still blocked here.
 */
router.get(
  '/statistics',
  authenticate,
  requireAdmin,
  dashboardController.getStatistics
);

/**
 * GET /api/dashboard/barangay-breakdown?risk=<none|low|moderate|high>
 *
 * Same two guards as /statistics. Scans grouped by the scanning
 * farmer's barangay, optionally filtered to one risk level.
 */
router.get(
  '/barangay-breakdown',
  authenticate,
  requireAdmin,
  dashboardController.getBarangayBreakdown
);

/**
 * GET /api/dashboard/recent-detections?risk=&barangay=&limit=
 *
 * Same two guards as /statistics. The most recent scans, optionally
 * filtered to one risk level and/or one barangay.
 */
router.get(
  '/recent-detections',
  authenticate,
  requireAdmin,
  dashboardController.getRecentDetections
);

export default router;
