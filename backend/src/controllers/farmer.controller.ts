/**
 * HTTP handlers for the CAO admin platform's Farmers page.
 *
 * The CAO owns farmer accounts here: create one, list them, edit
 * details, activate/deactivate, or reset a password. Farmers
 * themselves cannot register.
 */

import { Request, Response } from 'express';
import * as farmerService from '../services/farmer.service';
import { ApiError } from '../utils/ApiError';
import { validate, createFarmerSchema, updateFarmerSchema } from '../utils/validation';

/**
 * GET /api/farmers?status=active&search=juan&page=1&pageSize=20
 * CAO admin only.
 */
export async function listFarmers(req: Request, res: Response): Promise<void> {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;

  const searchParam = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const search = searchParam.length > 0 ? searchParam : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await farmerService.listFarmers({ status, search, page, pageSize });

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

/**
 * POST /api/farmers
 * CAO admin only. Issues a new farmer account and returns the
 * login credentials once so the CAO can hand them over.
 */
export async function createFarmer(req: Request, res: Response): Promise<void> {
  const input = validate(createFarmerSchema, req.body);
  const result = await farmerService.createFarmer(input);

  res.status(201).json({
    success: true,
    message: 'Farmer account created',
    data: result,
  });
}

/**
 * PATCH /api/farmers/:id
 * CAO admin only. Edit details, activate/deactivate, or reset password.
 */
export async function updateFarmer(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid farmer id');
  }

  const input = validate(updateFarmerSchema, req.body);
  const result = await farmerService.updateFarmer(id, input);

  res.status(200).json({
    success: true,
    message: 'Farmer account updated',
    data: result,
  });
}
