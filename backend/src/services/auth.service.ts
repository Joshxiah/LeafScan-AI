/**
 * Authentication business logic for LeafScan AI.
 *
 * This layer talks to the database and applies the rules. It knows
 * nothing about HTTP - no req, no res, no status codes. That
 * separation means the same functions can be called from anywhere.
 */

import { ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../utils/validation';
import {
  UserRow,
  FarmerRow,
  PublicUser,
  PublicUserWithProfile,
  toPublicUser,
  toPublicFarmerProfile,
} from '../models/user.model';

/** What a successful register or login returns. */
export interface AuthResult {
  user: PublicUser;
  token: string;
}

/**
 * Registers a new farmer account.
 *
 * Writes to TWO tables - users and farmers - inside a transaction,
 * so a crash between them cannot leave a user without a profile.
 */
export async function registerFarmer(input: RegisterInput): Promise<AuthResult> {
  const connection = await pool.getConnection();

  try {
    // ---- Is this email already taken? ----
    const [existing] = await connection.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [input.email]
    );

    if (existing.length > 0) {
      throw ApiError.conflict('An account with this email already exists');
    }

    // ---- Hash the password. The plaintext is never stored. ----
    const passwordHash = await hashPassword(input.password);

    // ---- Both inserts succeed together, or neither happens ----
    await connection.beginTransaction();

    try {
      const [userResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO users (full_name, email, phone_number, password_hash, role)
         VALUES (?, ?, ?, ?, 'farmer')`,
        [
          input.fullName,
          input.email,
          input.phoneNumber || null,
          passwordHash,
        ]
      );

      const newUserId = userResult.insertId;

      await connection.query<ResultSetHeader>(
                 `INSERT INTO farmers
           (user_id, address, corn_type, farm_size_hectares, years_farming)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newUserId,
          input.address || null,
        ]
      );

      await connection.commit();

      // ---- Read the finished user back ----
      const [rows] = await connection.query<UserRow[]>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [newUserId]
      );

      const user = toPublicUser(rows[0]);
      const token = generateToken({ userId: user.id, role: user.role });

      return { user, token };
    } catch (error) {
      // Undo everything if any step failed
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

/**
 * Logs a user in. Works for BOTH farmers and CAO admins - the
 * role stored on the account decides what they can access later.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [input.email]
  );

  const user = rows[0];

  // ---- Deliberately vague message. See the note below. ----
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, user.password_hash);

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.is_active !== 1) {
    throw ApiError.forbidden('This account has been deactivated. Please contact the City Agriculture Office.');
  }

  const publicUser = toPublicUser(user);
  const token = generateToken({ userId: publicUser.id, role: publicUser.role });

  return { user: publicUser, token };
}

/**
 * Fetches the logged-in user, including farming details when the
 * account is a farmer. Powers GET /api/auth/me and the Profile screen.
 */
export async function getUserById(userId: number): Promise<PublicUserWithProfile> {
  const [userRows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const userRow = userRows[0];

  if (!userRow) {
    throw ApiError.notFound('User not found');
  }

  const publicUser = toPublicUser(userRow);

  if (publicUser.role !== 'farmer') {
    return { ...publicUser, farmerProfile: null };
  }

  const [farmerRows] = await pool.query<FarmerRow[]>(
    'SELECT * FROM farmers WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const farmerRow = farmerRows[0];

  return {
    ...publicUser,
    farmerProfile: farmerRow ? toPublicFarmerProfile(farmerRow) : null,
  };
}