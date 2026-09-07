/**
 * Farmer account management for the CAO admin platform.
 *
 * Farmers no longer self-register. The City Agriculture Office
 * creates accounts here and hands the farmer their credentials;
 * this module owns that create/list/update flow.
 *
 * A "farmer" is a row in `users` with role = 'farmer', left joined
 * to its `farmers` profile row (barangay, farm size...). The join is
 * LEFT, not INNER, because a brand new account exists in `users` for
 * a moment before its `farmers` row is written.
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';
import { normalizePhone, CreateFarmerInput, UpdateFarmerInput } from '../utils/validation';

export type FarmerAccountStatus = 'active' | 'inactive';

export interface FarmerSummary {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  avatarPath: string | null;
  barangay: string | null;
  municipality: string | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
  reportCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface FarmerRow extends RowDataPacket {
  id: number;
  full_name: string;
  username: string;
  email: string | null;
  phone_number: string | null;
  avatar_path: string | null;
  barangay: string | null;
  municipality: string | null;
  farm_size_hectares: number | null;
  years_farming: number | null;
  report_count: number;
  is_active: number;
  created_at: Date;
}

function toSummary(row: FarmerRow): FarmerSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    phoneNumber: row.phone_number,
    avatarPath: row.avatar_path,
    barangay: row.barangay,
    municipality: row.municipality,
    farmSizeHectares: row.farm_size_hectares === null ? null : Number(row.farm_size_hectares),
    yearsFarming: row.years_farming,
    reportCount: Number(row.report_count ?? 0),
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

// `address` and `barangay` on the farmers table are kept in sync by
// this module; COALESCE reads whichever a legacy row happens to have.
const SELECT_FARMER = `
  SELECT
    u.id, u.full_name, u.username, u.email, u.phone_number, u.avatar_path,
    u.is_active, u.created_at,
    COALESCE(f.barangay, f.address) AS barangay,
    f.municipality, f.farm_size_hectares, f.years_farming,
    (SELECT COUNT(*) FROM reports r WHERE r.farmer_id = u.id) AS report_count
  FROM users u
  LEFT JOIN farmers f ON f.user_id = u.id
  WHERE u.role = 'farmer'
`;

export interface ListFarmersOptions {
  status?: FarmerAccountStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ListFarmersResult {
  farmers: FarmerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** CAO admin only. Newest account first, optionally filtered/searched. */
