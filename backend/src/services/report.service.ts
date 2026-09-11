/**
 * Outbreak reports from farmers to the CAO.
 *
 * A report is a farmer's own snapshot of their recent scans - the
 * same numbers the mobile app's Report screen shows them - plus an
 * estimated affected area, free-text remarks, and the farmer's own
 * scan photos. The CAO reviews these from the admin platform's
 * Reports page and walks each one through a field-assessment
 * lifecycle, with the farmer notified at every step.
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CreateReportInput } from '../utils/validation';
import * as notificationService from './notification.service';

export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'agriculturist_required'
  | 'agriculturist_assigned'
  | 'field_assessment_completed'
  | 'resolved';

/** Statuses an admin is allowed to set (everything except the initial 'pending'). */
export type AdminSettableStatus = Exclude<ReportStatus, 'pending'>;

/** Human-readable label per status, shared with the farmer's notification text. */
export const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Submitted',
  under_review: 'Under Review',
  verified: 'Verified',
  agriculturist_required: 'Agriculturist Visit Required',
  agriculturist_assigned: 'Agriculturist Assigned',
  field_assessment_completed: 'Field Assessment Completed',
  resolved: 'Resolved',
};

export interface DiseaseBreakdownItem {
  classLabel: string;
  displayName: string;
  count: number;
}

export interface ReportImage {
  id: number;
  classLabel: string | null;
  displayName: string | null;
  imagePath: string;
  confidenceScore: number | null;
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | null;
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
  isRead: boolean;
  imageCount: number;
  createdAt: Date;
}

export interface ReportDetail extends ReportSummary {
  diseaseBreakdown: DiseaseBreakdownItem[];
  images: ReportImage[];
  remarks: string | null;
  caoMessage: string | null;
  assignedAgriculturistId: number | null;
  assignedAgriculturist: string | null;
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
  is_read: number;
  cao_message: string | null;
  assigned_agriculturist_id: number | null;
  assigned_agriculturist: string | null;
  reviewed_by_name: string | null;
  reviewed_at: Date | null;
  image_count: number;
  created_at: Date;
}

interface ReportImageRow extends RowDataPacket {
  id: number;
  report_id: number;
  class_label: string | null;
  display_name: string | null;
  image_path: string;
  confidence_score: number | null;
  risk_level: 'none' | 'low' | 'moderate' | 'high' | null;
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
    isRead: row.is_read === 1,
    imageCount: Number(row.image_count ?? 0),
    createdAt: row.created_at,
  };
}

function toImage(row: ReportImageRow): ReportImage {
  return {
    id: row.id,
    classLabel: row.class_label,
    displayName: row.display_name,
    imagePath: row.image_path,
    confidenceScore: row.confidence_score === null ? null : Number(row.confidence_score),
    riskLevel: row.risk_level,
  };
}

