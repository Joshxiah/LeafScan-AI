/**
 * Authentication business logic for LeafScan AI.
 *
 * This layer talks to the database and applies the rules. It knows
 * nothing about HTTP - no req, no res, no status codes. That
 * separation means the same functions can be called from anywhere.
 *
 * Farmers log in with a USERNAME. Email is optional and is not
 * collected at registration.
 */

import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSms } from '../utils/sms';
import { RegisterInput, LoginInput, UpdateProfileInput, normalizePhone } from '../utils/validation';
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
    // ---- Is this username already taken? ----
    const [existing] = await connection.query<UserRow[]>(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [input.username]
    );

    if (existing.length > 0) {
      throw ApiError.conflict('That username is already taken', 'USERNAME_TAKEN');
    }

    // ---- Is this phone number already in use? ----
    // It doubles as the "Forgot password" lookup key, so two
    // accounts sharing one number would make a reset ambiguous.
    const phoneNumber = normalizePhone(input.phoneNumber);

    const [phoneRows] = await connection.query<UserRow[]>(
      'SELECT id FROM users WHERE phone_number = ? LIMIT 1',
      [phoneNumber]
    );

    if (phoneRows.length > 0) {
      throw ApiError.conflict('That mobile number is already registered', 'PHONE_TAKEN');
    }

    // ---- Hash the password. The plaintext is never stored. ----
    const passwordHash = await hashPassword(input.password);

    // ---- Both inserts succeed together, or neither happens ----
    await connection.beginTransaction();

    try {
      const [userResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO users
           (full_name, username, email, phone_number, password_hash, role)
         VALUES (?, ?, NULL, ?, ?, 'farmer')`,
        [input.fullName, input.username, phoneNumber, passwordHash]
      );

      const newUserId = userResult.insertId;

      await connection.query<ResultSetHeader>(
        `INSERT INTO farmers
           (user_id, address, corn_type, farm_size_hectares, years_farming)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newUserId,
          input.address || null,
          input.cornType ?? null,
          input.farmSizeHectares ?? null,
          input.yearsFarming ?? null,
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
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [input.username]
  );

  const user = rows[0];

  // Both failures return the SAME message, so an attacker cannot
  // discover which usernames exist.
  if (!user) {
    throw ApiError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await verifyPassword(input.password, user.password_hash);

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  if (user.is_active !== 1) {
    throw ApiError.forbidden(
      'This account has been deactivated. Please contact the City Agriculture Office.',
      'ACCOUNT_DEACTIVATED'
    );
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
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];

  if (!user) {
    throw ApiError.notFound('User account no longer exists');
  }

  const publicUser = toPublicUser(user);

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

/**
 * Edits the signed-in user's own profile (Settings screen). Only
 * touches what was actually sent: a field left out of the request
 * is left alone, but a field sent as '' clears it.
 *
 * address/cornType only make sense for a farmer account - they are
 * quietly ignored for an admin rather than raising an error, since
 * the client always sends whichever fields its form shows.
 */
export async function updateProfile(
  userId: number,
  role: 'farmer' | 'admin',
  input: UpdateProfileInput
): Promise<PublicUserWithProfile> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (input.phoneNumber !== undefined) {
      const phoneNumber = normalizePhone(input.phoneNumber);

      const [existing] = await connection.query<UserRow[]>(
        'SELECT id FROM users WHERE phone_number = ? AND id != ? LIMIT 1',
        [phoneNumber, userId]
      );

      if (existing.length > 0) {
        throw ApiError.conflict('That mobile number is already registered', 'PHONE_TAKEN');
      }

      await connection.query('UPDATE users SET phone_number = ? WHERE id = ?', [
        phoneNumber,
        userId,
      ]);
    }

    if (input.avatarPath !== undefined) {
      await connection.query('UPDATE users SET avatar_path = ? WHERE id = ?', [
        input.avatarPath || null,
        userId,
      ]);
    }

    if (role === 'farmer' && (input.address !== undefined || input.cornType !== undefined)) {
      const sets: string[] = [];
      const params: (string | null)[] = [];

      if (input.address !== undefined) {
        sets.push('address = ?');
        params.push(input.address || null);
      }

      if (input.cornType !== undefined) {
        sets.push('corn_type = ?');
        params.push(input.cornType);
      }

      await connection.query(
        `UPDATE farmers SET ${sets.join(', ')} WHERE user_id = ?`,
        [...params, userId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getUserById(userId);
}

// ============================================================
// PASSWORD RESET  (mobile "Forgot password" flow)
//
// Two steps:
//   1. requestPasswordReset(phoneNumber) -> texts a 6-digit code
//   2. resetPassword(phoneNumber, code, newPassword) -> sets it
//
// The code is never stored; only its SHA-256 hash is. Codes last
// PASSWORD_RESET_TTL_MINUTES and lock after 5 wrong attempts.
// ============================================================

/** A row from password_reset_codes. Used only inside this file. */
interface ResetCodeRow extends RowDataPacket {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  attempts: number;
}

/** Max wrong guesses before a code is dead and a new one is needed. */
const MAX_RESET_ATTEMPTS = 5;

/** The message every reset request returns, whether or not the number exists. */
export const RESET_REQUEST_MESSAGE =
  'If an account with that mobile number exists, a reset code has been sent to it.';

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Step 1. Generates a code for the account with this phone number
 * and texts it. Returns nothing useful on purpose: the caller must
 * not be able to tell whether the number is registered.
 */
export async function requestPasswordReset(rawPhoneNumber: string): Promise<void> {
  const phoneNumber = normalizePhone(rawPhoneNumber);

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, full_name, is_active FROM users WHERE phone_number = ? LIMIT 1',
    [phoneNumber]
  );

  const user = rows[0];

  // No account, or a deactivated one: do nothing, silently.
  if (!user || user.is_active !== 1) {
    return;
  }

  // A fresh request invalidates any earlier unused code.
  await pool.query('DELETE FROM password_reset_codes WHERE user_id = ?', [user.id]);

  // Six digits, zero-padded. randomInt is cryptographically sound.
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + env.passwordResetTtlMinutes * 60_000);

  await pool.query<ResultSetHeader>(
    `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, sha256Hex(code), expiresAt]
  );

  await sendSms({
    to: phoneNumber,
    text:
      `${env.appName}: your password reset code is ${code}. ` +
      `It expires in ${env.passwordResetTtlMinutes} minutes. ` +
      `Did not request this? Ignore this message.`,
  });
}

/**
 * Step 2. Verifies the code and sets the new password.
 * Throws a deliberately vague 400 for every failure mode except an
 * expired or locked code, so a wrong number and a wrong code look
 * the same to the caller.
 */
export async function resetPassword(
  rawPhoneNumber: string,
  code: string,
  newPassword: string
): Promise<void> {
  const invalid = ApiError.badRequest(
    'That reset code is not valid. Request a new one and try again.'
  );

  const phoneNumber = normalizePhone(rawPhoneNumber);

  const [userRows] = await pool.query<UserRow[]>(
    'SELECT id FROM users WHERE phone_number = ? AND is_active = 1 LIMIT 1',
    [phoneNumber]
  );

  const user = userRows[0];

  if (!user) {
    throw invalid;
  }

  const [codeRows] = await pool.query<ResetCodeRow[]>(
    `SELECT * FROM password_reset_codes
     WHERE user_id = ? AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );

  const record = codeRows[0];

  if (!record) {
    throw invalid;
  }

  if (record.attempts >= MAX_RESET_ATTEMPTS) {
    throw ApiError.badRequest(
      'Too many incorrect attempts. Please request a new reset code.'
    );
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw ApiError.badRequest(
      'That reset code has expired. Please request a new one.'
    );
  }

  if (sha256Hex(code) !== record.code_hash) {
    await pool.query(
      'UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?',
      [record.id]
    );
    throw invalid;
  }

  // Correct. Swap the password and burn every code for this user.
  const passwordHash = await hashPassword(newPassword);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      user.id,
    ]);

    await connection.query(
      'DELETE FROM password_reset_codes WHERE user_id = ?',
      [user.id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
