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

export default router;
