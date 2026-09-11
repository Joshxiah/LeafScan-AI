/**
 * HTTP handlers for leaf-scan detections.
 */

import { Request, Response } from 'express';
import * as detectionService from '../services/detection.service';
import type { RiskLevel, DetectionResult } from '../services/detection.service';
import { ApiError } from '../utils/ApiError';
import { validate, createDetectionSchema, reviewDetectionSchema } from '../utils/validation';

/**
 * POST /api/detections
 * Farmer only. Records a scan the mobile app just finished, so it
 * shows on the CAO's Detections page and dashboard.
 */
export async function createDetection(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const input = validate(createDetectionSchema, req.body);
  const detection = await detectionService.createDetection(req.user.userId, input);

  res.status(201).json({
    success: true,
    message: 'Detection recorded',
    data: { detection },
  });
}

const RISK_LEVELS: RiskLevel[] = ['none', 'low', 'moderate', 'high'];

/**
 * GET /api/detections?farmerId=&risk=&result=&search=&page=&pageSize=
 * CAO admin only. Powers the Detections page and the per-farmer
 * "view this farmer's scans" drill-down.
 */
export async function listDetections(req: Request, res: Response): Promise<void> {
  const farmerIdRaw = Number(req.query.farmerId);
  const farmerId =
    Number.isInteger(farmerIdRaw) && farmerIdRaw > 0 ? farmerIdRaw : undefined;

  const riskParam = typeof req.query.risk === 'string' ? req.query.risk : undefined;
  const riskLevel = RISK_LEVELS.includes(riskParam as RiskLevel)
    ? (riskParam as RiskLevel)
    : undefined;

  const resultParam = typeof req.query.result === 'string' ? req.query.result : undefined;
  const result =
    resultParam === 'healthy' || resultParam === 'diseased'
      ? (resultParam as DetectionResult)
      : undefined;

  const searchParam = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const search = searchParam.length > 0 ? searchParam : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const data = await detectionService.listDetections({
    farmerId,
    riskLevel,
    result,
    search,
    page,
    pageSize,
  });

  res.status(200).json({ success: true, data });
}

/**
 * PATCH /api/detections/:id/review
 * CAO admin only. Records a confirm / correct verdict on a scan
 * without changing the model's output.
 */
export async function reviewDetection(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid detection id');
  }

  const input = validate(reviewDetectionSchema, req.body);
  const detection = await detectionService.reviewDetection(id, req.user.userId, input);

  res.status(200).json({
    success: true,
    message: 'Detection review saved',
    data: { detection },
  });
}
