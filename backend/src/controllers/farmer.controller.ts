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
import { validate, createAccountSchema, updateFarmerSchema } from '../utils/validation';

/**
 * GET /api/farmers?status=active&search=juan&barangay=Balangasan&page=1&pageSize=20
 * CAO admin only.
 */
export async function listFarmers(req: Request, res: Response): Promise<void> {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;

  const searchParam = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const search = searchParam.length > 0 ? searchParam : undefined;

  const barangayParam = typeof req.query.barangay === 'string' ? req.query.barangay.trim() : '';
  const barangay = barangayParam.length > 0 ? barangayParam : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await farmerService.listFarmers({ status, search, barangay, page, pageSize });

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/farmers/barangays
 * CAO admin only. Distinct barangays for the Farmers/Detections
 * filter dropdowns and the Add/Edit Farmer barangay select.
 */
export async function listBarangays(_req: Request, res: Response): Promise<void> {
  const barangays = await farmerService.listFarmerBarangays();
  res.status(200).json({ success: true, data: { barangays } });
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
 * CAO admin only. Issues a new account - farmer or admin - and
 * returns the login credentials once so the CAO can hand them over.
 */
export async function createAccount(req: Request, res: Response): Promise<void> {
  const input = validate(createAccountSchema, req.body);
  const result = await farmerService.createAccount(input);

  res.status(201).json({
    success: true,
    message: input.role === 'admin' ? 'Admin account created' : 'Farmer account created',
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

/**
 * DELETE /api/farmers/:id
 * CAO admin only. Permanently removes an account (and, for a
 * farmer, everything cascading from it - see deleteAccount's doc).
 */
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid account id');
  }

  if (req.user?.userId === id) {
    throw ApiError.badRequest('You cannot delete your own account while signed in as it.');
  }

  await farmerService.deleteAccount(id);

  res.status(200).json({
    success: true,
    message: 'Account deleted',
  });
}
