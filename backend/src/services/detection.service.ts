/**
 * Leaf-scan detections for the CAO admin platform.
 *
 * `detections` is the permanent record of every scan a farmer's
 * phone has run. The mobile app writes here through createDetection()
 * as soon as a scan finishes; the admin Detections page, the
 * dashboard tiles and a farmer's "view this farmer's scans"
 * drill-down all read it through listDetections().
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CreateDetectionInput, ReviewDetectionInput } from '../utils/validation';

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high';
export type DetectionResult = 'healthy' | 'diseased';
export type ReviewStatus = 'unreviewed' | 'confirmed' | 'corrected';

export interface DetectionSummary {
  id: number;
  farmerId: number;
  farmerName: string;
  barangay: string | null;
  diseaseName: string | null;
  predictedClass: string;
  confidenceScore: number;
  confidenceLevel: string;
  riskLevel: string;
  isHealthy: boolean;
  imagePath: string;
  detectedAt: Date;
  /** CAO review layer - never overwrites the AI fields above. */
  reviewStatus: ReviewStatus;
  correctedClass: string | null;
  correctedDiseaseName: string | null;
  reviewNote: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
}

interface DetectionRow extends RowDataPacket {
  id: number;
  user_id: number;
  farmer_name: string;
  barangay: string | null;
  disease_name: string | null;
  is_healthy: number | null;
  predicted_class: string;
  confidence_score: number;
  confidence_level: string;
  risk_level: string;
  image_path: string;
  detected_at: Date;
  review_status: ReviewStatus;
  corrected_class: string | null;
  corrected_disease_name: string | null;
  review_note: string | null;
  reviewed_by_name: string | null;
  reviewed_at: Date | null;
}

function toSummary(row: DetectionRow): DetectionSummary {
  return {
    id: row.id,
    farmerId: row.user_id,
    farmerName: row.farmer_name,
    barangay: row.barangay,
    diseaseName: row.disease_name,
    predictedClass: row.predicted_class,
    confidenceScore: Number(row.confidence_score),
    confidenceLevel: row.confidence_level,
    riskLevel: row.risk_level,
    isHealthy: row.is_healthy === 1,
    imagePath: row.image_path,
    detectedAt: row.detected_at,
    reviewStatus: row.review_status,
    correctedClass: row.corrected_class,
    correctedDiseaseName: row.corrected_disease_name,
    reviewNote: row.review_note,
    reviewedByName: row.reviewed_by_name,
    reviewedAt: row.reviewed_at,
  };
}

const SELECT_DETECTION = `
  SELECT
    d.id, d.user_id,
    u.full_name AS farmer_name,
    COALESCE(f.barangay, f.address) AS barangay,
    dis.display_name AS disease_name,
    dis.is_healthy,
    d.predicted_class, d.confidence_score, d.confidence_level,
    d.risk_level, d.image_path, d.detected_at,
    d.review_status, d.corrected_class, d.review_note, d.reviewed_at,
    cdis.display_name AS corrected_disease_name,
    rv.full_name AS reviewed_by_name
  FROM detections d
  JOIN users u ON u.id = d.user_id
  LEFT JOIN diseases dis ON dis.id = d.disease_id
  LEFT JOIN diseases cdis ON cdis.class_label = d.corrected_class
  LEFT JOIN users rv ON rv.id = d.reviewed_by
  LEFT JOIN farmers f ON f.user_id = u.id
`;

