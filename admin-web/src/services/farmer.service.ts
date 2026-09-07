/**
 * Farmer account calls for the CAO admin platform.
 *
 * The CAO owns farmer accounts: it creates them and hands the
 * farmer their credentials. Farmers do not self-register.
 */

import { api } from './api';
import type {
  CreatedFarmer,
  FarmerAccountStatus,
  ListFarmersResult,
  UpdatedFarmer,
} from '../types';

export interface ListFarmersFilters {
  status?: FarmerAccountStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/farmers?status=&search=&page=&pageSize= */
export async function listFarmers(filters: ListFarmersFilters = {}): Promise<ListFarmersResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListFarmersResult>(`/farmers${query ? `?${query}` : ''}`);
}

export interface CreateFarmerPayload {
  fullName: string;
  phoneNumber: string;
  barangay?: string;
  username?: string;
  password?: string;
  farmSizeHectares?: number;
  yearsFarming?: number;
}

/** POST /api/farmers - returns the generated login credentials once. */
export async function createFarmer(payload: CreateFarmerPayload): Promise<CreatedFarmer> {
  return api.post<CreatedFarmer>('/farmers', payload);
}

export interface UpdateFarmerPayload {
  fullName?: string;
  phoneNumber?: string;
  barangay?: string;
  farmSizeHectares?: number;
  yearsFarming?: number;
  isActive?: boolean;
  password?: string;
}

/** PATCH /api/farmers/:id - edit / activate / deactivate / reset password. */
export async function updateFarmer(
  id: number,
  payload: UpdateFarmerPayload
): Promise<UpdatedFarmer> {
  return api.patch<UpdatedFarmer>(`/farmers/${id}`, payload);
}
