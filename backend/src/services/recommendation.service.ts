/**
 * Treatment recommendations, write side, for the CAO admin platform.
 *
 * The mobile Disease Library reads these through GET /api/diseases
 * (active ones only). This module lets the CAO manage them from the
 * admin Recommendations page: list every one (active or not), add,
 * edit, or remove. `created_by` records which admin wrote it.
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import {
  CreateRecommendationInput,
  UpdateRecommendationInput,
} from '../utils/validation';

export interface RecommendationSummary {
  id: number;
  diseaseId: number;
  diseaseName: string;
  classLabel: string;
  title: string;
  recommendationText: string;
  applicationMethod: string | null;
  preventiveMeasures: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface RecommendationRow extends RowDataPacket {
  id: number;
  disease_id: number;
  disease_name: string;
  class_label: string;
  title: string;
  recommendation_text: string;
  application_method: string | null;
  preventive_measures: string | null;
  is_active: number;
  created_at: Date;
}

function toSummary(row: RecommendationRow): RecommendationSummary {
  return {
    id: row.id,
    diseaseId: row.disease_id,
    diseaseName: row.disease_name,
    classLabel: row.class_label,
    title: row.title,
    recommendationText: row.recommendation_text,
    applicationMethod: row.application_method,
    preventiveMeasures: row.preventive_measures,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

const SELECT_RECOMMENDATION = `
  SELECT
    tr.id, tr.disease_id,
    dis.display_name AS disease_name,
    dis.class_label,
    tr.title, tr.recommendation_text, tr.application_method,
    tr.preventive_measures, tr.is_active, tr.created_at
  FROM treatment_recommendations tr
  JOIN diseases dis ON dis.id = tr.disease_id
`;

async function getById(id: number): Promise<RecommendationSummary> {
  const [rows] = await pool.query<RecommendationRow[]>(
    `${SELECT_RECOMMENDATION} WHERE tr.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) {
    throw ApiError.notFound('Recommendation not found');
  }
  return toSummary(rows[0]);
}

/** CAO admin only. Every recommendation, active or not, disease first. */
export async function listRecommendations(): Promise<RecommendationSummary[]> {
  const [rows] = await pool.query<RecommendationRow[]>(
    `${SELECT_RECOMMENDATION}
     ORDER BY dis.is_healthy ASC, dis.display_name ASC, tr.id ASC`
  );
  return rows.map(toSummary);
}

/** CAO admin only. */
export async function createRecommendation(
  input: CreateRecommendationInput,
  createdBy: number
): Promise<RecommendationSummary> {
  const [disease] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM diseases WHERE id = ? LIMIT 1',
    [input.diseaseId]
  );
  if (disease.length === 0) {
    throw ApiError.badRequest('That disease does not exist', 'DISEASE_NOT_FOUND');
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO treatment_recommendations
       (disease_id, title, recommendation_text, application_method,
        preventive_measures, created_by, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.diseaseId,
      input.title,
      input.recommendationText,
      input.applicationMethod || null,
      input.preventiveMeasures || null,
      createdBy,
      input.isActive === false ? 0 : 1,
    ]
  );

  return getById(result.insertId);
}

/** CAO admin only. */
export async function updateRecommendation(
  id: number,
  input: UpdateRecommendationInput
): Promise<RecommendationSummary> {
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM treatment_recommendations WHERE id = ? LIMIT 1',
    [id]
  );
  if (existing.length === 0) {
    throw ApiError.notFound('Recommendation not found');
  }

  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (input.title !== undefined) {
    sets.push('title = ?');
    params.push(input.title);
  }
  if (input.recommendationText !== undefined) {
    sets.push('recommendation_text = ?');
    params.push(input.recommendationText);
  }
  if (input.applicationMethod !== undefined) {
    sets.push('application_method = ?');
    params.push(input.applicationMethod || null);
  }
  if (input.preventiveMeasures !== undefined) {
    sets.push('preventive_measures = ?');
    params.push(input.preventiveMeasures || null);
  }
  if (input.isActive !== undefined) {
    sets.push('is_active = ?');
    params.push(input.isActive ? 1 : 0);
  }

  if (sets.length > 0) {
    await pool.query(
      `UPDATE treatment_recommendations SET ${sets.join(', ')} WHERE id = ?`,
      [...params, id]
    );
  }

  return getById(id);
}

/** CAO admin only. */
export async function deleteRecommendation(id: number): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM treatment_recommendations WHERE id = ?',
    [id]
  );
  if (result.affectedRows === 0) {
    throw ApiError.notFound('Recommendation not found');
  }
}
