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
import { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';
import {
  normalizePhone,
  CreateFarmerInput,
  UpdateFarmerInput,
  FarmPlotInput,
} from '../utils/validation';

export type FarmerAccountStatus = 'active' | 'inactive';

export type AreaUnit = 'hectare' | 'sqm';

/** One plot the farmer works, as stored - plus the area normalised to hectares. */
export interface FarmPlot {
  id: number;
  purok: string | null;
  areaValue: number;
  areaUnit: AreaUnit;
  areaHectares: number;
  note: string | null;
}

interface FarmPlotRow extends RowDataPacket {
  id: number;
  farmer_user_id: number;
  purok: string | null;
  area_value: string | number;
  area_unit: AreaUnit;
  area_hectares: string | number;
  note: string | null;
}

/** How many hectares a stated area works out to. 1 ha = 10,000 m². */
export function toAreaHectares(value: number, unit: AreaUnit): number {
  return unit === 'sqm' ? value / 10_000 : value;
}

/**
 * Plots for a set of farmers, keyed by users.id. One query for the
 * whole page rather than one per row.
 */
async function fetchPlotsFor(userIds: number[]): Promise<Map<number, FarmPlot[]>> {
  const byUser = new Map<number, FarmPlot[]>();
  if (userIds.length === 0) {
    return byUser;
  }

  const [rows] = await pool.query<FarmPlotRow[]>(
    `SELECT id, farmer_user_id, purok, area_value, area_unit, area_hectares, note
     FROM farm_plots
     WHERE farmer_user_id IN (?)
     ORDER BY (purok IS NULL), purok, id`,
    [userIds]
  );

  for (const row of rows) {
    const plot: FarmPlot = {
      id: row.id,
      purok: row.purok,
      areaValue: Number(row.area_value),
      areaUnit: row.area_unit,
      areaHectares: Number(row.area_hectares),
      note: row.note,
    };
    const list = byUser.get(row.farmer_user_id);
    if (list) list.push(plot);
    else byUser.set(row.farmer_user_id, [plot]);
  }

  return byUser;
}

/**
 * Replaces a farmer's whole set of plots and refreshes the
 * denormalised farmers.farm_size_hectares cache (= Σ area_hectares,
 * or NULL when there are no plots). Runs on the caller's connection
 * so it is part of their transaction.
 */
async function writeFarmerPlots(
  connection: PoolConnection,
  userId: number,
  plots: FarmPlotInput[]
): Promise<void> {
  await connection.query('DELETE FROM farm_plots WHERE farmer_user_id = ?', [userId]);

  let totalHectares = 0;
  if (plots.length > 0) {
    const values = plots.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const params = plots.flatMap((plot) => {
      const areaHectares = toAreaHectares(plot.areaValue, plot.areaUnit);
      totalHectares += areaHectares;
      return [
        userId,
        plot.purok?.trim() ? plot.purok.trim() : null,
        plot.areaValue,
        plot.areaUnit,
        areaHectares,
        plot.note?.trim() ? plot.note.trim() : null,
      ];
    });
    await connection.query(
      `INSERT INTO farm_plots
         (farmer_user_id, purok, area_value, area_unit, area_hectares, note)
       VALUES ${values}`,
      params
    );
  }

  await connection.query('UPDATE farmers SET farm_size_hectares = ? WHERE user_id = ?', [
    plots.length > 0 ? Number(totalHectares.toFixed(2)) : null,
    userId,
  ]);
}

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
  /** The farmer's plots by purok. Empty for an account with none recorded. */
  plots: FarmPlot[];
  /** Σ of the plots' normalised hectares (falls back to farmSizeHectares). */
  totalAreaHectares: number;
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

function toSummary(row: FarmerRow, plots: FarmPlot[] = []): FarmerSummary {
  const farmSizeHectares =
    row.farm_size_hectares === null ? null : Number(row.farm_size_hectares);
  const totalAreaHectares =
    plots.length > 0
      ? plots.reduce((sum, plot) => sum + plot.areaHectares, 0)
      : (farmSizeHectares ?? 0);

  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    phoneNumber: row.phone_number,
    avatarPath: row.avatar_path,
    barangay: row.barangay,
    municipality: row.municipality,
    farmSizeHectares,
    plots,
    totalAreaHectares: Number(totalAreaHectares.toFixed(4)),
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

  const plotsByUser = await fetchPlotsFor(rows.map((row) => row.id));

  return {
    farmers: rows.map((row) => toSummary(row, plotsByUser.get(row.id) ?? [])),
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
  const plotsByUser = await fetchPlotsFor([row.id]);
  return toSummary(row, plotsByUser.get(row.id) ?? []);
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

      // Plots, when given, own farm_size_hectares from here on.
      if (input.plots !== undefined) {
        await writeFarmerPlots(connection, newUserId, input.plots);
      }

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

      // Plots replace the whole set and re-own farm_size_hectares, so
      // this runs last - after any explicit farmSizeHectares above.
      if (input.plots !== undefined) {
        await writeFarmerPlots(connection, id, input.plots);
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