function toDetail(row: ReportRow, images: ReportImageRow[]): ReportDetail {
  return {
    ...toSummary(row),
    diseaseBreakdown: row.disease_breakdown ? JSON.parse(row.disease_breakdown) : [],
    images: images.map(toImage),
    remarks: row.remarks,
    caoMessage: row.cao_message,
    assignedAgriculturistId:
      row.assigned_agriculturist_id === null ? null : Number(row.assigned_agriculturist_id),
    assignedAgriculturist: row.assigned_agriculturist,
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
    r.status, r.is_read, r.cao_message,
    r.assigned_agriculturist_id,
    COALESCE(ag.full_name, r.assigned_agriculturist) AS assigned_agriculturist,
    reviewer.full_name AS reviewed_by_name,
    r.reviewed_at, r.created_at,
    (SELECT COUNT(*) FROM report_images ri WHERE ri.report_id = r.id) AS image_count
  FROM reports r
  JOIN users u ON u.id = r.farmer_id
  LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
  LEFT JOIN agriculturists ag ON ag.id = r.assigned_agriculturist_id
`;

/**
 * A farmer submits a report. Written by POST /api/reports, always
 * on behalf of the authenticated farmer - farmer_id is never taken
 * from the request body. Also files the farmer's scan photos and
 * notifies every active admin.
 */
export async function createReport(
  farmerId: number,
  input: CreateReportInput
): Promise<{ id: number }> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
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

    const reportId = result.insertId;

    if (input.images && input.images.length > 0) {
      const values = input.images.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const params = input.images.flatMap((img) => [
        reportId,
        img.imagePath,
        img.classLabel || null,
        img.displayName || null,
        img.confidenceScore ?? null,
        img.riskLevel ?? null,
      ]);
      await connection.query(
        `INSERT INTO report_images
           (report_id, image_path, class_label, display_name, confidence_score, risk_level)
         VALUES ${values}`,
        params
      );
    }

    await connection.commit();

    // ---- Notify the CAO (outside the transaction) ----
    const [farmerRows] = await pool.query<RowDataPacket[]>(
      `SELECT full_name FROM users WHERE id = ? LIMIT 1`,
      [farmerId]
    );
    const farmerName = (farmerRows[0]?.full_name as string) ?? 'A farmer';
    const barangay = input.barangay || 'an unspecified barangay';
    const topDisease =
      input.diseaseBreakdown && input.diseaseBreakdown.length > 0
        ? input.diseaseBreakdown
            .slice()
            .sort((a, b) => b.count - a.count)[0].displayName
        : input.affectedScans > 0
          ? 'affected corn leaves'
          : 'a routine check';

    const adminIds = await notificationService.getAdminUserIds();
    await notificationService.createForUsers(adminIds, {
      type: 'report_submitted',
      title: `New report from ${farmerName}`,
      body: `${barangay} - ${topDisease} - ${input.affectedScans} of ${input.totalScans} scans affected`,
      reportId,
    });

    return { id: reportId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export interface ListReportsOptions {
  status?: ReportStatus;
  barangay?: string;
  page: number;
  pageSize: number;
}

export interface ListReportsResult {
  reports: ReportSummary[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

/** CAO admin only. Newest first, optionally filtered by status and/or barangay. */
export async function listReports(options: ListReportsOptions): Promise<ListReportsResult> {
  const { status, barangay, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }
  if (barangay) {
    conditions.push('r.barangay = ?');
    params.push(barangay);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<ReportRow[]>(
    `${SELECT_REPORT} ${whereClause}
     ORDER BY r.is_read ASC, r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
     FROM reports r ${whereClause}`,
    params
  );

  return {
    reports: rows.map(toSummary),
    total: Number(countRows[0].total),
    unreadCount: Number(countRows[0].unread ?? 0),
    page,
    pageSize,
  };
}

/** Distinct barangays that have at least one report - for the filter dropdown. */
export async function listReportBarangays(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT barangay FROM reports
     WHERE barangay IS NOT NULL AND barangay <> ''
     ORDER BY barangay ASC`
  );
  return rows.map((r) => String(r.barangay));
}

/** Total unread reports - the Reports nav badge. */
export async function countUnreadReports(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS unread FROM reports WHERE is_read = 0`
  );
  return Number(rows[0].unread ?? 0);
}

/** CAO admin only. Full detail, including the breakdown snapshot, remarks and photos. */
export async function getReportById(id: number): Promise<ReportDetail> {
  const [rows] = await pool.query<ReportRow[]>(`${SELECT_REPORT} WHERE r.id = ? LIMIT 1`, [id]);
  const row = rows[0];
  if (!row) {
    throw ApiError.notFound('Report not found');
  }

  const [imageRows] = await pool.query<ReportImageRow[]>(
    `SELECT id, report_id, class_label, display_name, image_path, confidence_score, risk_level
     FROM report_images WHERE report_id = ? ORDER BY id ASC`,
    [id]
  );

  return toDetail(row, imageRows);
}

/**
 * Marks a report read the first time the CAO opens it (Messenger
 * style). Idempotent - opening it again is a no-op.
 */
export async function markReportRead(id: number, adminId: number): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE reports
     SET is_read = 1, read_at = NOW(), read_by = ?
     WHERE id = ? AND is_read = 0`,
    [adminId, id]
  );

  if (result.affectedRows === 0) {
    // Either already read, or the id does not exist.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM reports WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) throw ApiError.notFound('Report not found');
  }

  // Opening the report counts as seeing its bell notification(s) too.
  await notificationService.markReadByReport(adminId, id);
}

/**
 * Moves a report along its lifecycle, records the CAO's optional
 * message, and notifies the farmer. `reviewed_by`/`reviewed_at`
 * track who last acted and when.
 */
