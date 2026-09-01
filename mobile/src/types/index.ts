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
  email: string;
  phoneNumber: string | null;
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
  data?: T;
}

/** What the Create Account screen sends. */
export interface RegisterPayload {
  fullName: string;
  email?: string;
  username?: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  barangay?: string;
  cornType?: CornType;
  farmSizeHectares?: number;
  yearsFarming?: number;
}

/** What the Login screen sends. */
export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}