/**
 * Pure computation over the farmer's real scan log.
 *
 * Nothing in this file stores or invents data - every function
 * takes a list of real ScanEntry records (see
 * src/services/scanLog.ts, which is what actually persists a scan
 * on the device) and derives totals, buckets and chart bars from
 * it. A farmer who has scanned nothing gets zero everywhere,
 * honestly, because there is nothing to sum.
 */

import { ScanEntry } from '../services/scanLog';

/** Matches backend `diseases.class_label` exactly - see database/leafscan_ai_schema.sql. */
export type ScanClassLabel =
  | 'common_rust'
  | 'gray_leaf_spot'
  | 'healthy'
  | 'northern_leaf_blight';

/** The real, seeded display names, so a scan lines up with the live Disease Library. */
export const CLASS_DISPLAY_NAME: Record<ScanClassLabel, string> = {
  common_rust: 'Common Rust',
  gray_leaf_spot: 'Gray Leaf Spot',
  healthy: 'Healthy Leaf',
  northern_leaf_blight: 'Northern Leaf Blight',
};

/** Default risk level per class - matches diseases.default_risk_level in the DB. */
export const CLASS_RISK_LEVEL: Record<ScanClassLabel, 'none' | 'low' | 'moderate' | 'high'> = {
  common_rust: 'moderate',
  gray_leaf_spot: 'high',
  healthy: 'none',
  northern_leaf_blight: 'high',
};

export function isHealthy(scan: ScanEntry): boolean {
  return scan.classLabel === 'healthy';
}

// ============================================================
// Day buckets - "Today" / "Yesterday" / "Last Week", for the
// History tab and Home's "Recent Scans".
// ============================================================

export type ScanBucket = 'Today' | 'Yesterday' | 'Last Week';
export const SCAN_BUCKETS: ScanBucket[] = ['Today', 'Yesterday', 'Last Week'];

function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function bucketOf(scan: ScanEntry, now: Date = new Date()): ScanBucket {
  const dayDiff = Math.round((startOfDay(now) - startOfDay(scan.scannedAt)) / 86_400_000);
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
export function timeLabelFor(scan: ScanEntry, now: Date = new Date()): string | null {
  if (bucketOf(scan, now) !== 'Today') return null;
  return scan.scannedAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================================
// CAO report summary
// ============================================================

export interface ScanSummary {
  total: number;
  affected: number;
  healthy: number;
  /** One entry per diseased class, with how many scans hit it. */
  breakdown: { classLabel: ScanClassLabel; displayName: string; count: number }[];
}

export function summariseScans(scans: ScanEntry[]): ScanSummary {
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

// ============================================================
// Home's "Scan Activity" chart - Weekly (last 7 days) or
// Monthly (last 4 weeks), built from the real log.
// ============================================================

export interface DayActivity {
  /** Bar label: a weekday initial (Weekly) or "W1".."W4" (Monthly). */
  day: string;
  count: number;
  healthy: number;
  diseased: number;
}

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

export type ActivityRange = 'Weekly' | 'Monthly';

/** Monday-first, with "TH" for Thursday so it can't be confused with Tuesday. */
const WEEKDAY_LABEL: Record<number, string> = {
  0: 'SU',
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'TH',
  5: 'F',
  6: 'S',
};

function tally(scans: ScanEntry[]): { count: number; healthy: number; diseased: number } {
  const healthy = scans.filter(isHealthy).length;
  return { count: scans.length, healthy, diseased: scans.length - healthy };
}

/**
 * Builds the bars for the selected range from the real scan log.
 * Weekly = the last 7 calendar days, oldest first, ending today.
 * Monthly = the last 4 seven-day windows, oldest first.
 */
export function buildActivity(
  scans: ScanEntry[],
  range: ActivityRange,
  now: Date = new Date()
): DayActivity[] {
  if (range === 'Weekly') {
    const days: DayActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = startOfDay(day);
      const dayEnd = dayStart + 86_400_000;

      const dayScans = scans.filter((s) => {
        const t = s.scannedAt.getTime();
        return t >= dayStart && t < dayEnd;
      });

      days.push({ day: WEEKDAY_LABEL[day.getDay()], ...tally(dayScans) });
    }
    return days;
  }

  // Monthly: four 7-day windows, oldest first, the last one ending today.
  const weeks: DayActivity[] = [];
  const todayEnd = startOfDay(now) + 86_400_000;
  for (let w = 3; w >= 0; w--) {
    const windowEnd = todayEnd - w * 7 * 86_400_000;
    const windowStart = windowEnd - 7 * 86_400_000;

    const weekScans = scans.filter((s) => {
      const t = s.scannedAt.getTime();
      return t >= windowStart && t < windowEnd;
    });

    weeks.push({ day: `W${4 - w}`, ...tally(weekScans) });
  }
  return weeks;
}

/**
 * Percent change vs. the immediately preceding period, or null when
 * there is no prior data to compare against - shown next to "Scan
 * Activity" only when it means something, rather than claiming a
 * fake "+X%" on a farmer's very first week.
 */
export function changeVsPreviousPeriod(
  scans: ScanEntry[],
  range: ActivityRange,
  now: Date = new Date()
): number | null {
  const spanDays = range === 'Weekly' ? 7 : 28;
  const currentStart = startOfDay(now) + 86_400_000 - spanDays * 86_400_000;
  const previousStart = currentStart - spanDays * 86_400_000;

  const previousCount = scans.filter((s) => {
    const t = s.scannedAt.getTime();
    return t >= previousStart && t < currentStart;
  }).length;

  if (previousCount === 0) return null;

  const currentCount = scans.filter((s) => s.scannedAt.getTime() >= currentStart).length;

  return Math.round(((currentCount - previousCount) / previousCount) * 100);
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
