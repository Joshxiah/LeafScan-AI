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
  totalScans: number;
  healthyScans: number;
  diseasedScans: number;
  highRiskScans: number;
  scansToday: number;
  pendingReports: number;
  totalReports: number;
  diseaseBreakdown: DiseaseCount[];
  scanTrend: ScanTrendPoint[];
  recentDetections: RecentDetection[];
}

export interface DiseaseCount {
  classLabel: string;
  displayName: string;
  count: number;
  riskLevel: 'none' | 'low' | 'moderate' | 'high';
}

/** One day's scan count, for the "scans over time" trend chart. */
export interface ScanTrendPoint {
  date: string;
  count: number;
}

export interface RecentDetection {
  id: number;
  farmerName: string;
  diseaseName: string | null;
  predictedClass: string;
  confidenceScore: number;
  riskLevel: string;
  detectedAt: string;
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
    scanRows,
    healthyRows,
    riskRows,
    todayRows,
    reportRows,
    breakdownRows,
    trendRows,
    recentRows,
  ] = await Promise.all([
    // Total registered farmers
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'farmer'`
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

    // The ten most recent scans
    pool.query<RowDataPacket[]>(
      `SELECT
         d.id,
         u.full_name        AS farmer_name,
         dis.display_name   AS disease_name,
         d.predicted_class,
         d.confidence_score,
         d.risk_level,
         d.detected_at
       FROM detections d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN diseases dis ON dis.id = d.disease_id
       ORDER BY d.detected_at DESC
       LIMIT 10`
    ),
  ]);

  const totalScans = Number(scanRows[0][0].total);
  const healthyScans = Number(healthyRows[0][0].total);

  return {
    totalFarmers: Number(farmerRows[0][0].total),
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

    recentDetections: recentRows[0].map((row) => ({
      id: row.id,
      farmerName: row.farmer_name,
      diseaseName: row.disease_name,
      predictedClass: row.predicted_class,
      confidenceScore: Number(row.confidence_score),
      riskLevel: row.risk_level,
      detectedAt: row.detected_at,
    })),
  };
}
