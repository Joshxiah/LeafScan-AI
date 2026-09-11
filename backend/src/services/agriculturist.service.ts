/**
 * Agriculturist directory for the CAO admin platform.
 *
 * These are NOT login accounts - just reference records the City
 * Agriculture Office manages from the admin platform. When a report
 * reaches an "agriculturist" stage the CAO picks one of these to
 * send to the farmer's area; the report stores both a foreign key
 * to the row (reports.assigned_agriculturist_id) and a copy of the
 * name as free text, so history survives an edit or delete here.
 *
 * Mirrors farmer.service.ts, minus the users/farmers join - an
 * agriculturist is a single self-contained row.
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CreateAgriculturistInput, UpdateAgriculturistInput } from '../utils/validation';

export type AgriculturistAccountStatus = 'active' | 'inactive';

export interface AgriculturistSummary {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  barangay: string | null;
  municipality: string | null;
  specialization: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface AgriculturistRow extends RowDataPacket {
  id: number;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  barangay: string | null;
  municipality: string | null;
  specialization: string | null;
  is_active: number;
  created_at: Date;
}

function toSummary(row: AgriculturistRow): AgriculturistSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    email: row.email,
    barangay: row.barangay,
    municipality: row.municipality,
    specialization: row.specialization,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

const SELECT_AGRICULTURIST = `
  SELECT id, full_name, phone_number, email, barangay, municipality,
         specialization, is_active, created_at
  FROM agriculturists
`;

export interface ListAgriculturistsOptions {
  status?: AgriculturistAccountStatus;
  search?: string;
  barangay?: string;
  page: number;
  pageSize: number;
}

export interface ListAgriculturistsResult {
  agriculturists: AgriculturistSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** CAO admin only. Alphabetical by name, optionally filtered/searched. */
export async function listAgriculturists(
  options: ListAgriculturistsOptions
): Promise<ListAgriculturistsResult> {
  const { status, search, barangay, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (status) {
    conditions.push('is_active = ?');
    params.push(status === 'active' ? 1 : 0);
  }
  if (barangay) {
    conditions.push('barangay = ?');
    params.push(barangay);
  }
  if (search) {
    conditions.push('(full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<AgriculturistRow[]>(
    `${SELECT_AGRICULTURIST} ${whereClause}
     ORDER BY full_name ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM agriculturists ${whereClause}`,
    params
  );

  return {
    agriculturists: rows.map(toSummary),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

/** CAO admin only. One agriculturist's detail. */
export async function getAgriculturistById(id: number): Promise<AgriculturistSummary> {
  const [rows] = await pool.query<AgriculturistRow[]>(
    `${SELECT_AGRICULTURIST} WHERE id = ? LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) {
    throw ApiError.notFound('Agriculturist not found');
  }
  return toSummary(row);
}

/** CAO admin only. Adds a directory entry. */
export async function createAgriculturist(
  input: CreateAgriculturistInput
): Promise<AgriculturistSummary> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO agriculturists
       (full_name, phone_number, email, barangay, municipality, specialization)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.fullName,
      input.phoneNumber || null,
      input.email || null,
      input.barangay || null,
      input.municipality || 'Pagadian City',
      input.specialization || null,
    ]
  );

  return getAgriculturistById(result.insertId);
}

/** CAO admin only. Edit details or activate / deactivate. */
export async function updateAgriculturist(
  id: number,
  input: UpdateAgriculturistInput
): Promise<AgriculturistSummary> {
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM agriculturists WHERE id = ? LIMIT 1',
    [id]
  );
  if (existing.length === 0) {
    throw ApiError.notFound('Agriculturist not found');
  }

  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (input.fullName !== undefined) {
    sets.push('full_name = ?');
    params.push(input.fullName);
  }
  if (input.phoneNumber !== undefined) {
    sets.push('phone_number = ?');
    params.push(input.phoneNumber || null);
  }
  if (input.email !== undefined) {
    sets.push('email = ?');
    params.push(input.email || null);
  }
  if (input.barangay !== undefined) {
    sets.push('barangay = ?');
    params.push(input.barangay || null);
  }
  if (input.municipality !== undefined) {
    sets.push('municipality = ?');
    params.push(input.municipality || null);
  }
  if (input.specialization !== undefined) {
    sets.push('specialization = ?');
    params.push(input.specialization || null);
  }
  if (input.isActive !== undefined) {
    sets.push('is_active = ?');
    params.push(input.isActive ? 1 : 0);
  }

  if (sets.length > 0) {
    await pool.query(
      `UPDATE agriculturists SET ${sets.join(', ')} WHERE id = ?`,
      [...params, id]
    );
  }

  return getAgriculturistById(id);
}

/**
 * CAO admin only. Removes a directory entry outright. Reports that
 * already referenced it keep the name (fk is ON DELETE SET NULL and
 * reports.assigned_agriculturist holds a copy of the name).
 */
export async function deleteAgriculturist(id: number): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM agriculturists WHERE id = ?',
    [id]
  );
  if (result.affectedRows === 0) {
    throw ApiError.notFound('Agriculturist not found');
  }
}
