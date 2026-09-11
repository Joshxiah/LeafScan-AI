/**
 * Outbreak report calls for the CAO admin platform.
 */

import { api } from './api';
import type {
  AdminSettableStatus,
  ListReportsResult,
  ReportDetail,
  ReportStatus,
} from '../types';

export interface ListReportsFilters {
  status?: ReportStatus;
  barangay?: string;
  page?: number;
  pageSize?: number;
}

/**
 * GET /api/reports?status=&barangay=&page=&pageSize=
 */
export async function listReports(filters: ListReportsFilters = {}): Promise<ListReportsResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.barangay) params.set('barangay', filters.barangay);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return api.get<ListReportsResult>(`/reports${query ? `?${query}` : ''}`);
}

/** GET /api/reports/barangays - distinct barangays for the filter dropdown. */
export async function listBarangays(): Promise<string[]> {
  const result = await api.get<{ barangays: string[] }>('/reports/barangays');
  return result.barangays;
}

/**
 * GET /api/reports/:id
 * Opening a report marks it read on the server; the returned
 * report already reflects that (isRead: true).
 */
export async function getReport(id: number): Promise<ReportDetail> {
  const result = await api.get<{ report: ReportDetail }>(`/reports/${id}`);
  return result.report;
}

/**
 * PATCH /api/reports/:id/status
 * Advances a report through the field-assessment lifecycle, with an
 * optional short message relayed to the farmer and, for the
 * agriculturist steps, which agriculturist (from the CAO directory)
 * is being sent. `agriculturistId` omitted -> leave as recorded;
 * `null` -> clear it; a number -> assign that agriculturist.
 */
export async function updateReportStatus(
  id: number,
  status: AdminSettableStatus,
  message?: string,
  agriculturistId?: number | null
): Promise<void> {
  await api.patch<void>(`/reports/${id}/status`, { status, message, agriculturistId });
}
