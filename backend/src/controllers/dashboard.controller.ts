/**
 * HTTP handler for dashboard statistics.
 */

import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';

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
