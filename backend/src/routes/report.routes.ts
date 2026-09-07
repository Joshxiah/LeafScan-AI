/**
 * Report routes for LeafScan AI.
 *
 * Mounted at /api/reports in app.ts.
 */

import { Router } from 'express';

import * as reportController from '../controllers/report.controller';
import { authenticate, requireAdmin, requireFarmer } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/reports
 * PROTECTED, farmer only - a farmer reports on their own scans.
 */
router.post('/', authenticate, requireFarmer, reportController.createReport);

/**
 * GET /api/reports
 * PROTECTED, admin only - the CAO reviews every report filed.
 */
router.get('/', authenticate, requireAdmin, reportController.listReports);

/**
 * GET /api/reports/barangays
 * PROTECTED, admin only - distinct barangays for the filter dropdown.
 * Declared before /:id so "barangays" is not read as an id.
 */
router.get('/barangays', authenticate, requireAdmin, reportController.listBarangays);

/**
 * GET /api/reports/:id
 * PROTECTED, admin only. Opening a report marks it read.
 */
router.get('/:id', authenticate, requireAdmin, reportController.getReport);

/**
 * PATCH /api/reports/:id/status
 * PROTECTED, admin only - marks a report reviewed or resolved.
 */
router.patch('/:id/status', authenticate, requireAdmin, reportController.updateReportStatus);

export default router;
