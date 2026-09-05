/**
 * Sample scan data for LeafScan AI.
 *
 * The `detections` table only fills up once the AI model is wired
 * in (Phase 13 - see backend/src/controllers/upload.controller.ts).
 * Until then, Home, History, the Diagnosis screen and the CAO
 * report all read from the fixed sample set below instead of a
 * live `GET /api/detections`.
 *
 * Everything on screen is DERIVED from `RECENT_SCANS` and
 * `WEEKLY_ACTIVITY` - nothing is a separately hand-typed number -
 * so the totals, the chart, and the list can never disagree with
 * each other. Swap the two constants below for real API calls and
 * every screen that reads the helpers keeps working unchanged.
 */

/** Matches backend `diseases.class_label` exactly - see database/leafscan_ai_schema.sql. */
export type ScanClassLabel =
  | 'common_rust'
  | 'gray_leaf_spot'
  | 'healthy'
  | 'northern_leaf_blight';

/** The real, seeded display names, so mock scans line up with the live Disease Library. */
export const CLASS_DISPLAY_NAME: Record<ScanClassLabel, string> = {
  common_rust: 'Common Rust',
  gray_leaf_spot: 'Gray Leaf Spot',
  healthy: 'Healthy Leaf',
  northern_leaf_blight: 'Northern Leaf Blight',
};

export interface MockScan {
  id: string;
  classLabel: ScanClassLabel;
  /** Model confidence 0-100. Real classifiers score a "healthy" call too. */
  confidence: number;
  /** When the scan happened. Buckets and chart days are computed from this. */
  scannedAt: Date;
}

/** True midnight-relative "now" used to bucket scans, so this stays correct every day. */
const NOW = new Date();

