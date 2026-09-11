/**
 * Agriculturist directory routes for LeafScan AI.
 *
 * Mounted at /api/agriculturists in app.ts. Admin only - the CAO
 * owns the directory of field agriculturists it can send out.
 */

import { Router } from 'express';

import * as agriculturistController from '../controllers/agriculturist.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/** GET /api/agriculturists - the directory list. */
router.get('/', authenticate, requireAdmin, agriculturistController.listAgriculturists);

/** POST /api/agriculturists - add an entry. */
router.post('/', authenticate, requireAdmin, agriculturistController.createAgriculturist);

/** GET /api/agriculturists/:id */
router.get('/:id', authenticate, requireAdmin, agriculturistController.getAgriculturist);

/** PATCH /api/agriculturists/:id - edit / activate / deactivate. */
router.patch('/:id', authenticate, requireAdmin, agriculturistController.updateAgriculturist);

/** DELETE /api/agriculturists/:id - remove an entry. */
router.delete('/:id', authenticate, requireAdmin, agriculturistController.deleteAgriculturist);

export default router;
