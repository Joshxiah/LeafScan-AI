/**
 * HTTP handler for dashboard statistics.
 */

import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { ApiError } from '../utils/ApiError';

/**
 * GET /api/dashboard/statistics
 * CAO admin only. Used by the admin Dashboard page.
 */
export async function getStatistics(req: Request, res: Response): Promise<void> {
  const statistics = await dashboardService.getStatistics();

  res.status(200).json({
    success: true,
    data: statistics,
  });
}

const RISK_LEVELS: dashboardService.RiskLevel[] = ['none', 'low', 'moderate', 'high'];

/** Parses a `?risk=` query param, treating 'all' the same as absent. */
function parseRiskParam(req: Request): dashboardService.RiskLevel | undefined {
  const riskParam = typeof req.query.risk === 'string' ? req.query.risk : undefined;
  if (!riskParam || riskParam === 'all') {
    return undefined;
  }
  if (!RISK_LEVELS.includes(riskParam as dashboardService.RiskLevel)) {
    throw ApiError.badRequest('Unknown risk level');
  }
  return riskParam as dashboardService.RiskLevel;
}

/**
 * GET /api/dashboard/barangay-breakdown?risk=<none|low|moderate|high>
 * CAO admin only. Scans grouped by the farmer's barangay - healthy
 * vs diseased plus a per-disease tally - optionally filtered to one
 * risk level. The unfiltered totals reconcile with the headline
 * tiles from /statistics.
 */
export async function getBarangayBreakdown(req: Request, res: Response): Promise<void> {
  const risk = parseRiskParam(req);

  const breakdown = await dashboardService.getBarangayBreakdown(risk);

  res.status(200).json({
    success: true,
    data: breakdown,
  });
}

/**
 * GET /api/dashboard/farmers-per-barangay
 * CAO admin only. Registered farmers grouped by barangay, highest
 * first - powers the "Registered Farmers by Barangay" chart. Summing
 * every row's `total` equals /statistics' totalFarmers tile.
 */
export async function getFarmersPerBarangay(req: Request, res: Response): Promise<void> {
  const barangays = await dashboardService.getFarmersPerBarangay();

  res.status(200).json({
    success: true,
    data: { barangays },
  });
}

/**
 * GET /api/dashboard/recent-detections?risk=&barangay=&limit=
 * CAO admin only. The most recent scans, optionally filtered to one
 * risk level and/or one barangay. Powers the dashboard's "Recent
 * Detections" table and its filters.
 */
export async function getRecentDetections(req: Request, res: Response): Promise<void> {
  const risk = parseRiskParam(req);

  const barangayParam = typeof req.query.barangay === 'string' ? req.query.barangay.trim() : '';
  const barangay = barangayParam && barangayParam !== 'all' ? barangayParam : undefined;

  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;

  const detections = await dashboardService.getRecentDetections({
    riskLevel: risk,
    barangay,
    limit,
  });

  res.status(200).json({
    success: true,
    data: { detections },
  });
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/dashboard/scan-activity?from=YYYY-MM-DD&to=YYYY-MM-DD
 * CAO admin only. Scans per day and per disease inside the range;
 * defaults to the last 14 days.
 */
export async function getScanActivity(req: Request, res: Response): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const fourteenAgo = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);

  const from = typeof req.query.from === 'string' && req.query.from ? req.query.from : fourteenAgo;
  const to = typeof req.query.to === 'string' && req.query.to ? req.query.to : today;

  if (
    !DATE_PATTERN.test(from) ||
    !DATE_PATTERN.test(to) ||
    Number.isNaN(Date.parse(from)) ||
    Number.isNaN(Date.parse(to))
  ) {
    throw ApiError.badRequest('Dates must look like YYYY-MM-DD');
  }

  const data = await dashboardService.getScanActivity(from, to);
  res.status(200).json({ success: true, data });
}
