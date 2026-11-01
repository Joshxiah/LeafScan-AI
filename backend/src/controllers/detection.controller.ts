/**
 * HTTP handlers for leaf-scan detections.
 */

import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';
import { env } from '../config/env';
import * as aiService from '../services/ai.service';
import * as detectionService from '../services/detection.service';
import type { RiskLevel, DetectionResult } from '../services/detection.service';
import { ApiError } from '../utils/ApiError';
import {
  validate,
  scanDetectionSchema,
  reviewDetectionSchema,
} from '../utils/validation';

/** Absolute path to backend/uploads - the same folder the upload middleware writes to. */
const UPLOAD_DIRECTORY = path.resolve(__dirname, '../../', env.upload.dir);

/** ApiError.code for a scan request whose uploaded photo is not on disk. */
const IMAGE_NOT_FOUND = 'IMAGE_NOT_FOUND';


/** A 'YYYY-MM-DD' query param, or undefined when absent. Anything else is a 400. */
function parseDateParam(value: unknown): string | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw ApiError.badRequest('Dates must look like YYYY-MM-DD');
  }
  return value;
}

/**
 * Turns the relative "uploads/xxx.jpg" a client sent into an absolute
 * path, guaranteed to sit directly inside the uploads folder.
 * 400 if it escapes the folder, 404 if the file is not there.
 *
 * The 404 carries code IMAGE_NOT_FOUND. The phone's offline queue keys
 * off that code, not the status, to tell "this photo is gone for good"
 * from any other 404 (e.g. a server that has no /scan route yet).
 */
async function resolveUploadedImage(imagePath: string): Promise<string> {
  // The schema already allows only "uploads/<safe name>"; basename +
  // the containment check below are a second, independent guard.
  const absolutePath = path.resolve(UPLOAD_DIRECTORY, path.basename(imagePath));

  if (path.dirname(absolutePath) !== UPLOAD_DIRECTORY) {
    throw ApiError.badRequest('Invalid image path');
  }

  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw ApiError.notFound('Image not found', IMAGE_NOT_FOUND);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.notFound('Image not found', IMAGE_NOT_FOUND);
  }

  return absolutePath;
}

/**
 * POST /api/detections/scan
 * Farmer only. The photo was already uploaded via POST /api/uploads;
 * the server classifies it with the Python AI service, then records
 * the result exactly like POST /api/detections does.
 */
export async function scanDetection(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const input = validate(scanDetectionSchema, req.body);
  const absolutePath = await resolveUploadedImage(input.imagePath);

  const prediction = await aiService.predictLeaf(absolutePath);

  // Risk level is NOT decided here - createDetection() reads it from
  // diseases.default_risk_level for the predicted class.
  const detection = await detectionService.createDetection(req.user.userId, {
    imagePath: input.imagePath,
    predictedClass: prediction.classLabel,
    confidenceScore: prediction.confidence,
    detectedAt: input.detectedAt,
  });

  res.status(201).json({
    success: true,
    message: 'Leaf scanned',
    data: {
      detection,
      prediction: {
        classLabel: prediction.classLabel,
        confidence: prediction.confidence,
        confidenceLevel: prediction.confidenceLevel,
        probabilities: prediction.probabilities,
      },
    },
  });
}

const RISK_LEVELS: RiskLevel[] = ['none', 'low', 'moderate', 'high'];

/**
 * GET /api/detections?farmerId=&risk=&result=&search=&barangay=&page=&pageSize=
 *
 * CAO admin: powers the Detections page and the per-farmer "view
 * this farmer's scans" drill-down, with full access to any farmerId.
 *
 * Farmer: powers their own Home/History tabs and the CAO report
 * summary. `farmerId` is forced to their own user id regardless of
 * what the query string asks for, so a farmer account can never read
 * another farmer's scans.
 */
export async function listDetections(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const requestedFarmerIdRaw = Number(req.query.farmerId);
  const requestedFarmerId =
    Number.isInteger(requestedFarmerIdRaw) && requestedFarmerIdRaw > 0
      ? requestedFarmerIdRaw
      : undefined;

  const farmerId = req.user.role === 'farmer' ? req.user.userId : requestedFarmerId;

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

  const barangayParam = typeof req.query.barangay === 'string' ? req.query.barangay.trim() : '';
  const barangay = barangayParam.length > 0 ? barangayParam : undefined;

  const diseaseParam = typeof req.query.disease === 'string' ? req.query.disease.trim() : '';
  const disease = diseaseParam.length > 0 ? diseaseParam : undefined;

  const from = parseDateParam(req.query.from);
  const to = parseDateParam(req.query.to);

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const data = await detectionService.listDetections({
    farmerId,
    riskLevel,
    result,
    search,
    barangay,
    disease,
    from,
    to,
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
