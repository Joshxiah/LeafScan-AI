/**
 * Farmer account routes for LeafScan AI.
 *
 * Mounted at /api/farmers in app.ts. Admin only - the CAO owns
 * farmer accounts; farmers do not self-register.
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
 * POST /api/farmers
 * PROTECTED, admin only - the CAO issues a new farmer account.
 */
router.post('/', authenticate, requireAdmin, farmerController.createFarmer);

/**
 * GET /api/farmers/:id
 * PROTECTED, admin only.
 */
router.get('/:id', authenticate, requireAdmin, farmerController.getFarmer);

/**
 * PATCH /api/farmers/:id
 * PROTECTED, admin only - edit / activate / deactivate / reset password.
 */
router.patch('/:id', authenticate, requireAdmin, farmerController.updateFarmer);

export default router;
