/**
 * Agriculturist directory calls for the CAO admin platform.
 *
 * The CAO owns this directory of field agriculturists it can send
 * out to assess a report. Mirrors farmer.service.ts.
 */

import { api } from './api';
import type {
  AgriculturistAccountStatus,
  AgriculturistSummary,
  ListAgriculturistsResult,
} from '../types';

export interface ListAgriculturistsFilters {
  status?: AgriculturistAccountStatus;
  search?: string;
  barangay?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/agriculturists?status=&search=&barangay=&page=&pageSize= */
export async function listAgriculturists(
  filters: ListAgriculturistsFilters = {}
): Promise<ListAgriculturistsResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.barangay) params.set('barangay', filters.barangay);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListAgriculturistsResult>(`/agriculturists${query ? `?${query}` : ''}`);
}

export interface AgriculturistPayload {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  barangay?: string;
  municipality?: string;
  specialization?: string;
  isActive?: boolean;
}

/** POST /api/agriculturists */
export async function createAgriculturist(
  payload: AgriculturistPayload
): Promise<{ agriculturist: AgriculturistSummary }> {
  return api.post<{ agriculturist: AgriculturistSummary }>('/agriculturists', payload);
}

/** PATCH /api/agriculturists/:id - edit / activate / deactivate. */
export async function updateAgriculturist(
  id: number,
  payload: AgriculturistPayload
): Promise<{ agriculturist: AgriculturistSummary }> {
  return api.patch<{ agriculturist: AgriculturistSummary }>(`/agriculturists/${id}`, payload);
}

/** DELETE /api/agriculturists/:id */
export async function deleteAgriculturist(id: number): Promise<void> {
  await api.delete<void>(`/agriculturists/${id}`);
}
