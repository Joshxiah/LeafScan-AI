/**
 * HTTP handlers for outbreak reports.
 */

import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { ApiError } from '../utils/ApiError';
import {
  validate,
  createReportSchema,
  reportStatusSchema,
} from '../utils/validation';

/**
 * POST /api/reports
 * Farmer only. Files a report on behalf of the signed-in farmer.
 */
export async function createReport(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const input = validate(createReportSchema, req.body);
  const result = await reportService.createReport(req.user.userId, input);

  res.status(201).json({
    success: true,
    message: 'Report sent to the City Agriculture Office',
    data: result,
  });
}

/**
 * GET /api/reports?status=pending&page=1&pageSize=20
 * CAO admin only.
 */
export async function listReports(req: Request, res: Response): Promise<void> {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status =
    statusParam === 'pending' || statusParam === 'reviewed' || statusParam === 'resolved'
      ? statusParam
      : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await reportService.listReports({ status, page, pageSize });

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/reports/:id
 * CAO admin only.
 */
export async function getReport(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid report id');
  }

  const report = await reportService.getReportById(id);

  res.status(200).json({
    success: true,
    data: { report },
  });
}

/**
 * PATCH /api/reports/:id/status
 * CAO admin only. Moves a report to "reviewed" or "resolved".
 */
export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid report id');
  }

  const input = validate(reportStatusSchema, req.body);
  await reportService.updateReportStatus(id, input.status, req.user.userId);

  res.status(200).json({
    success: true,
    message: `Report marked as ${input.status}`,
  });
}
