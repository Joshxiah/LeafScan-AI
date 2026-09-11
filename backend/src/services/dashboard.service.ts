/**
 * Dashboard statistics for the CAO admin platform.
 *
 * Every number here is read from the database. Nothing is
 * estimated, cached, or hardcoded. When the detections table is
 * empty, these correctly return zero.
 */

import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

export interface DashboardStatistics {
  totalFarmers: number;
  totalAgriculturists: number;
  totalScans: number;
  healthyScans: number;
  diseasedScans: number;
  highRiskScans: number;
  scansToday: number;
  pendingReports: number;
  totalReports: number;
  diseaseBreakdown: DiseaseCount[];
  scanTrend: ScanTrendPoint[];
}

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high';

export interface DiseaseCount {
  classLabel: string;
  displayName: string;
  count: number;
  riskLevel: RiskLevel;
}

/** One day's scan count, for the "scans over time" trend chart. */
export interface ScanTrendPoint {
  date: string;
  count: number;
}

export interface RecentDetection {
  id: number;
  farmerName: string;
  /** The scanning farmer's barangay, or 'Unspecified' when they have none on file. */
  barangay: string;
  diseaseName: string | null;
  predictedClass: string;
  confidenceScore: number;
  riskLevel: string;
  detectedAt: string;
}

/** The label used when a farmer has neither a barangay nor an address. */
const UNSPECIFIED_BARANGAY = 'Unspecified';

/**
 * SQL for "this farmer's barangay, or their free-text address, or
 * 'Unspecified'" - the same resolution detection.service.ts and
 * farmer.service.ts use, with an explicit final bucket so grouping
 * or filtering by it never silently drops a row. `alias` is the
 * table alias `farmers` was joined under (LEFT JOIN, so it may be
 * NULL for a user with no profile row at all).
 */
function barangayExpr(alias = 'f'): string {
  return `COALESCE(NULLIF(${alias}.barangay, ''), NULLIF(${alias}.address, ''), '${UNSPECIFIED_BARANGAY}')`;
}

/** How many days of history the trend chart covers. */
const TREND_DAYS = 14;

/**
 * Fills in zero-count days, so the trend chart always has a full,
 * continuous run of days even when nothing was scanned on some of
 * them - a query alone would just omit those days entirely.
 */
function buildTrend(rows: { day: string; count: number }[]): ScanTrendPoint[] {
  const countByDay = new Map(rows.map((r) => [r.day, r.count]));
  const points: ScanTrendPoint[] = [];

  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, count: countByDay.get(key) ?? 0 });
  }

  return points;
}

/**
 * Gathers every figure the dashboard displays.
 *
 * Uses Promise.all so the queries run at the same time rather
 * than one after another.
 */
