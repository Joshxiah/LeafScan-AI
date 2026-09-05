/**
 * Shared navigation helper for opening the Diagnosis screen.
 *
 * Home's "Recent Scans" and the History tab both list the same
 * kind of row and both need to open the same screen when one is
 * tapped, so the route-building logic lives here once instead of
 * being duplicated in every screen that lists a scan.
 */

import type { Router } from 'expo-router';
import { MockScan } from '../data/mockScans';

export function goToDiagnosis(
  router: Router,
  scan: MockScan,
  options: { replace?: boolean } = {}
): void {
  const target = {
    pathname: '/diagnosis' as const,
    params: {
      classLabel: scan.classLabel,
      confidence: String(scan.confidence),
      scannedAt: scan.scannedAt.toISOString(),
    },
  };

  if (options.replace) {
    router.replace(target);
  } else {
    router.push(target);
  }
}
