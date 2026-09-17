/**
 * Detections page for the CAO admin platform.
 *
 * Route: /detections
 *
 * Every leaf scan recorded in the `detections` table, newest first.
 * Filter by risk or by barangay, search by farmer or disease, and
 * deep-link in from:
 *   - the dashboard tiles   (/detections?risk=high, ?result=healthy…)
 *   - a farmer's detail      (/detections?farmerId=123)
 * so a farmer's scans, the disease each was, and that disease's
 * treatments are one chain of clicks apart. `result` has no toolbar
 * control of its own (the dashboard's Healthy/Diseased tiles are the
 * only way in) - it just shows as a clearable banner, same as farmerId.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as detectionService from '../services/detection.service';
import * as diseaseService from '../services/disease.service';
import * as farmerService from '../services/farmer.service';
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

const RESULT_LABEL: Record<'healthy' | 'diseased', string> = {
  healthy: 'healthy scans',
  diseased: 'diseased scans',
};

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
  const barangay = searchParams.get('barangay') ?? 'all';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [detections, setDetections] = useState<DetectionSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [diseases, setDiseases] = useState<DiseaseInfo[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [viewingDisease, setViewingDisease] = useState<DiseaseInfo | null>(null);

  useEffect(() => {
    diseaseService
      .listDiseases()
      .then(setDiseases)
      .catch(() => setDiseases([]));
    farmerService
      .listBarangays()
      .then(setBarangays)
      .catch(() => setBarangays([]));
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
        barangay: barangay === 'all' ? undefined : barangay,
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
  }, [farmerId, risk, result, barangay, search, page]);

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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={barangay}
            onChange={(e) => patchParams({ barangay: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
          >
            <option value="all">All Barangays</option>
            {barangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

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
        </div>

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

      {result !== 'all' && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-leaf-200 bg-leaf-50 px-4 py-2 text-sm text-leaf-800">
          <span>
            Showing <span className="font-semibold">{RESULT_LABEL[result]}</span> only
          </span>
          <button
            type="button"
            onClick={() => patchParams({ result: null })}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-leaf-700 hover:bg-leaf-100"
          >
            Clear filter
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
                </tr>
              </thead>
              <tbody>
                {detections.map((detection) => {
                  const disease = diseases.find((d) => d.classLabel === detection.predictedClass);
                  return (
                    <tr
                      key={detection.id}
                      className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {detection.farmerName}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={!disease}
                          onClick={() => disease && setViewingDisease(disease)}
                          className={`rounded px-2 py-0.5 text-xs font-medium hover:underline disabled:no-underline disabled:opacity-70 ${
                            detection.isHealthy
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {detection.diseaseName ?? detection.predictedClass}
                        </button>
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
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(detection.detectedAt)}
                      </td>
                    </tr>
                  );
                })}
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

      {viewingDisease && (
        <DiseaseDetailModal disease={viewingDisease} onClose={() => setViewingDisease(null)} />
      )}
    </AdminLayout>
  );
}

/**
 * Shows exactly one disease - the one the clicked scan predicted -
 * never the whole library. Sized like the mobile Library's detail
 * card (generously, but capped) with its own scrollbar so a long
 * description/symptoms/treatments list can't blow up the page.
 */
function DiseaseDetailModal({
  disease,
  onClose,
}: {
  disease: DiseaseInfo;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{disease.displayName}</h2>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                  RISK_BADGE[disease.defaultRiskLevel]
                }`}
              >
                {disease.defaultRiskLevel} risk
              </span>
              {disease.isHealthy && (
                <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  Healthy class
                </span>
              )}
            </div>
            {disease.scientificName && (
              <p className="mt-0.5 text-sm italic text-gray-500">{disease.scientificName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {disease.description && (
            <p className="text-sm text-gray-700">{disease.description}</p>
          )}

          {disease.symptoms && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Symptoms
              </h3>
              <p className="mt-1 text-sm text-gray-700">{disease.symptoms}</p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Treatment recommendations ({disease.treatments.length})
            </h3>
            {disease.treatments.length === 0 ? (
              <p className="mt-1 text-sm text-gray-400">None published for this class yet.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {disease.treatments.map((treatment) => (
                  <li key={treatment.id} className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{treatment.title}</span> —{' '}
                    {treatment.recommendationText}
                    {treatment.applicationMethod && (
                      <p className="mt-1 text-xs text-gray-600">
                        <span className="font-semibold">Application: </span>
                        {treatment.applicationMethod}
                      </p>
                    )}
                    {treatment.preventiveMeasures && (
                      <p className="mt-0.5 text-xs text-gray-600">
                        <span className="font-semibold">Prevention: </span>
                        {treatment.preventiveMeasures}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