export async function getStatistics(): Promise<DashboardStatistics> {
  const [
    farmerRows,
    agriculturistRows,
    scanRows,
    healthyRows,
    riskRows,
    todayRows,
    reportRows,
    breakdownRows,
    trendRows,
  ] = await Promise.all([
    // Total registered farmers
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'farmer'`
    ),

    // Active agriculturists in the CAO directory
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM agriculturists WHERE is_active = 1`
    ),

    // Total scans ever performed
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM detections`),

    // Scans where the result was a healthy leaf.
    // Joined to diseases so the definition of "healthy" lives in
    // the database (is_healthy flag), not in this code.
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM detections d
       JOIN diseases dis ON dis.id = d.disease_id
       WHERE dis.is_healthy = 1`
    ),

    // Scans flagged as high risk
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM detections WHERE risk_level = 'high'`
    ),

    // Scans recorded today
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM detections
       WHERE DATE(detected_at) = CURDATE()`
    ),

    // Reports awaiting CAO attention, and the all-time total
    pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*)                                        AS total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
       FROM reports`
    ),

    // How many scans per disease class.
    // LEFT JOIN so a disease with zero detections still appears.
    pool.query<RowDataPacket[]>(
      `SELECT dis.class_label, dis.display_name, dis.default_risk_level, COUNT(d.id) AS count
       FROM diseases dis
       LEFT JOIN detections d ON d.disease_id = dis.id
       GROUP BY dis.id, dis.class_label, dis.display_name, dis.default_risk_level
       ORDER BY dis.class_label`
    ),

    // Scans per day, for the last two weeks
    pool.query<RowDataPacket[]>(
      `SELECT DATE(detected_at) AS day, COUNT(*) AS count
       FROM detections
       WHERE detected_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(detected_at)`,
      [TREND_DAYS - 1]
    ),
  ]);

  const totalScans = Number(scanRows[0][0].total);
  const healthyScans = Number(healthyRows[0][0].total);

  return {
    totalFarmers: Number(farmerRows[0][0].total),
    totalAgriculturists: Number(agriculturistRows[0][0].total),
    totalScans,
    healthyScans,

    // Derived rather than queried separately, so the two figures
    // can never disagree with each other.
    diseasedScans: totalScans - healthyScans,

    highRiskScans: Number(riskRows[0][0].total),
    scansToday: Number(todayRows[0][0].total),

    totalReports: Number(reportRows[0][0].total ?? 0),
    pendingReports: Number(reportRows[0][0].pending ?? 0),

    diseaseBreakdown: breakdownRows[0].map((row) => ({
      classLabel: row.class_label,
      displayName: row.display_name,
      count: Number(row.count),
      riskLevel: row.default_risk_level,
    })),

    scanTrend: buildTrend(
      trendRows[0].map((row) => ({
        // mysql2 returns DATE columns as JS Date objects (in the
        // pool's configured UTC timezone) - format to "YYYY-MM-DD"
        // so it matches the keys buildTrend generates.
        day: new Date(row.day).toISOString().slice(0, 10),
        count: Number(row.count),
      }))
    ),
  };
}

/** How many recent detections to return when the caller does not ask for a specific count. */
const DEFAULT_RECENT_LIMIT = 10;
/** Hard ceiling, regardless of what a caller requests. */
const MAX_RECENT_LIMIT = 50;

export interface ListRecentDetectionsOptions {
  riskLevel?: RiskLevel;
  barangay?: string;
  limit?: number;
}

/**
 * The most recent scans, newest first, optionally filtered to one
 * risk level and/or one barangay - powers the dashboard's "Recent
 * Detections" table and its filters.
 */
export async function getRecentDetections(
  options: ListRecentDetectionsOptions = {}
): Promise<RecentDetection[]> {
  const limit = Math.min(
    Math.max(Math.trunc(options.limit ?? DEFAULT_RECENT_LIMIT), 1),
    MAX_RECENT_LIMIT
  );

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (options.riskLevel) {
    conditions.push('d.risk_level = ?');
    params.push(options.riskLevel);
  }
  if (options.barangay) {
    conditions.push(`${barangayExpr()} = ?`);
    params.push(options.barangay);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       d.id,
       u.full_name        AS farmer_name,
       ${barangayExpr()}  AS barangay,
       dis.display_name   AS disease_name,
       d.predicted_class,
       d.confidence_score,
       d.risk_level,
       d.detected_at
     FROM detections d
     JOIN users u        ON u.id = d.user_id
     LEFT JOIN farmers f  ON f.user_id = u.id
     LEFT JOIN diseases dis ON dis.id = d.disease_id
     ${whereClause}
     ORDER BY d.detected_at DESC
     LIMIT ?`,
    [...params, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    farmerName: row.farmer_name,
    barangay: row.barangay,
    diseaseName: row.disease_name,
    predictedClass: row.predicted_class,
    confidenceScore: Number(row.confidence_score),
    riskLevel: row.risk_level,
    detectedAt: row.detected_at,
  }));
}

