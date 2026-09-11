/**
 * Leaf-scan detection calls for the CAO admin platform (read only).
 */

import { api } from './api';
import type { DetectionSummary, ListDetectionsResult, RiskLevel } from '../types';

export interface ListDetectionsFilters {
  farmerId?: number;
  risk?: RiskLevel;
  result?: 'healthy' | 'diseased';
  search?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/detections?farmerId=&risk=&result=&search=&page=&pageSize= */
export async function listDetections(
  filters: ListDetectionsFilters = {}
): Promise<ListDetectionsResult> {
  const params = new URLSearchParams();
  if (filters.farmerId) params.set('farmerId', String(filters.farmerId));
  if (filters.risk) params.set('risk', filters.risk);
  if (filters.result) params.set('result', filters.result);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListDetectionsResult>(`/detections${query ? `?${query}` : ''}`);
}

export interface ReviewDetectionPayload {
  status: 'unreviewed' | 'confirmed' | 'corrected';
  /** diseases.class_label - required when status is 'corrected'. */
  correctedClass?: string;
  note?: string;
}

/** PATCH /api/detections/:id/review - record a confirm / correct verdict. */
export async function reviewDetection(
  id: number,
  payload: ReviewDetectionPayload
): Promise<{ detection: DetectionSummary }> {
  return api.patch<{ detection: DetectionSummary }>(`/detections/${id}/review`, payload);
}
