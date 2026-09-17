/**
 * Dashboard analytics calls for the CAO admin platform.
 *
 * The headline tiles come straight from api.get('/dashboard/statistics')
 * in DashboardPage.tsx; this module owns the follow-on calls the page
 * makes as the CAO drills in.
 */

import { api } from './api';
import type { BarangayBreakdown, FarmerBarangayCount, RecentDetection, RiskLevel } from '../types';

/**
 * GET /api/dashboard/barangay-breakdown?risk=
 *
 * Scans grouped by the scanning farmer's barangay - healthy vs
 * diseased plus a per-disease tally - optionally filtered to one
 * risk level. With no filter the totals reconcile with the
 * dashboard's headline healthy / diseased tiles.
 */
export async function getBarangayBreakdown(risk?: RiskLevel): Promise<BarangayBreakdown> {
  const query = risk ? `?risk=${risk}` : '';
  return api.get<BarangayBreakdown>(`/dashboard/barangay-breakdown${query}`);
}

/**
 * GET /api/dashboard/farmers-per-barangay
 *
 * Registered farmers grouped by barangay, highest first. Summing
 * every row's `total` equals the dashboard's headline "Total Farmers"
 * tile.
 */
export async function getFarmersPerBarangay(): Promise<FarmerBarangayCount[]> {
  const result = await api.get<{ barangays: FarmerBarangayCount[] }>(
    '/dashboard/farmers-per-barangay'
  );
  return result.barangays;
}

export interface RecentDetectionsFilters {
  risk?: RiskLevel;
  barangay?: string;
  limit?: number;
}

/**
 * GET /api/dashboard/recent-detections?risk=&barangay=&limit=
 *
 * The most recent scans, newest first, optionally filtered to one
 * risk level and/or one barangay.
 */
export async function getRecentDetections(
  filters: RecentDetectionsFilters = {}
): Promise<RecentDetection[]> {
  const params = new URLSearchParams();
  if (filters.risk) params.set('risk', filters.risk);
  if (filters.barangay) params.set('barangay', filters.barangay);
  if (filters.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const result = await api.get<{ detections: RecentDetection[] }>(
    `/dashboard/recent-detections${query ? `?${query}` : ''}`
  );
  return result.detections;
}
