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
  riskLevel: RiskLevel;
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

/** One day's scan count, for the "scans over time" trend chart. */
export interface ScanTrendPoint {
  date: string;
  count: number;
}

/** Matches DashboardStatistics in the backend dashboard service. */
export interface DashboardStatistics {
  totalFarmers: number;
  totalScans: number;
  healthyScans: number;
  diseasedScans: number;
  highRiskScans: number;
  scansToday: number;
  pendingReports: number;
  totalReports: number;
  diseaseBreakdown: DiseaseCount[];
  scanTrend: ScanTrendPoint[];
  recentDetections: RecentDetection[];
}

// ============================================================
// Outbreak reports
// ============================================================

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface DiseaseBreakdownItem {
  classLabel: string;
  displayName: string;
  count: number;
}

/** Matches ReportSummary in backend/src/services/report.service.ts. */
export interface ReportSummary {
  id: number;
  farmerId: number;
  farmerName: string;
  farmerPhone: string | null;
  barangay: string | null;
  municipality: string | null;
  totalScans: number;
  affectedScans: number;
  healthyScans: number;
  estimatedAreaHectares: number | null;
  status: ReportStatus;
  createdAt: string;
}

/** Matches ReportDetail in backend/src/services/report.service.ts. */
export interface ReportDetail extends ReportSummary {
  diseaseBreakdown: DiseaseBreakdownItem[];
  remarks: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

export interface ListReportsResult {
  reports: ReportSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================
// Farmer accounts
// ============================================================

export type FarmerAccountStatus = 'active' | 'inactive';

/** Matches FarmerSummary in backend/src/services/farmer.service.ts. */
export interface FarmerSummary {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  municipality: string | null;
  cornType: 'white' | 'yellow' | 'both' | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface ListFarmersResult {
  farmers: FarmerSummary[];
  total: number;
  page: number;
  pageSize: number;
}