/** Builds a Date `daysAgo` days back, at the given hour/minute. */
function dateAt(daysAgo: number, hour: number, minute: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Eight recent scans - the same set shown on Home ("Recent Scans"),
 * History (full list) and the CAO report (its summary derives
 * exactly from these eight: 6 diseased, 2 healthy).
 */
export const RECENT_SCANS: MockScan[] = [
  { id: 's1', classLabel: 'common_rust', confidence: 96, scannedAt: dateAt(0, 9, 12) },
  { id: 's2', classLabel: 'gray_leaf_spot', confidence: 92, scannedAt: dateAt(0, 8, 40) },
  { id: 's3', classLabel: 'healthy', confidence: 98, scannedAt: dateAt(1, 16, 5) },
  { id: 's4', classLabel: 'gray_leaf_spot', confidence: 95, scannedAt: dateAt(1, 11, 30) },
  { id: 's5', classLabel: 'northern_leaf_blight', confidence: 93, scannedAt: dateAt(1, 7, 50) },
  { id: 's6', classLabel: 'healthy', confidence: 97, scannedAt: dateAt(6, 10, 15) },
  { id: 's7', classLabel: 'common_rust', confidence: 97, scannedAt: dateAt(6, 9, 0) },
  { id: 's8', classLabel: 'northern_leaf_blight', confidence: 94, scannedAt: dateAt(6, 8, 20) },
];

/** Which of the three day-groups a scan falls into, computed from its real date. */
export type ScanBucket = 'Today' | 'Yesterday' | 'Last Week';

function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function bucketOf(scan: MockScan): ScanBucket {
  const dayDiff = Math.round((startOfDay(NOW) - startOfDay(scan.scannedAt)) / 86_400_000);
  if (dayDiff <= 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  return 'Last Week';
}

/**
 * "9:12 AM" for today's scans, otherwise null - meaning the caller
 * should show the (translated) bucket name instead. Kept separate
 * from the bucket name itself so this file stays language-neutral;
 * see Translations["common"] for the bucket words in each language.
 */
export function timeLabelFor(scan: MockScan): string | null {
  if (bucketOf(scan) !== 'Today') return null;
  return scan.scannedAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const SCAN_BUCKETS: ScanBucket[] = ['Today', 'Yesterday', 'Last Week'];

export function isHealthy(scan: MockScan): boolean {
  return scan.classLabel === 'healthy';
}

/** Totals for the CAO report, derived so it can never disagree with the list above. */
export interface ScanSummary {
  total: number;
  affected: number;
  healthy: number;
  /** One entry per diseased class, with how many scans hit it. */
  breakdown: { classLabel: ScanClassLabel; displayName: string; count: number }[];
}

export function summariseScans(scans: MockScan[] = RECENT_SCANS): ScanSummary {
  const affectedScans = scans.filter((s) => !isHealthy(s));

  const counts = new Map<ScanClassLabel, number>();
  for (const scan of affectedScans) {
    counts.set(scan.classLabel, (counts.get(scan.classLabel) ?? 0) + 1);
  }

  return {
    total: scans.length,
    affected: affectedScans.length,
    healthy: scans.length - affectedScans.length,
    breakdown: [...counts.entries()].map(([classLabel, count]) => ({
      classLabel,
      displayName: CLASS_DISPLAY_NAME[classLabel],
      count,
    })),
  };
}

/**
 * One bar per weekday for the Home "Scan Activity" chart. This is a
 * broader weekly rollup (42 scans) than the eight itemised
 * `RECENT_SCANS` above - dashboards commonly summarise more history
 * than they list individually. `healthy` + `diseased` always add up
 * to `count`, and every screen reads those two fields rather than
 * re-deriving a percentage of its own.
 */
export interface DayActivity {
  /** Single-letter weekday label, Monday first. */
  day: string;
  count: number;
  healthy: number;
  diseased: number;
}

export const WEEKLY_ACTIVITY: DayActivity[] = [
  { day: 'M', count: 6, healthy: 4, diseased: 2 },
  { day: 'T', count: 7, healthy: 5, diseased: 2 },
  { day: 'W', count: 3, healthy: 2, diseased: 1 },
  { day: 'TH', count: 8, healthy: 6, diseased: 2 },
  { day: 'F', count: 6, healthy: 4, diseased: 2 },
  { day: 'S', count: 9, healthy: 7, diseased: 2 },
  { day: 'SU', count: 3, healthy: 3, diseased: 0 },
];

/** Same shape, one bar per week instead of per day, for the "Monthly" toggle. */
export const MONTHLY_ACTIVITY: DayActivity[] = [
  { day: 'W1', count: 34, healthy: 24, diseased: 10 },
  { day: 'W2', count: 41, healthy: 30, diseased: 11 },
  { day: 'W3', count: 29, healthy: 22, diseased: 7 },
  { day: 'W4', count: 42, healthy: 31, diseased: 11 },
];

export type ActivityRange = 'Weekly' | 'Monthly';

export const ACTIVITY_BY_RANGE: Record<ActivityRange, DayActivity[]> = {
  Weekly: WEEKLY_ACTIVITY,
  Monthly: MONTHLY_ACTIVITY,
};

/** Percent change vs. the previous period - shown next to "Scan Activity". */
export const ACTIVITY_CHANGE_PERCENT: Record<ActivityRange, number> = {
  Weekly: 12,
  Monthly: 8,
};

export interface ActivitySummary {
  total: number;
  healthy: number;
  diseased: number;
  healthyPercent: number;
  diseasedPercent: number;
}

export function summariseActivity(days: DayActivity[]): ActivitySummary {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const healthy = days.reduce((sum, d) => sum + d.healthy, 0);
  const diseased = days.reduce((sum, d) => sum + d.diseased, 0);

  return {
    total,
    healthy,
    diseased,
    healthyPercent: total === 0 ? 0 : Math.round((healthy / total) * 100),
    diseasedPercent: total === 0 ? 0 : Math.round((diseased / total) * 100),
  };
}

/**
 * STAND-IN for the real MobileNetV2 classifier (Phase 13).
 *
 * The Preview screen calls this after a photo uploads successfully,
 * so the app has SOMETHING to show on the Diagnosis screen today.
 * It does not look at the photo at all - it just picks a class with
 * roughly the same odds a real corn field would produce (mostly
 * healthy, occasionally diseased) and a plausible confidence.
 *
 * Replace the body of this function with a call to
 * `POST /api/detections` once that endpoint exists; every caller
 * already just reads `{ classLabel, confidence }` off the result.
 */
export function pickMockDiagnosis(): { classLabel: ScanClassLabel; confidence: number } {
  const roll = Math.random();

  const classLabel: ScanClassLabel =
    roll < 0.55
      ? 'healthy'
      : roll < 0.7
        ? 'common_rust'
        : roll < 0.85
          ? 'gray_leaf_spot'
          : 'northern_leaf_blight';

  const confidence = Math.round(82 + Math.random() * 16); // 82-98

  return { classLabel, confidence };
}
