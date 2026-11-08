/**
 * Barangay-level overall risk for the dashboard's "Risk by Barangay" table.
 *
 * Why this exists: the old rule was "highest risk level with at least one
 * scan", so a barangay with 3 scans and a single Gray Leaf Spot leaf was
 * labelled High. One leaf is not evidence about a barangay.
 *
 * Method (all of it is plain arithmetic the CAO can check by hand):
 *
 *   1. Every scan gets a grade from the risk level of its disease:
 *        No disease = 0, Low = 1, Moderate = 2, High = 3.
 *   2. Disease Index (DI) = sum(grade of every scan) / (scans x 3) x 100.
 *      DI is a 0-100 score that combines HOW MANY leaves are diseased
 *      (incidence) with HOW DAMAGING those diseases are (severity grade).
 *      This is the standard plant-pathology "disease index" form
 *      (sum of rating x count, divided by total assessed x maximum rating,
 *      times 100; commonly attributed to McKinney, 1923).
 *   3. A barangay needs MIN_SCANS scans before it is classified at all.
 *      Below that it is shown as "Not enough data" instead of a guess.
 *
 * The cutoffs below are DEFAULTS. The project has no official CAO/DA
 * threshold yet (the same is true of diseases.default_risk_level, which is
 * stored as placeholder data pending CAO confirmation), so they are kept in
 * this one block to be changed without touching any other code.
 */

import type { RiskLevel } from '../types';

/** Minimum scans in a barangay before it gets a risk label. */
export const MIN_SCANS = 10;

/** DI below this is Low; from here up to HIGH_FROM is Moderate. */
export const MODERATE_FROM = 15;

/** DI at or above this is High. */
export const HIGH_FROM = 30;

/** Grade given to one scan of each risk level. */
const GRADE: Record<RiskLevel, number> = { none: 0, low: 1, moderate: 2, high: 3 };
const MAX_GRADE = 3;

export type BarangayRisk = RiskLevel | 'insufficient';

export interface BarangayRiskAssessment {
  /** The label to show; 'insufficient' when there are fewer than MIN_SCANS scans. */
  level: BarangayRisk;
  /** Disease Index, 0-100. */
  index: number;
  /** Share of scans that were diseased, 0-100. */
  incidence: number;
  total: number;
}

/** `counts` is scans per risk level for one barangay (none = healthy). */
export function assessBarangayRisk(counts: Record<RiskLevel, number>): BarangayRiskAssessment {
  const total = counts.none + counts.low + counts.moderate + counts.high;
  if (total === 0) return { level: 'insufficient', index: 0, incidence: 0, total };

  const diseased = counts.low + counts.moderate + counts.high;
  const gradeSum =
    counts.low * GRADE.low + counts.moderate * GRADE.moderate + counts.high * GRADE.high;
  const index = (gradeSum / (total * MAX_GRADE)) * 100;
  const incidence = (diseased / total) * 100;

  let level: BarangayRisk;
  if (total < MIN_SCANS) level = 'insufficient';
  else if (diseased === 0) level = 'none';
  else if (index >= HIGH_FROM) level = 'high';
  else if (index >= MODERATE_FROM) level = 'moderate';
  else level = 'low';

  return { level, index, incidence, total };
}
