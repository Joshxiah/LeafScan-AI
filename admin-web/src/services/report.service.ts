/**
 * Outbreak report calls for the CAO admin platform.
 */

import { api } from './api';
import type { ListReportsResult, ReportDetail, ReportStatus } from '../types';

export interface ListReportsFilters {
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
}

/**
 * GET /api/reports?status=&page=&pageSize=
 */
export async function listReports(filters: ListReportsFilters = {}): Promise<ListReportsResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListReportsResult>(`/reports${query ? `?${query}` : ''}`);
}

/**
 * GET /api/reports/:id
 */
export async function getReport(id: number): Promise<ReportDetail> {
  const result = await api.get<{ report: ReportDetail }>(`/reports/${id}`);
  return result.report;
}

/**
 * PATCH /api/reports/:id/status
 */
export async function updateReportStatus(
  id: number,
  status: Extract<ReportStatus, 'reviewed' | 'resolved'>
): Promise<void> {
  await api.patch<void>(`/reports/${id}/status`, { status });
}
