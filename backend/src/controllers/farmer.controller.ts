/**
 * HTTP handlers for the CAO admin platform's Farmers page.
 */

import { Request, Response } from 'express';
import * as farmerService from '../services/farmer.service';
import { ApiError } from '../utils/ApiError';

/**
 * GET /api/farmers?status=active&page=1&pageSize=20
 * CAO admin only.
 */
export async function listFarmers(req: Request, res: Response): Promise<void> {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await farmerService.listFarmers({ status, page, pageSize });

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/farmers/:id
 * CAO admin only.
 */
export async function getFarmer(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid farmer id');
  }

  const farmer = await farmerService.getFarmerById(id);

  res.status(200).json({
    success: true,
    data: { farmer },
  });
}
