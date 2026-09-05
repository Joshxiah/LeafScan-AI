/**
 * Shared TypeScript types for the LeafScan AI admin platform.
 *
 * These must match what the backend actually returns. Compare
 * against backend/src/models/user.model.ts and
 * backend/src/services/dashboard.service.ts.
 */

export type UserRole = 'farmer' | 'admin';

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high';

export type ConfidenceLevel = 'low' | 'moderate' | 'high';

export interface FarmerProfile {
  address: string | null;
  municipality: string | null;
  cornType: 'white' | 'yellow' | 'both' | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
}

export interface User {
  id: number;
  fullName: string;
  /** The login ID. Farmers and CAO staff both sign in with this. */
  username: string;
  /** Optional - CAO staff have one, farmers usually do not. */
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  farmerProfile?: FarmerProfile | null;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Matches DiseaseCount in the backend dashboard service. */
export interface DiseaseCount {
  classLabel: string;
  displayName: string;
  count: number;
}

/** Matches RecentDetection in the backend dashboard service. */
export interface RecentDetection {
  id: number;
  farmerName: string;
  diseaseName: string | null;
  predictedClass: string;
  confidenceScore: number;
  riskLevel: RiskLevel;
  detectedAt: string;
}

/** Matches DashboardStatistics in the backend dashboard service. */
export interface DashboardStatistics {
  totalFarmers: number;
  totalScans: number;
  healthyScans: number;
  diseasedScans: number;
  highRiskScans: number;
  scansToday: number;
  diseaseBreakdown: DiseaseCount[];
  recentDetections: RecentDetection[];
}
