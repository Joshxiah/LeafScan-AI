/**
 * Outbreak reports from farmers to the CAO.
 *
 * A report is a farmer's own snapshot of their recent scans - the
 * same numbers the mobile app's Report screen shows them - plus an
 * estimated affected area and free-text remarks. The CAO reviews
 * these from the admin platform's Reports page.
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CreateReportInput } from '../utils/validation';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface DiseaseBreakdownItem {
  classLabel: string;
  displayName: string;
  count: number;
}

export interface ReportSummary {
  id: number;
  farmerId: number;
  farmerName: string;
  farmerPhone: string | null;
  barangay: string | null;
  municipality: string | null;
  totalScans: number;
  affectedScans: number;
  healthyScans: number;
  estimatedAreaHectares: number | null;
  status: ReportStatus;
  createdAt: Date;
}

export interface ReportDetail extends ReportSummary {
  diseaseBreakdown: DiseaseBreakdownItem[];
  remarks: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
}

interface ReportRow extends RowDataPacket {
  id: number;
  farmer_id: number;
  farmer_name: string;
  farmer_phone: string | null;
  barangay: string | null;
  municipality: string | null;
  total_scans: number;
  affected_scans: number;
  healthy_scans: number;
  disease_breakdown: string | null;
  estimated_area_hectares: number | null;
  remarks: string | null;
  status: ReportStatus;
  reviewed_by_name: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

function toSummary(row: ReportRow): ReportSummary {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    farmerPhone: row.farmer_phone,
    barangay: row.barangay,
    municipality: row.municipality,
    totalScans: row.total_scans,
    affectedScans: row.affected_scans,
    healthyScans: row.healthy_scans,
    estimatedAreaHectares:
      row.estimated_area_hectares === null ? null : Number(row.estimated_area_hectares),
    status: row.status,
    createdAt: row.created_at,
  };
}

function toDetail(row: ReportRow): ReportDetail {
  return {
    ...toSummary(row),
    diseaseBreakdown: row.disease_breakdown ? JSON.parse(row.disease_breakdown) : [],
    remarks: row.remarks,
    reviewedByName: row.reviewed_by_name,
    reviewedAt: row.reviewed_at,
  };
}

const SELECT_REPORT = `
  SELECT
    r.id, r.farmer_id,
    u.full_name        AS farmer_name,
    u.phone_number     AS farmer_phone,
    r.barangay, r.municipality,
    r.total_scans, r.affected_scans, r.healthy_scans,
    r.disease_breakdown, r.estimated_area_hectares, r.remarks,
    r.status,
    reviewer.full_name AS reviewed_by_name,
    r.reviewed_at, r.created_at
  FROM reports r
  JOIN users u ON u.id = r.farmer_id
  LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
`;

/**
 * A farmer submits a report. Written by POST /api/reports, always
 * on behalf of the authenticated farmer - farmer_id is never taken
 * from the request body, so one farmer can never file a report as
 * another.
 */
export async function createReport(
  farmerId: number,
  input: CreateReportInput
): Promise<{ id: number }> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO reports
       (farmer_id, barangay, municipality, total_scans, affected_scans,
        healthy_scans, disease_breakdown, estimated_area_hectares, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      farmerId,
      input.barangay || null,
      input.municipality || null,
      input.totalScans,
      input.affectedScans,
      input.healthyScans,
      input.diseaseBreakdown ? JSON.stringify(input.diseaseBreakdown) : null,
      input.estimatedAreaHectares ?? null,
      input.remarks || null,
    ]
  );

  return { id: result.insertId };
}

export interface ListReportsOptions {
  status?: ReportStatus;
  page: number;
  pageSize: number;
}

export interface ListReportsResult {
  reports: ReportSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** CAO admin only. Newest first, optionally filtered to one status. */
export async function listReports(options: ListReportsOptions): Promise<ListReportsResult> {
  const { status, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const whereClause = status ? 'WHERE r.status = ?' : '';
  const params = status ? [status] : [];

  const [rows] = await pool.query<ReportRow[]>(
    `${SELECT_REPORT} ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM reports r ${whereClause}`,
    params
  );

  return {
    reports: rows.map(toSummary),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

/** CAO admin only. Full detail, including the breakdown snapshot and remarks. */
export async function getReportById(id: number): Promise<ReportDetail> {
  const [rows] = await pool.query<ReportRow[]>(`${SELECT_REPORT} WHERE r.id = ? LIMIT 1`, [id]);

  const row = rows[0];

  if (!row) {
    throw ApiError.notFound('Report not found');
  }

  return toDetail(row);
}

/**
 * Moves a report from pending -> reviewed -> resolved (or straight
 * to resolved). Records who made the call and when.
 */
export async function updateReportStatus(
  id: number,
  status: 'reviewed' | 'resolved',
  reviewerId: number
): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE reports
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, reviewerId, id]
  );

  if (result.affectedRows === 0) {
    throw ApiError.notFound('Report not found');
  }
}

/** Small counts for the dashboard - how many reports need attention. */
export async function countReportsByStatus(): Promise<Record<ReportStatus, number>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS total FROM reports GROUP BY status`
  );

  const counts: Record<ReportStatus, number> = { pending: 0, reviewed: 0, resolved: 0 };
  for (const row of rows) {
    counts[row.status as ReportStatus] = Number(row.total);
  }
  return counts;
}
