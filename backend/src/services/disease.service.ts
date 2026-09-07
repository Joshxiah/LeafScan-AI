/**
 * Disease reference data for the app's Disease Library.
 *
 * Reads the four seeded classes from the `diseases` table and
 * attaches any expert-verified treatment recommendations the CAO
 * has published.
 *
 * The mobile app is bilingual (English / Cebuano). Every
 * translatable text column has a parallel `*_ceb` column (see
 * database/add_disease_translations.sql); when lang = 'ceb' the
 * query returns the Cebuano value, falling back to English wherever
 * a translation has not been filled in yet. `scientific_name` is a
 * Latin binomial and is never translated.
 */

import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high';
export type DiseaseLang = 'en' | 'ceb';

export interface TreatmentRecommendation {
  id: number;
  title: string;
  recommendationText: string;
  applicationMethod: string | null;
  preventiveMeasures: string | null;
}

export interface DiseaseInfo {
  id: number;
  classLabel: string;
  displayName: string;
  scientificName: string | null;
  description: string | null;
  symptoms: string | null;
  defaultRiskLevel: RiskLevel;
  isHealthy: boolean;
  treatments: TreatmentRecommendation[];
}

interface DiseaseRow extends RowDataPacket {
  id: number;
  class_label: string;
  display_name: string;
  scientific_name: string | null;
  description: string | null;
  symptoms: string | null;
  default_risk_level: RiskLevel;
  is_healthy: number;
}

interface TreatmentRow extends RowDataPacket {
  id: number;
  disease_id: number;
  title: string;
  recommendation_text: string;
  application_method: string | null;
  preventive_measures: string | null;
}

/**
 * Returns every disease class, healthy included, ordered with the
 * real diseases first and "Healthy Corn Leaf" last.
 */
export async function listDiseases(lang: DiseaseLang = 'en'): Promise<DiseaseInfo[]> {
  const ceb = lang === 'ceb';

  // COALESCE(<ceb col>, <en col>) so a missing translation degrades
  // to English rather than to NULL. The English form is a plain
  // column reference, so both branches type identically.
  const displayName = ceb ? 'COALESCE(display_name_ceb, display_name)' : 'display_name';
  const description = ceb ? 'COALESCE(description_ceb, description)' : 'description';
  const symptoms = ceb ? 'COALESCE(symptoms_ceb, symptoms)' : 'symptoms';

  const trTitle = ceb ? 'COALESCE(title_ceb, title)' : 'title';
  const trText = ceb ? 'COALESCE(recommendation_text_ceb, recommendation_text)' : 'recommendation_text';
  const trMethod = ceb ? 'COALESCE(application_method_ceb, application_method)' : 'application_method';
  const trPrevent = ceb ? 'COALESCE(preventive_measures_ceb, preventive_measures)' : 'preventive_measures';

  const [diseaseRows, treatmentRows] = await Promise.all([
    pool.query<DiseaseRow[]>(
      `SELECT id, class_label,
              ${displayName} AS display_name,
              scientific_name,
              ${description}  AS description,
              ${symptoms}     AS symptoms,
              default_risk_level, is_healthy
       FROM diseases
       ORDER BY is_healthy ASC, display_name ASC`
    ),
    pool.query<TreatmentRow[]>(
      `SELECT id, disease_id,
              ${trTitle}   AS title,
              ${trText}    AS recommendation_text,
              ${trMethod}  AS application_method,
              ${trPrevent} AS preventive_measures
       FROM treatment_recommendations
       WHERE is_active = 1
       ORDER BY id ASC`
    ),
  ]);

  const treatmentsByDisease = new Map<number, TreatmentRecommendation[]>();
  for (const row of treatmentRows[0]) {
    const list = treatmentsByDisease.get(row.disease_id) ?? [];
    list.push({
      id: row.id,
      title: row.title,
      recommendationText: row.recommendation_text,
      applicationMethod: row.application_method,
      preventiveMeasures: row.preventive_measures,
    });
    treatmentsByDisease.set(row.disease_id, list);
  }

  return diseaseRows[0].map((row) => ({
    id: row.id,
    classLabel: row.class_label,
    displayName: row.display_name,
    scientificName: row.scientific_name,
    description: row.description,
    symptoms: row.symptoms,
    defaultRiskLevel: row.default_risk_level,
    isHealthy: row.is_healthy === 1,
    treatments: treatmentsByDisease.get(row.id) ?? [],
  }));
}
