/**
 * Farmer account calls for the CAO admin platform.
 */

import { api } from './api';
import type { FarmerAccountStatus, ListFarmersResult } from '../types';

export interface ListFarmersFilters {
  status?: FarmerAccountStatus;
  page?: number;
  pageSize?: number;
}

/**
 * GET /api/farmers?status=&page=&pageSize=
 */
export async function listFarmers(filters: ListFarmersFilters = {}): Promise<ListFarmersResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListFarmersResult>(`/farmers${query ? `?${query}` : ''}`);
}
