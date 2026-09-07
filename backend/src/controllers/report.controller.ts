/**
 * HTTP handlers for outbreak reports.
 */

import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import type { ReportStatus } from '../services/report.service';
import { ApiError } from '../utils/ApiError';
import {
  validate,
  createReportSchema,
  reportStatusSchema,
} from '../utils/validation';

const ALL_STATUSES: ReportStatus[] = [
  'pending',
  'under_review',
  'verified',
  'agriculturist_required',
  'agriculturist_assigned',
  'field_assessment_completed',
  'resolved',
];

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
 * GET /api/reports?status=pending&barangay=Balangasan&page=1&pageSize=20
 * CAO admin only.
 */
export async function listReports(req: Request, res: Response): Promise<void> {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = ALL_STATUSES.includes(statusParam as ReportStatus)
    ? (statusParam as ReportStatus)
    : undefined;

  const barangayParam = typeof req.query.barangay === 'string' ? req.query.barangay.trim() : '';
  const barangay = barangayParam.length > 0 ? barangayParam : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await reportService.listReports({ status, barangay, page, pageSize });

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/reports/barangays
 * CAO admin only. Distinct barangays for the Reports filter dropdown.
 */
export async function listBarangays(_req: Request, res: Response): Promise<void> {
  const barangays = await reportService.listReportBarangays();
  res.status(200).json({ success: true, data: { barangays } });
}

/**
 * GET /api/reports/:id
 * CAO admin only. Opening a report marks it read (Messenger style).
 */
export async function getReport(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid report id');
  }

  const report = await reportService.getReportById(id);
  await reportService.markReportRead(id, req.user.userId);

  res.status(200).json({
    success: true,
    // isRead reflects the just-applied read, so the list can update
    // without a second round-trip.
    data: { report: { ...report, isRead: true } },
  });
}

/**
 * PATCH /api/reports/:id/status
 * CAO admin only. Advances a report through its field-assessment lifecycle.
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
  await reportService.updateReportStatus(
    id,
    input.status,
    req.user.userId,
    input.message || undefined,
    input.agriculturist
  );

  res.status(200).json({
    success: true,
    message: `Report marked as ${reportService.STATUS_LABEL[input.status]}`,
  });
}
