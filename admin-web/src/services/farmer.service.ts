/**
 * Farmer account calls for the CAO admin platform.
 *
 * The CAO owns farmer accounts: it creates them and hands the
 * farmer their credentials. Farmers do not self-register.
 */

import { api } from './api';
import type {
  AccountRole,
  AreaUnit,
  CreatedFarmer,
  FarmerAccountStatus,
  ListFarmersResult,
  UpdatedFarmer,
} from '../types';

/** One farm plot as the admin form submits it. */
export interface FarmPlotPayload {
  purok?: string;
  areaValue: number;
  areaUnit: AreaUnit;
  note?: string;
}

export interface ListFarmersFilters {
  status?: FarmerAccountStatus;
  search?: string;
  barangay?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/farmers?status=&search=&barangay=&page=&pageSize= */
export async function listFarmers(filters: ListFarmersFilters = {}): Promise<ListFarmersResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.barangay) params.set('barangay', filters.barangay);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListFarmersResult>(`/farmers${query ? `?${query}` : ''}`);
}

/**
 * GET /api/farmers/barangays - distinct barangays for the Farmers/
 * Detections filter dropdowns and the Add/Edit Farmer barangay select.
 */
export async function listBarangays(): Promise<string[]> {
  const result = await api.get<{ barangays: string[] }>('/farmers/barangays');
  return result.barangays;
}

export interface CreateAccountPayload {
  role: AccountRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  password: string;
  phoneNumber: string;
  gender?: 'male' | 'female' | 'other';
  /** YYYY-MM-DD */
  dateOfBirth?: string;
  /** From uploadImage() in upload.service.ts. */
  avatarPath?: string;

  region?: string;
  province?: string;
  municipality?: string;
  barangay?: string;

  // Farmer-only - ignored by the backend when role is 'admin'.
  farmSizeHectares?: number;
  plots?: FarmPlotPayload[];
  yearsFarming?: number;
}

/** POST /api/farmers - creates a farmer or an admin with the given login credentials. */
export async function createAccount(payload: CreateAccountPayload): Promise<CreatedFarmer> {
  return api.post<CreatedFarmer>('/farmers', payload);
}

export interface UpdateFarmerPayload {
  fullName?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other';
  /** YYYY-MM-DD */
  dateOfBirth?: string;
  region?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  /** From uploadImage() in upload.service.ts, or '' to remove the photo. */
  avatarPath?: string;
  farmSizeHectares?: number;
  /** Replaces the farmer's whole set of plots when present. */
  plots?: FarmPlotPayload[];
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

/** DELETE /api/farmers/:id - permanently removes the account. No undo. */
export async function deleteAccount(id: number): Promise<void> {
  await api.delete<void>(`/farmers/${id}`);
}
