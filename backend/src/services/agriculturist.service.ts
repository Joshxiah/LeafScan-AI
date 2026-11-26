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
 * agriculturist is one row plus the list of barangays they cover
 * (agriculturist_barangays), since one person can handle several.
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CreateAgriculturistInput, UpdateAgriculturistInput } from '../utils/validation';

export type AgriculturistAccountStatus = 'active' | 'inactive';

export interface AgriculturistSummary {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  avatarPath: string | null;
  /**
   * Every barangay this agriculturist handles (their service area),
   * alphabetical. Empty when none is set. Lives in the
   * agriculturist_barangays table - see database/add_agriculturist_barangays.sql.
   */
  barangays: string[];
  municipality: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface AgriculturistRow extends RowDataPacket {
  id: number;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  avatar_path: string | null;
  municipality: string | null;
  is_active: number;
  created_at: Date;
}

function toSummary(row: AgriculturistRow, barangays: string[]): AgriculturistSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    email: row.email,
    avatarPath: row.avatar_path,
    barangays,
    municipality: row.municipality,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

const SELECT_AGRICULTURIST = `
  SELECT id, full_name, phone_number, email, avatar_path, municipality,
         is_active, created_at
  FROM agriculturists
`;

/**
 * The barangays for a batch of agriculturists in ONE query, keyed by
 * agriculturist id (an id with none set is simply absent from the map).
 */
async function loadBarangays(ids: number[]): Promise<Map<number, string[]>> {
  const byAgriculturist = new Map<number, string[]>();
  if (ids.length === 0) return byAgriculturist;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT agriculturist_id, barangay
     FROM agriculturist_barangays
     WHERE agriculturist_id IN (?)
     ORDER BY barangay ASC`,
    [ids]
  );
  for (const row of rows) {
    const id = Number(row.agriculturist_id);
    const list = byAgriculturist.get(id);
    if (list) list.push(row.barangay as string);
    else byAgriculturist.set(id, [row.barangay as string]);
  }
  return byAgriculturist;
}

/** Trims, drops blanks and removes repeats, keeping the first occurrence. */
function uniqueBarangays(barangays: string[]): string[] {
  const seen = new Set<string>();
  for (const barangay of barangays) {
    const trimmed = barangay.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen];
}

/** Replaces an agriculturist's whole set of barangays (inside the caller's transaction). */
async function replaceBarangays(
  connection: PoolConnection,
  agriculturistId: number,
  barangays: string[]
): Promise<void> {
  await connection.query('DELETE FROM agriculturist_barangays WHERE agriculturist_id = ?', [
    agriculturistId,
  ]);

  const unique = uniqueBarangays(barangays);
  if (unique.length === 0) return;

  await connection.query(
    'INSERT INTO agriculturist_barangays (agriculturist_id, barangay) VALUES ?',
    [unique.map((barangay) => [agriculturistId, barangay])]
  );
}

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
    // Anyone who covers this barangay, even if they cover others too.
    conditions.push(
      `EXISTS (SELECT 1 FROM agriculturist_barangays ab
               WHERE ab.agriculturist_id = agriculturists.id AND ab.barangay = ?)`
    );
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

  const barangaysById = await loadBarangays(rows.map((row) => row.id));

  return {
    agriculturists: rows.map((row) => toSummary(row, barangaysById.get(row.id) ?? [])),
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
  const barangaysById = await loadBarangays([row.id]);
  return toSummary(row, barangaysById.get(row.id) ?? []);
}

/** CAO admin only. Adds a directory entry. */
export async function createAgriculturist(
  input: CreateAgriculturistInput
): Promise<AgriculturistSummary> {
  const connection = await pool.getConnection();
  let insertId: number;
  try {
    await connection.beginTransaction();
    try {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO agriculturists
           (full_name, phone_number, email, avatar_path, municipality)
         VALUES (?, ?, ?, ?, ?)`,
        [
          input.fullName,
          input.phoneNumber || null,
          input.email || null,
          input.avatarPath || null,
          input.municipality || 'Pagadian City',
        ]
      );
      insertId = result.insertId;

      if (input.barangays) {
        await replaceBarangays(connection, insertId, input.barangays);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }

  return getAgriculturistById(insertId);
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
  if (input.avatarPath !== undefined) {
    sets.push('avatar_path = ?');
    params.push(input.avatarPath || null);
  }
  if (input.municipality !== undefined) {
    sets.push('municipality = ?');
    params.push(input.municipality || null);
  }
  if (input.isActive !== undefined) {
    sets.push('is_active = ?');
    params.push(input.isActive ? 1 : 0);
  }

  if (sets.length > 0 || input.barangays !== undefined) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      try {
        if (sets.length > 0) {
          await connection.query(
            `UPDATE agriculturists SET ${sets.join(', ')} WHERE id = ?`,
            [...params, id]
          );
        }
        if (input.barangays !== undefined) {
          await replaceBarangays(connection, id, input.barangays);
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      connection.release();
    }
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
