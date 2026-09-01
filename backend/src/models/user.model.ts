/**
 * TypeScript shapes for user data in LeafScan AI.
 *
 * A "model" here is a description of what a row looks like, so
 * TypeScript can catch mistakes like reading user.name when the
 * column is actually user.full_name.
 *
 * These MUST match the columns created in database/leafscan_ai_schema.sql
 */

import { RowDataPacket } from 'mysql2';

/** The two kinds of account in the system. */
export type UserRole = 'farmer' | 'admin';

/**
 * A complete row from the users table, INCLUDING the password hash.
 * Only used inside services. Never sent to a client.
 */
export interface UserRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  password_hash: string;
  role: UserRole;
  is_active: number; // MySQL TINYINT(1) arrives as 0 or 1
  created_at: Date;
  updated_at: Date;
}

/**
 * A row from the farmers table.
 */
export interface FarmerRow extends RowDataPacket {
  id: number;
  user_id: number;
  barangay: string | null;
  municipality: string | null;
  corn_type: 'white' | 'yellow' | 'both' | null;
  farm_size_hectares: number | null;
  years_farming: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * A user as sent to the mobile app or admin site.
 *
 * Note what is MISSING: password_hash. Building a separate
 * "safe" shape means the hash can never be leaked by accident,
 * because the type system will not allow it.
 */
export interface PublicUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

/** Farming details attached to a farmer's profile. */
export interface PublicFarmerProfile {
  barangay: string | null;
  municipality: string | null;
  cornType: 'white' | 'yellow' | 'both' | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
}

/** A user plus their farming details, when the user is a farmer. */
export interface PublicUserWithProfile extends PublicUser {
  farmerProfile: PublicFarmerProfile | null;
}

/**
 * Converts a raw database row into the safe public shape.
 *
 * Database columns use snake_case (full_name), while JavaScript
 * and JSON conventionally use camelCase (fullName). This function
 * is the single place that translation happens.
 */
export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number,
    role: row.role,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

/**
 * Converts a raw farmers row into the safe public shape.
 */
export function toPublicFarmerProfile(row: FarmerRow): PublicFarmerProfile {
  return {
    barangay: row.barangay,
    municipality: row.municipality,
    cornType: row.corn_type,
    farmSizeHectares: row.farm_size_hectares,
    yearsFarming: row.years_farming,
  };
}