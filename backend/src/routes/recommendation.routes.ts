/**
 * Treatment recommendation routes for LeafScan AI.
 *
 * Mounted at /api/recommendations in app.ts. Admin only - the CAO
 * authors the treatment advice; farmers read it via GET /api/diseases.
 */

import { Router } from 'express';

import * as recommendationController from '../controllers/recommendation.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, recommendationController.listRecommendations);
router.post('/', authenticate, requireAdmin, recommendationController.createRecommendation);
router.patch('/:id', authenticate, requireAdmin, recommendationController.updateRecommendation);
router.delete('/:id', authenticate, requireAdmin, recommendationController.deleteRecommendation);

export default router;
