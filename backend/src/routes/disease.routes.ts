/**
 * Disease reference routes for LeafScan AI.
 *
 * Mounted at /api/diseases in app.ts.
 */

import { Router } from 'express';

import * as diseaseController from '../controllers/disease.controller';

const router = Router();

/**
 * GET /api/diseases
 * PUBLIC - the disease library is educational content and needs
 * no login. A farmer can browse it before creating an account.
 */
router.get('/', diseaseController.listDiseases);

export default router;
