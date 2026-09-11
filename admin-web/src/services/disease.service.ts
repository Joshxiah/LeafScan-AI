/**
 * Disease-library calls for the CAO admin platform.
 *
 * Read only - the same reference content the mobile app's Disease
 * Library shows, sourced from the `diseases` and
 * `treatment_recommendations` tables via GET /api/diseases.
 */

import { api } from './api';
import type { DiseaseInfo, RiskLevel } from '../types';

/** GET /api/diseases - every disease class with its active treatments. */
export async function listDiseases(): Promise<DiseaseInfo[]> {
  const result = await api.get<{ diseases: DiseaseInfo[] }>('/diseases');
  return result.diseases;
}

export interface UpdateDiseasePayload {
  displayName?: string;
  scientificName?: string;
  description?: string;
  symptoms?: string;
  defaultRiskLevel?: RiskLevel;
}

/** PATCH /api/diseases/:id - edit one class's reference content. Admin only. */
export async function updateDisease(
  id: number,
  payload: UpdateDiseasePayload
): Promise<{ disease: DiseaseInfo }> {
  return api.patch<{ disease: DiseaseInfo }>(`/diseases/${id}`, payload);
}
