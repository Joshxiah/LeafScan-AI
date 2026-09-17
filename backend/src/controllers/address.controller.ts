/**
 * HTTP handlers for the Region/Province/City-Municipality/Barangay
 * cascade used by the Create Account form.
 */

import { Request, Response } from 'express';
import * as addressService from '../services/address.service';
import { ApiError } from '../utils/ApiError';

/** GET /api/address/regions */
export async function listRegions(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { regions: addressService.listRegions() } });
}

/** GET /api/address/provinces?region=<code> */
export async function listProvinces(req: Request, res: Response): Promise<void> {
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';
  if (!region) {
    throw ApiError.badRequest('A region code is required');
  }
  res.status(200).json({
    success: true,
    data: { provinces: addressService.listProvinces(region) },
  });
}

/** GET /api/address/cities?province=<code> */
export async function listCities(req: Request, res: Response): Promise<void> {
  const province = typeof req.query.province === 'string' ? req.query.province.trim() : '';
  if (!province) {
    throw ApiError.badRequest('A province code is required');
  }
  res.status(200).json({
    success: true,
    data: { cities: addressService.listCities(province) },
  });
}

/** GET /api/address/barangays?city=<code> */
export async function listBarangays(req: Request, res: Response): Promise<void> {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  if (!city) {
    throw ApiError.badRequest('A city/municipality code is required');
  }
  res.status(200).json({
    success: true,
    data: { barangays: addressService.listBarangaysForCity(city) },
  });
}
