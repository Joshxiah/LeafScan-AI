/**
 * Detections page for the CAO admin platform.
 *
 * Route: /detections
 *
 * Every leaf scan recorded in the `detections` table, newest first.
 * Filter by risk or by healthy / diseased, search by farmer or
 * disease, and deep-link in from:
 *   - the dashboard tiles   (/detections?risk=high, ?result=healthy…)
 *   - a farmer's detail      (/detections?farmerId=123)
 * so a farmer's scans, the disease each was, and that disease's
 * treatments are one chain of clicks apart.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as detectionService from '../services/detection.service';
import * as diseaseService from '../services/disease.service';
import type { DetectionSummary, DiseaseInfo, RiskLevel } from '../types';

const RISK_BADGE: Record<RiskLevel, string> = {
  none: 'bg-green-50 text-green-700',
  low: 'bg-lime-50 text-lime-700',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

const RISK_OPTIONS: { label: string; value: RiskLevel | 'all' }[] = [
  { label: 'All risk levels', value: 'all' },
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
];

const RESULT_FILTERS: { label: string; value: 'all' | 'healthy' | 'diseased' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Healthy', value: 'healthy' },
  { label: 'Diseased', value: 'diseased' },
];

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DetectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const farmerId = Number(searchParams.get('farmerId')) || undefined;
  const risk = (searchParams.get('risk') as RiskLevel | null) ?? 'all';
  const result = (searchParams.get('result') as 'healthy' | 'diseased' | null) ?? 'all';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [detections, setDetections] = useState<DetectionSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState<DetectionSummary | null>(null);
  const [diseases, setDiseases] = useState<DiseaseInfo[]>([]);

  useEffect(() => {
    diseaseService
      .listDiseases()
      .then(setDiseases)
      .catch(() => setDiseases([]));
  }, []);

  /** Merge a set of param changes and reset to page 1. */
  const patchParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '' || value === 'all') next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
      setPage(1);
    },
    [searchParams, setSearchParams]
  );

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await detectionService.listDetections({
        farmerId,
        risk: risk === 'all' ? undefined : risk,
        result: result === 'all' ? undefined : result,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setDetections(data.detections);
      setTotal(data.total);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not load detections.'
      );
    }
  }, [farmerId, risk, result, search, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const farmerName = useMemo(
    () => (farmerId ? detections?.find((d) => d.farmerId === farmerId)?.farmerName : undefined),
    [farmerId, detections]
  );

  return (
    <AdminLayout title="Detections">
      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {RESULT_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => patchParams({ result: option.value })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                result === option.value
                  ? 'bg-leaf-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={risk}
            onChange={(e) => patchParams({ risk: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
          >
            {RISK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search farmer or disease…"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
          />
        </div>
      </div>

      {farmerId && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-leaf-200 bg-leaf-50 px-4 py-2 text-sm text-leaf-800">
          <span>
            Showing scans for{' '}
            <span className="font-semibold">{farmerName ?? 'one farmer'}</span>
          </span>
          <button
            type="button"
            onClick={() => patchParams({ farmerId: null })}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-leaf-700 hover:bg-leaf-100"
          >
            Show all farmers
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* ---------- Table ---------- */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {!detections ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
          </div>
        ) : detections.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-500">No detections match these filters.</p>
            <p className="mt-1 text-xs text-gray-400">
              Scans farmers run in the mobile app are recorded here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Barangay</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">CAO review</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((detection) => (
                  <tr
                    key={detection.id}
                    className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {detection.farmerName}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/diseases#${detection.predictedClass}`}
                        className={`rounded px-2 py-0.5 text-xs font-medium hover:underline ${
                          detection.isHealthy
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {detection.diseaseName ?? detection.predictedClass}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {detection.confidenceScore.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                          RISK_BADGE[detection.riskLevel]
                        }`}
                      >
                        {detection.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{detection.barangay ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(detection.detectedAt)}</td>
                    <td className="px-4 py-3">
                      <ReviewChip
                        detection={detection}
                        onClick={() => setReviewing(detection)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Pagination ---------- */}
      {detections && detections.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages} · {total} detection{total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          detection={reviewing}
          diseases={diseases}
          onClose={() => setReviewing(null)}
          onSaved={(updated) => {
            setDetections((list) =>
              list ? list.map((d) => (d.id === updated.id ? updated : d)) : list
            );
            setReviewing(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

function ReviewChip({
  detection,
  onClick,
}: {
  detection: DetectionSummary;
  onClick: () => void;
}) {
  if (detection.reviewStatus === 'confirmed') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100"
      >
        ✓ Confirmed
      </button>
    );
  }
  if (detection.reviewStatus === 'corrected') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
      >
        ✎ {detection.correctedDiseaseName ?? detection.correctedClass ?? 'Corrected'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
    >
      Review
    </button>
  );
}

function ReviewModal({
  detection,
  diseases,
  onClose,
  onSaved,
}: {
  detection: DetectionSummary;
  diseases: DiseaseInfo[];
  onClose: () => void;
  onSaved: (updated: DetectionSummary) => void;
}) {
  const [status, setStatus] = useState<'unreviewed' | 'confirmed' | 'corrected'>(
    detection.reviewStatus
  );
  const [correctedClass, setCorrectedClass] = useState(detection.correctedClass ?? '');
  const [note, setNote] = useState(detection.reviewNote ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (status === 'corrected' && !correctedClass) {
      setError('Pick the disease this scan should be.');
      return;
    }
    setIsSaving(true);
    try {
      const { detection: updated } = await detectionService.reviewDetection(detection.id, {
        status,
        correctedClass: status === 'corrected' ? correctedClass : undefined,
        note: note.trim() || undefined,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the review.');
    } finally {
      setIsSaving(false);
    }
  }

  const OPTIONS: { value: typeof status; label: string }[] = [
    { value: 'unreviewed', label: 'Not reviewed' },
    { value: 'confirmed', label: 'Confirm the AI result' },
    { value: 'corrected', label: 'Correct it' },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Review scan</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              AI result (kept as-is)
            </p>
            <p className="mt-0.5 text-gray-800">
              {detection.diseaseName ?? detection.predictedClass} ·{' '}
              {detection.confidenceScore.toFixed(1)}% · {detection.riskLevel} risk
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {detection.farmerName}
              {detection.barangay ? ` · ${detection.barangay}` : ''}
            </p>
          </div>

          <div className="space-y-1.5">
            {OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="review-status"
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          {status === 'corrected' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Actual disease
              </span>
              <select
                value={correctedClass}
                onChange={(e) => setCorrectedClass(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
              >
                <option value="">Select…</option>
                {diseases.map((disease) => (
                  <option key={disease.id} value={disease.classLabel}>
                    {disease.displayName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Note <span className="font-normal normal-case">(optional)</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={save}
            className="flex-1 rounded-lg bg-leaf-600 py-2.5 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save review'}
          </button>
        </div>
      </div>
    </div>
  );
}