// ============================================================
// BARANGAY BREAKDOWN
//
// "Which barangay is scanning healthy, and which disease, on the
// dashboard" - and the per-barangay figures MUST reconcile with the
// headline tiles: sum(healthy) === getStatistics().healthyScans,
// sum(diseased) === getStatistics().diseasedScans.
//
// Every detection is bucketed by the scanning farmer's barangay,
// falling back to their free-text address and then to a single
// 'Unspecified' bucket, so no scan is ever dropped from the totals.
// ============================================================

/** One disease's tally within a barangay, for the risk-per-disease graph. */
export interface BarangayDiseaseCount {
  classLabel: string;
  displayName: string;
  riskLevel: RiskLevel;
  count: number;
}

export interface BarangayBreakdownRow {
  barangay: string;
  healthy: number;
  diseased: number;
  total: number;
  diseases: BarangayDiseaseCount[];
}

export interface BarangayBreakdown {
  /** 'all', or the single risk level the figures were filtered to. */
  generatedFor: 'all' | RiskLevel;
  totals: { healthy: number; diseased: number; total: number };
  barangays: BarangayBreakdownRow[];
}

interface BarangayGroupRow {
  barangay: string;
  class_label: string | null;
  display_name: string | null;
  default_risk_level: RiskLevel | null;
  is_healthy: number | null;
  count: number;
}

/**
 * Scans grouped by barangay and disease class, optionally filtered
 * to a single risk level. Reads the model's raw disease_id /
 * risk_level - the CAO 'corrected_class' review layer is not applied
 * here, matching the "Scans by Disease Class" card.
 */
export async function getBarangayBreakdown(
  riskLevel?: RiskLevel
): Promise<BarangayBreakdown> {
  const params: (string | number)[] = [];
  let whereClause = '';
  if (riskLevel) {
    whereClause = 'WHERE d.risk_level = ?';
    params.push(riskLevel);
  }

  const [rows] = await pool.query<(BarangayGroupRow & RowDataPacket)[]>(
    `SELECT
       ${barangayExpr()}      AS barangay,
       dis.class_label,
       dis.display_name,
       dis.default_risk_level,
       dis.is_healthy,
       COUNT(d.id)            AS count
     FROM detections d
     JOIN users u        ON u.id = d.user_id
     LEFT JOIN farmers f  ON f.user_id = u.id
     LEFT JOIN diseases dis ON dis.id = d.disease_id
     ${whereClause}
     GROUP BY barangay, dis.id, dis.class_label, dis.display_name,
              dis.default_risk_level, dis.is_healthy`,
    params
  );

  const byBarangay = new Map<string, BarangayBreakdownRow>();
  const totals = { healthy: 0, diseased: 0, total: 0 };

  for (const row of rows) {
    const key = row.barangay || UNSPECIFIED_BARANGAY;
    let bucket = byBarangay.get(key);
    if (!bucket) {
      bucket = { barangay: key, healthy: 0, diseased: 0, total: 0, diseases: [] };
      byBarangay.set(key, bucket);
    }

    const count = Number(row.count);
    bucket.total += count;
    totals.total += count;

    // A NULL disease (is_healthy null) counts as diseased, exactly as
    // getStatistics() derives diseasedScans = totalScans - healthyScans.
    if (row.is_healthy === 1) {
      bucket.healthy += count;
      totals.healthy += count;
    } else {
      bucket.diseased += count;
      totals.diseased += count;
      if (row.class_label) {
        bucket.diseases.push({
          classLabel: row.class_label,
          displayName: row.display_name ?? row.class_label,
          riskLevel: row.default_risk_level ?? 'moderate',
          count,
        });
      }
    }
  }

  const barangays = [...byBarangay.values()]
    .map((b) => ({
      ...b,
      diseases: b.diseases.sort((a, c) => c.count - a.count),
    }))
    .sort((a, b) => b.diseased - a.diseased || b.total - a.total || a.barangay.localeCompare(b.barangay));

  return {
    generatedFor: riskLevel ?? 'all',
    totals,
    barangays,
  };
}
