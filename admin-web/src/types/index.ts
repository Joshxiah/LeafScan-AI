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

/** Matches ReportStatus in backend/src/services/report.service.ts. */
export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'agriculturist_required'
  | 'agriculturist_assigned'
  | 'field_assessment_completed'
  | 'resolved';

/** Statuses the CAO can set (everything except the farmer's initial submit). */
export type AdminSettableStatus = Exclude<ReportStatus, 'pending'>;

/** Display label per status - keep in sync with STATUS_LABEL on the backend. */
export const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Submitted',
  under_review: 'Under Review',
  verified: 'Verified',
  agriculturist_required: 'Agriculturist Visit Required',
  agriculturist_assigned: 'Agriculturist Assigned',
  field_assessment_completed: 'Field Assessment Completed',
  resolved: 'Resolved',
};

export interface DiseaseBreakdownItem {
  classLabel: string;
  displayName: string;
  count: number;
}

/** One of the farmer's own scan photos included with a report. */
export interface ReportImage {
  id: number;
  classLabel: string | null;
  displayName: string | null;
  imagePath: string;
  confidenceScore: number | null;
  riskLevel: RiskLevel | null;
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
  isRead: boolean;
  imageCount: number;
  createdAt: string;
}

/** Matches ReportDetail in backend/src/services/report.service.ts. */
export interface ReportDetail extends ReportSummary {
  diseaseBreakdown: DiseaseBreakdownItem[];
  images: ReportImage[];
  remarks: string | null;
  caoMessage: string | null;
  assignedAgriculturist: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

export interface ListReportsResult {
  reports: ReportSummary[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

// ============================================================
// Notifications
// ============================================================

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  reportId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface ListNotificationsResult {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
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
  avatarPath: string | null;
  barangay: string | null;
  municipality: string | null;
  farmSizeHectares: number | null;
  yearsFarming: number | null;
  reportCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ListFarmersResult {
  farmers: FarmerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** POST /api/farmers response - credentials shown to the CAO once. */
export interface CreatedFarmer {
  farmer: FarmerSummary;
  credentials: { username: string; password: string };
}

/** PATCH /api/farmers/:id response. */
export interface UpdatedFarmer {
  farmer: FarmerSummary;
  newPassword?: string;
}
