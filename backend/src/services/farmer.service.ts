/**
 * Farmer account listing for the CAO admin platform.
 *
 * A "farmer" here is a row in `users` with role = 'farmer', left
 * joined to its `farmers` profile row (address, corn type, etc.).
 * The join is LEFT, not INNER, because a brand new account can
 * exist in `users` for a moment before its `farmers` row is
 * written - see auth.service.ts#registerFarmer's transaction.
 */

import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';

export type FarmerAccountStatus = 'active' | 'inactive';

export interface FarmerSummary {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  avatarPath: string | null;
  address: string | null;
  municipality: string | null;
  cornType: 'white' | 'yellow' | 'both' | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
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
  address: string | null;
  municipality: string | null;
  corn_type: 'white' | 'yellow' | 'both' | null;
  farm_size_hectares: number | null;
  years_farming: number | null;
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
    address: row.address,
    municipality: row.municipality,
    cornType: row.corn_type,
    farmSizeHectares: row.farm_size_hectares === null ? null : Number(row.farm_size_hectares),
    yearsFarming: row.years_farming,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

const SELECT_FARMER = `
  SELECT
    u.id, u.full_name, u.username, u.email, u.phone_number, u.avatar_path,
    u.is_active, u.created_at,
    f.address, f.municipality, f.corn_type, f.farm_size_hectares, f.years_farming
  FROM users u
  LEFT JOIN farmers f ON f.user_id = u.id
  WHERE u.role = 'farmer'
`;

export interface ListFarmersOptions {
  status?: FarmerAccountStatus;
  page: number;
  pageSize: number;
}

export interface ListFarmersResult {
  farmers: FarmerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** CAO admin only. Newest account first, optionally filtered to active/inactive. */
export async function listFarmers(options: ListFarmersOptions): Promise<ListFarmersResult> {
  const { status, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const statusClause = status ? 'AND u.is_active = ?' : '';
  const params = status ? [status === 'active' ? 1 : 0] : [];

  const [rows] = await pool.query<FarmerRow[]>(
    `${SELECT_FARMER} ${statusClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users u WHERE u.role = 'farmer' ${statusClause}`,
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