export async function updateReportStatus(
  id: number,
  status: AdminSettableStatus,
  reviewerId: number,
  message?: string,
  agriculturistId?: number | null,
  agriculturist?: string
): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.farmer_id, r.assigned_agriculturist, u.full_name AS farmer_name
     FROM reports r JOIN users u ON u.id = r.farmer_id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  const report = rows[0];
  if (!report) {
    throw ApiError.notFound('Report not found');
  }

  // Does this update touch the assigned agriculturist, and if so with
  // what id + name? `agriculturistId` is the modern path (a pick from
  // the CAO directory): a number assigns, `null` clears, `undefined`
  // leaves it. `agriculturist` is a legacy free-text name kept for
  // older callers and only consulted when no id was sent.
  let touchAgriculturist = false;
  let agriculturistIdValue: number | null = null;
  let agriculturistNameValue: string | null = null;

  if (agriculturistId !== undefined) {
    touchAgriculturist = true;
    if (agriculturistId !== null) {
      const [agRows] = await pool.query<RowDataPacket[]>(
        `SELECT full_name FROM agriculturists WHERE id = ? LIMIT 1`,
        [agriculturistId]
      );
      if (agRows.length === 0) {
        throw ApiError.badRequest(
          'That agriculturist no longer exists',
          'AGRICULTURIST_NOT_FOUND'
        );
      }
      agriculturistIdValue = agriculturistId;
      agriculturistNameValue = agRows[0].full_name as string;
    }
  } else if (agriculturist !== undefined) {
    touchAgriculturist = true;
    agriculturistNameValue = agriculturist.trim() ? agriculturist.trim() : null;
  }

  const effectiveAgriculturist = touchAgriculturist
    ? agriculturistNameValue
    : ((report.assigned_agriculturist as string | null) ?? null);

  const sets: string[] = ['status = ?', 'cao_message = ?'];
  const params: (string | number | null)[] = [status, message || null];
  if (touchAgriculturist) {
    sets.push('assigned_agriculturist_id = ?', 'assigned_agriculturist = ?');
    params.push(agriculturistIdValue, agriculturistNameValue);
  }
  sets.push(
    'reviewed_by = ?',
    'reviewed_at = NOW()',
    'is_read = 1',
    'read_at = COALESCE(read_at, NOW())',
    'read_by = COALESCE(read_by, ?)'
  );
  params.push(reviewerId, reviewerId, id);

  await pool.query<ResultSetHeader>(
    `UPDATE reports SET ${sets.join(', ')} WHERE id = ?`,
    params
  );

  // The acting CAO has plainly seen this report - clear their bell
  // notification(s) for it so the inbox matches the report list.
  await notificationService.markReadByReport(reviewerId, id);

  // ---- Notify the farmer ----
  const label = STATUS_LABEL[status];
  const withName = (base: string): string =>
    effectiveAgriculturist ? `${base} Agriculturist: ${effectiveAgriculturist}.` : base;

  const bodyByStatus: Record<AdminSettableStatus, string> = {
    under_review: 'The City Agriculture Office is now reviewing your report.',
    verified: 'The CAO has verified the disease findings in your report.',
    agriculturist_required: withName(
      'Your report requires an agriculturist field assessment. A visit is being arranged.'
    ),
    agriculturist_assigned: withName(
      'An agriculturist has been assigned to visit and assess your area.'
    ),
    field_assessment_completed:
      'The field assessment for your report has been completed.',
    resolved: 'Your report has been resolved. Thank you for reporting.',
  };

  await notificationService.createForUsers([Number(report.farmer_id)], {
    type: 'report_status',
    title: `Report ${label}`,
    body: message?.trim() ? message.trim() : bodyByStatus[status],
    reportId: id,
  });
}

/** Small counts for the dashboard - how many reports need attention. */
export async function countReportsByStatus(): Promise<Record<ReportStatus, number>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS total FROM reports GROUP BY status`
  );

  const counts: Record<ReportStatus, number> = {
    pending: 0,
    under_review: 0,
    verified: 0,
    agriculturist_required: 0,
    agriculturist_assigned: 0,
    field_assessment_completed: 0,
    resolved: 0,
  };
  for (const row of rows) {
    counts[row.status as ReportStatus] = Number(row.total);
  }
  return counts;
}
