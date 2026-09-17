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
 * PROTECTED, admin only - the CAO issues a new account (farmer or admin).
 */
router.post('/', authenticate, requireAdmin, farmerController.createAccount);

/**
 * GET /api/farmers/barangays
 * PROTECTED, admin only - distinct barangays for filter/dropdown use.
 * Declared before /:id so "barangays" is not read as an id.
 */
router.get('/barangays', authenticate, requireAdmin, farmerController.listBarangays);

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

/**
 * DELETE /api/farmers/:id
 * PROTECTED, admin only - permanently removes the account.
 */
router.delete('/:id', authenticate, requireAdmin, farmerController.deleteAccount);

export default router;
