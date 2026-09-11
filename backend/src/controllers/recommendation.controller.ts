/**
 * HTTP handlers for treatment recommendations (CAO admin CRUD).
 */

import { Request, Response } from 'express';
import * as recommendationService from '../services/recommendation.service';
import { ApiError } from '../utils/ApiError';
import {
  validate,
  createRecommendationSchema,
  updateRecommendationSchema,
} from '../utils/validation';

/** GET /api/recommendations - every recommendation, active or not. Admin only. */
export async function listRecommendations(_req: Request, res: Response): Promise<void> {
  const recommendations = await recommendationService.listRecommendations();
  res.status(200).json({ success: true, data: { recommendations } });
}

/** POST /api/recommendations - add one. Admin only. */
export async function createRecommendation(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const input = validate(createRecommendationSchema, req.body);
  const recommendation = await recommendationService.createRecommendation(
    input,
    req.user.userId
  );

  res.status(201).json({
    success: true,
    message: 'Recommendation added',
    data: { recommendation },
  });
}

/** PATCH /api/recommendations/:id - edit one. Admin only. */
export async function updateRecommendation(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid recommendation id');
  }

  const input = validate(updateRecommendationSchema, req.body);
  const recommendation = await recommendationService.updateRecommendation(id, input);

  res.status(200).json({
    success: true,
    message: 'Recommendation updated',
    data: { recommendation },
  });
}

/** DELETE /api/recommendations/:id - remove one. Admin only. */
export async function deleteRecommendation(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid recommendation id');
  }

  await recommendationService.deleteRecommendation(id);

  res.status(200).json({ success: true, message: 'Recommendation removed' });
}
