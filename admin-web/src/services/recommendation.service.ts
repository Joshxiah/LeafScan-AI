/**
 * Treatment-recommendation CRUD for the CAO admin platform.
 *
 * Reads every recommendation (active or not) via GET /api/recommendations
 * and writes through POST / PATCH / DELETE. The mobile app still reads
 * the active ones through GET /api/diseases.
 */

import { api } from './api';
import type { RecommendationSummary } from '../types';

/** GET /api/recommendations - all recommendations, disease first. */
export async function listRecommendations(): Promise<RecommendationSummary[]> {
  const result = await api.get<{ recommendations: RecommendationSummary[] }>('/recommendations');
  return result.recommendations;
}

export interface RecommendationPayload {
  diseaseId?: number;
  title?: string;
  recommendationText?: string;
  applicationMethod?: string;
  preventiveMeasures?: string;
  isActive?: boolean;
}

/** POST /api/recommendations */
export async function createRecommendation(
  payload: RecommendationPayload
): Promise<{ recommendation: RecommendationSummary }> {
  return api.post<{ recommendation: RecommendationSummary }>('/recommendations', payload);
}

/** PATCH /api/recommendations/:id */
export async function updateRecommendation(
  id: number,
  payload: RecommendationPayload
): Promise<{ recommendation: RecommendationSummary }> {
  return api.patch<{ recommendation: RecommendationSummary }>(`/recommendations/${id}`, payload);
}

/** DELETE /api/recommendations/:id */
export async function deleteRecommendation(id: number): Promise<void> {
  await api.delete<void>(`/recommendations/${id}`);
}