export async function listFarmers(options: ListFarmersOptions): Promise<ListFarmersResult> {
  const { status, search, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (status) {
    conditions.push('u.is_active = ?');
    params.push(status === 'active' ? 1 : 0);
  }
  if (search) {
    conditions.push('(u.full_name LIKE ? OR u.username LIKE ? OR u.phone_number LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const extraClause = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<FarmerRow[]>(
    `${SELECT_FARMER} ${extraClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users u WHERE u.role = 'farmer' ${extraClause}`,
    params
  );

  return {
    farmers: rows.map(toSummary),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

/** CAO admin only. One farmer's full account + profile detail. */
export async function getFarmerById(id: number): Promise<FarmerSummary> {
  const [rows] = await pool.query<FarmerRow[]>(`${SELECT_FARMER} AND u.id = ? LIMIT 1`, [id]);
  const row = rows[0];
  if (!row) {
    throw ApiError.notFound('Farmer not found');
  }
  return toSummary(row);
}

/** Six pronounceable-ish characters, no ambiguous 0/O/1/l. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function deriveUsername(fullName: string): Promise<string> {
  const base =
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 40) || 'farmer';

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const padded = candidate.length < 4 ? `${candidate}farm`.slice(0, 8) : candidate;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [padded]
    );
    if (rows.length === 0) return padded;
  }
  return `farmer${Date.now()}`;
}

export interface CreatedFarmer {
  farmer: FarmerSummary;
  /** Plaintext credentials, shown to the CAO once so they can pass them on. */
  credentials: { username: string; password: string };
}

/**
 * The CAO issues a new farmer account. Writes users + farmers in one
 * transaction. Returns the account plus the credentials to hand over
 * (the password is never retrievable again afterwards).
 */
export async function createFarmer(input: CreateFarmerInput): Promise<CreatedFarmer> {
  const username = (input.username ?? (await deriveUsername(input.fullName))).toLowerCase();
  const password = input.password ?? generatePassword();
  const phoneNumber = normalizePhone(input.phoneNumber);

  const connection = await pool.getConnection();
  try {
    const [nameClash] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (nameClash.length > 0) {
      throw ApiError.conflict('That username is already taken', 'USERNAME_TAKEN');
    }

    const [phoneClash] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE phone_number = ? LIMIT 1',
      [phoneNumber]
    );
    if (phoneClash.length > 0) {
      throw ApiError.conflict('That mobile number is already registered', 'PHONE_TAKEN');
    }

    const passwordHash = await hashPassword(password);

    await connection.beginTransaction();
    try {
      const [userResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO users (full_name, username, email, phone_number, password_hash, role, is_active)
         VALUES (?, ?, NULL, ?, ?, 'farmer', 1)`,
        [input.fullName, username, phoneNumber, passwordHash]
      );
      const newUserId = userResult.insertId;

      await connection.query<ResultSetHeader>(
        `INSERT INTO farmers
           (user_id, address, barangay, municipality, farm_size_hectares, years_farming)
         VALUES (?, ?, ?, 'Pagadian City', ?, ?)`,
        [
          newUserId,
          input.barangay || null,
          input.barangay || null,
          input.farmSizeHectares ?? null,
          input.yearsFarming ?? null,
        ]
      );

      await connection.commit();

      const farmer = await getFarmerById(newUserId);
      return { farmer, credentials: { username, password } };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

export interface UpdatedFarmer {
  farmer: FarmerSummary;
  /** Present only when the CAO set a new password on this update. */
  newPassword?: string;
}

/** CAO admin only. Edit details, activate/deactivate, or reset the password. */
export async function updateFarmer(id: number, input: UpdateFarmerInput): Promise<UpdatedFarmer> {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ? AND role = 'farmer' LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      throw ApiError.notFound('Farmer not found');
    }

    await connection.beginTransaction();
    try {
      const userSets: string[] = [];
      const userParams: (string | number | null)[] = [];

      if (input.fullName !== undefined) {
        userSets.push('full_name = ?');
        userParams.push(input.fullName);
      }
      if (input.phoneNumber !== undefined) {
        const phoneNumber = normalizePhone(input.phoneNumber);
        const [clash] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM users WHERE phone_number = ? AND id != ? LIMIT 1',
          [phoneNumber, id]
        );
        if (clash.length > 0) {
          throw ApiError.conflict('That mobile number is already registered', 'PHONE_TAKEN');
        }
        userSets.push('phone_number = ?');
        userParams.push(phoneNumber);
      }
      if (input.isActive !== undefined) {
        userSets.push('is_active = ?');
        userParams.push(input.isActive ? 1 : 0);
      }

      let newPassword: string | undefined;
      if (input.password !== undefined) {
        newPassword = input.password;
        userSets.push('password_hash = ?');
        userParams.push(await hashPassword(input.password));
      }

      if (userSets.length > 0) {
        await connection.query(
          `UPDATE users SET ${userSets.join(', ')} WHERE id = ?`,
          [...userParams, id]
        );
      }

      const farmerSets: string[] = [];
      const farmerParams: (string | number | null)[] = [];
      if (input.barangay !== undefined) {
        farmerSets.push('address = ?', 'barangay = ?');
        farmerParams.push(input.barangay || null, input.barangay || null);
      }
      if (input.farmSizeHectares !== undefined) {
        farmerSets.push('farm_size_hectares = ?');
        farmerParams.push(input.farmSizeHectares);
      }
      if (input.yearsFarming !== undefined) {
        farmerSets.push('years_farming = ?');
        farmerParams.push(input.yearsFarming);
      }
      if (farmerSets.length > 0) {
        // A farmers row always exists for an account createFarmer made,
        // but guard for legacy accounts with UPSERT semantics.
        await connection.query(
          `UPDATE farmers SET ${farmerSets.join(', ')} WHERE user_id = ?`,
          [...farmerParams, id]
        );
      }

      await connection.commit();

      const farmer = await getFarmerById(id);
      return { farmer, newPassword };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}
