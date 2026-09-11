/**
 * HTTP handlers for the CAO admin platform's Agriculturists page.
 *
 * The CAO owns the agriculturist directory: add an entry, list them,
 * edit details, activate / deactivate, or remove one.
 */

import { Request, Response } from 'express';
import * as agriculturistService from '../services/agriculturist.service';
import { ApiError } from '../utils/ApiError';
import {
  validate,
  createAgriculturistSchema,
  updateAgriculturistSchema,
} from '../utils/validation';

/**
 * GET /api/agriculturists?status=active&search=grace&barangay=Tiguma&page=1&pageSize=20
 * CAO admin only.
 */
export async function listAgriculturists(req: Request, res: Response): Promise<void> {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;

  const searchParam = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const search = searchParam.length > 0 ? searchParam : undefined;

  const barangayParam = typeof req.query.barangay === 'string' ? req.query.barangay.trim() : '';
  const barangay = barangayParam.length > 0 ? barangayParam : undefined;

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await agriculturistService.listAgriculturists({
    status,
    search,
    barangay,
    page,
    pageSize,
  });

  res.status(200).json({ success: true, data: result });
}

/**
 * GET /api/agriculturists/:id
 * CAO admin only.
 */
export async function getAgriculturist(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid agriculturist id');
  }

  const agriculturist = await agriculturistService.getAgriculturistById(id);

  res.status(200).json({ success: true, data: { agriculturist } });
}

/**
 * POST /api/agriculturists
 * CAO admin only.
 */
export async function createAgriculturist(req: Request, res: Response): Promise<void> {
  const input = validate(createAgriculturistSchema, req.body);
  const agriculturist = await agriculturistService.createAgriculturist(input);

  res.status(201).json({
    success: true,
    message: 'Agriculturist added',
    data: { agriculturist },
  });
}

/**
 * PATCH /api/agriculturists/:id
 * CAO admin only. Edit details or activate / deactivate.
 */
export async function updateAgriculturist(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid agriculturist id');
  }

  const input = validate(updateAgriculturistSchema, req.body);
  const agriculturist = await agriculturistService.updateAgriculturist(id, input);

  res.status(200).json({
    success: true,
    message: 'Agriculturist updated',
    data: { agriculturist },
  });
}

/**
 * DELETE /api/agriculturists/:id
 * CAO admin only.
 */
export async function deleteAgriculturist(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid agriculturist id');
  }

  await agriculturistService.deleteAgriculturist(id);

  res.status(200).json({ success: true, message: 'Agriculturist removed' });
}
