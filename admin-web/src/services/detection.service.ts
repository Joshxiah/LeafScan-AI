/**
 * Leaf-scan detection calls for the CAO admin platform (read only).
 */

import { api } from './api';
import type { ListDetectionsResult, RiskLevel } from '../types';

export interface ListDetectionsFilters {
  farmerId?: number;
  risk?: RiskLevel;
  result?: 'healthy' | 'diseased';
  search?: string;
  barangay?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/detections?farmerId=&risk=&result=&search=&barangay=&page=&pageSize= */
export async function listDetections(
  filters: ListDetectionsFilters = {}
): Promise<ListDetectionsResult> {
  const params = new URLSearchParams();
  if (filters.farmerId) params.set('farmerId', String(filters.farmerId));
  if (filters.risk) params.set('risk', filters.risk);
  if (filters.result) params.set('result', filters.result);
  if (filters.search) params.set('search', filters.search);
  if (filters.barangay) params.set('barangay', filters.barangay);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListDetectionsResult>(`/detections${query ? `?${query}` : ''}`);
}
