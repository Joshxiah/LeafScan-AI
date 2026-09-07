/**
 * Farmer account routes for LeafScan AI.
 *
 * Mounted at /api/farmers in app.ts.
 */

import { Router } from 'express';

import * as farmerController from '../controllers/farmer.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/farmers
 * PROTECTED, admin only - the CAO's Farmers list.
 */
router.get('/', authenticate, requireAdmin, farmerController.listFarmers);

/**
 * GET /api/farmers/:id
 * PROTECTED, admin only.
 */
router.get('/:id', authenticate, requireAdmin, farmerController.getFarmer);

export default router;