export interface ListDetectionsOptions {
  farmerId?: number;
  riskLevel?: RiskLevel;
  /** 'healthy' -> only healthy-leaf scans; 'diseased' -> everything else. */
  result?: DetectionResult;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ListDetectionsResult {
  detections: DetectionSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** CAO admin only. Newest scan first, optionally filtered. */
export async function listDetections(
  options: ListDetectionsOptions
): Promise<ListDetectionsResult> {
  const { farmerId, riskLevel, result, search, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (farmerId) {
    conditions.push('d.user_id = ?');
    params.push(farmerId);
  }
  if (riskLevel) {
    conditions.push('d.risk_level = ?');
    params.push(riskLevel);
  }
  if (result === 'healthy') {
    conditions.push('dis.is_healthy = 1');
  }
  if (result === 'diseased') {
    conditions.push('(dis.is_healthy = 0 OR dis.is_healthy IS NULL)');
  }
  if (search) {
    conditions.push(
      '(u.full_name LIKE ? OR dis.display_name LIKE ? OR d.predicted_class LIKE ?)'
    );
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<DetectionRow[]>(
    `${SELECT_DETECTION} ${whereClause}
     ORDER BY d.detected_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM detections d
     JOIN users u ON u.id = d.user_id
     LEFT JOIN diseases dis ON dis.id = d.disease_id
     ${whereClause}`,
    params
  );

  return {
    detections: rows.map(toSummary),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

/** Maps a raw model score to the stored band - matches the seed script. */
function confidenceLevelFor(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

/**
 * The write side of `detections`: the mobile app posts a finished
 * scan here. `disease_id` and `risk_level` are resolved from the
 * `diseases` row for the predicted class, so a scan lines up with
 * the live Disease Library. The AI fields are stored exactly as
 * sent - the CAO review layer never edits them.
 */
export async function createDetection(
  userId: number,
  input: CreateDetectionInput
): Promise<DetectionSummary> {
  const [diseaseRows] = await pool.query<RowDataPacket[]>(
    'SELECT id, default_risk_level, is_healthy FROM diseases WHERE class_label = ? LIMIT 1',
    [input.predictedClass]
  );
  const disease = diseaseRows[0];
  if (!disease) {
    throw ApiError.badRequest('Unknown predicted class', 'DISEASE_NOT_FOUND');
  }

  const isHealthy = disease.is_healthy === 1;
  const riskLevel: RiskLevel = isHealthy
    ? 'none'
    : (disease.default_risk_level as RiskLevel);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO detections
       (user_id, disease_id, image_path, predicted_class,
        confidence_score, confidence_level, risk_level, model_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      disease.id,
      input.imagePath,
      input.predictedClass,
      input.confidenceScore,
      confidenceLevelFor(input.confidenceScore),
      riskLevel,
      'mobile-stand-in',
    ]
  );

  return getDetectionById(result.insertId);
}

/** CAO admin only. One detection with its review layer. */
export async function getDetectionById(id: number): Promise<DetectionSummary> {
  const [rows] = await pool.query<DetectionRow[]>(
    `${SELECT_DETECTION} WHERE d.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) {
    throw ApiError.notFound('Detection not found');
  }
  return toSummary(rows[0]);
}

/**
 * CAO admin only. Records an agronomist's verdict on a scan WITHOUT
 * touching the model's output. 'confirmed' endorses the AI result;
 * 'corrected' overrides it with `correctedClass` (a diseases.class_label)
 * for reporting, while predicted_class / disease_id / risk_level stay
 * exactly as the model left them.
 */
export async function reviewDetection(
  id: number,
  adminId: number,
  input: ReviewDetectionInput
): Promise<DetectionSummary> {
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM detections WHERE id = ? LIMIT 1',
    [id]
  );
  if (existing.length === 0) {
    throw ApiError.notFound('Detection not found');
  }

  let correctedClass: string | null = null;
  if (input.status === 'corrected') {
    const cls = input.correctedClass?.trim();
    if (!cls) {
      throw ApiError.badRequest(
        'Pick the disease this scan should be, or choose Confirm instead.'
      );
    }
    const [clsRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM diseases WHERE class_label = ? LIMIT 1',
      [cls]
    );
    if (clsRows.length === 0) {
      throw ApiError.badRequest('That disease class does not exist', 'DISEASE_NOT_FOUND');
    }
    correctedClass = cls;
  }

  const note = input.note?.trim() ? input.note.trim() : null;
  const isReviewed = input.status !== 'unreviewed';

  await pool.query<ResultSetHeader>(
    `UPDATE detections
       SET review_status = ?, corrected_class = ?, review_note = ?,
           reviewed_by = ?, reviewed_at = ?
     WHERE id = ?`,
    [input.status, correctedClass, note, isReviewed ? adminId : null, isReviewed ? new Date() : null, id]
  );

  return getDetectionById(id);
}
