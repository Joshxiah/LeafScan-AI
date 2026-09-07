/**
 * Shared TypeScript types for the LeafScan AI mobile app.
 *
 * These MUST match the shapes the backend actually returns.
 * Compare against backend/src/models/user.model.ts - if the two
 * ever drift apart, you get bugs that TypeScript cannot catch,
 * because the phone has no way to check the server's real output.
 */

/** The two kinds of account. */
export type UserRole = 'farmer' | 'admin';

/** How severe a disease is, matching the backend `diseases` table. */
export type RiskLevel = 'none' | 'low' | 'moderate' | 'high';

/** One expert-verified treatment, published by the CAO. */
export interface DiseaseTreatment {
  id: number;
  title: string;
  recommendationText: string;
  applicationMethod: string | null;
  preventiveMeasures: string | null;
}

/** A disease class shown in the in-app Disease Library. */
export interface Disease {
  id: number;
  classLabel: string;
  displayName: string;
  scientificName: string | null;
  description: string | null;
  symptoms: string | null;
  defaultRiskLevel: RiskLevel;
  isHealthy: boolean;
  treatments: DiseaseTreatment[];
}

/** Corn varieties grown in Pagadian City. */
export type CornType = 'white' | 'yellow' | 'both';

/** Farming details, present only for farmer accounts. */
export interface FarmerProfile {
  barangay: string | null;
  municipality: string | null;
  address: string | null;
  cornType: CornType | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
}

/** A user as returned by the backend. Never includes a password. */
export interface User {
  id: number;
  fullName: string;
  username: string;
  /** Optional - farmers register with a username, not an email. */
  email: string | null;
  phoneNumber: string | null;
  /** Relative path (e.g. "uploads/avatar-123.jpg") - build the full URL with config.uploadsBaseUrl. */
  avatarPath: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  farmerProfile?: FarmerProfile | null;
}

/** What POST /api/auth/register and /login return inside "data". */
export interface AuthResult {
  user: User;
  token: string;
}

/**
 * The standard response shape used by every backend endpoint.
 *
 * The <T> is a placeholder for whatever "data" contains, so
 * ApiResponse<AuthResult> means data is an AuthResult.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  /** A stable identifier for known failures (e.g. "INVALID_CREDENTIALS"), so the app can show a localized message instead of the raw English one. */
  code?: string;
  data?: T;
}

/** What the Create Account screen sends. */
export interface RegisterPayload {
  fullName: string;
  username?: string;
  password: string;
  /** Doubles as the "Forgot password" destination - a code is texted here. */
  phoneNumber?: string;
  address?: string;
  cornType?: CornType;
  farmSizeHectares?: number;
  yearsFarming?: number;
}

/** What the Login screen sends. */
export interface LoginPayload {
  username?: string;
  /** Kept only so older callers still type-check; unused by the backend. */
  email?: string;
  password: string;
}

/** What the Forgot Password screen sends (step 1: request a code). */
export interface ForgotPasswordPayload {
  phoneNumber: string;
}

/** What the Reset Password screen sends (step 2: code + new password). */
export interface ResetPasswordPayload {
  phoneNumber: string;
  code: string;
  password: string;
}
