/**
 * Full Philippine address lookup routes for LeafScan AI.
 *
 * Mounted at /api/address in app.ts. Admin only - used to populate
 * the Region/Province/City-Municipality/Barangay cascade on the
 * Create Account form.
 */

import { Router } from 'express';

import * as addressController from '../controllers/address.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/regions', authenticate, requireAdmin, addressController.listRegions);
router.get('/provinces', authenticate, requireAdmin, addressController.listProvinces);
router.get('/cities', authenticate, requireAdmin, addressController.listCities);
router.get('/barangays', authenticate, requireAdmin, addressController.listBarangays);

export default router;
