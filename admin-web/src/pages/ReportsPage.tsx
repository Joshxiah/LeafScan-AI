/**
 * Reports page for the CAO admin platform.
 *
 * Route: /reports
 *
 * Every outbreak report a farmer has filed from the mobile app,
 * newest first. A report starts "pending"; an admin can mark it
 * "reviewed" once they have looked at it, and "resolved" once
 * whatever it flagged has been dealt with.
 */

import { useCallback, useEffect, useState } from 'react';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as reportService from '../services/report.service';
import type { ReportDetail, ReportStatus, ReportSummary } from '../types';

const STATUS_FILTERS: { label: string; value: ReportStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Resolved', value: 'resolved' },
];

const STATUS_BADGE: Record<ReportStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  reviewed: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
};

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ReportsPage() {
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const result = await reportService.listReports({
        status: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      });
      setReports(result.reports);
      setTotal(result.total);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load reports.');
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="Reports">
      {/* ---------- Filter tabs ---------- */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-leaf-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* ---------- Table ---------- */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {!reports ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-500">No reports here yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Reports farmers file from the mobile app will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Barangay</th>
                  <th className="px-4 py-3 font-medium">Scans</th>
                  <th className="px-4 py-3 font-medium">Affected</th>
                  <th className="px-4 py-3 font-medium">Est. Area</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Filed</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => setSelectedId(report.id)}
                    className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{report.farmerName}</td>
                    <td className="px-4 py-3 text-gray-600">{report.barangay ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{report.totalScans}</td>
                    <td className="px-4 py-3 text-gray-600">{report.affectedScans}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {report.estimatedAreaHectares != null
                        ? `${report.estimatedAreaHectares} ha`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[report.status]}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(report.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Pagination ---------- */}
      {reports && reports.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages} · {total} report{total === 1 ? '' : 's'}
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

      {selectedId !== null && (
        <ReportDetailPanel
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </AdminLayout>
  );
}

function ReportDetailPanel({
  reportId,
  onClose,
  onChanged,
}: {
  reportId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    reportService
      .getReport(reportId)
      .then((detail) => {
        if (isMounted) setReport(detail);
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this report.');
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reportId]);

  async function handleStatusChange(status: 'reviewed' | 'resolved') {
    setIsUpdating(true);
    try {
      await reportService.updateReportStatus(reportId, status);
      const refreshed = await reportService.getReport(reportId);
      setReport(refreshed);
      onChanged();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update this report.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Report Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {!report ? (
          <div className="flex flex-1 items-center justify-center">
            {errorMessage ? (
              <p className="px-5 text-sm text-red-600">{errorMessage}</p>
            ) : (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-5 px-5 py-5">
            <div>
              <p className="text-lg font-semibold text-gray-900">{report.farmerName}</p>
              <p className="text-sm text-gray-500">
                {report.farmerPhone ?? 'No phone on file'} · {report.barangay ?? 'Barangay not set'},{' '}
                {report.municipality ?? 'Pagadian City'}
              </p>
              <p className="mt-1 text-xs text-gray-400">Filed {formatDate(report.createdAt)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Total scans" value={report.totalScans} />
              <MiniStat label="Affected" value={report.affectedScans} accent="text-red-600" />
              <MiniStat label="Healthy" value={report.healthyScans} accent="text-green-600" />
            </div>

            {report.diseaseBreakdown.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Disease breakdown
                </h3>
                <div className="mt-2 space-y-2">
                  {report.diseaseBreakdown.map((item) => (
                    <div
                      key={item.classLabel}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="text-gray-700">{item.displayName}</span>
                      <span className="font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Estimated affected area
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                {report.estimatedAreaHectares != null
                  ? `${report.estimatedAreaHectares} hectares`
                  : 'Not provided'}
              </p>
            </div>

            {report.remarks && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Farmer's remarks
                </h3>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {report.remarks}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</h3>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[report.status]}`}
                >
                  {report.status}
                </span>
                {report.reviewedByName && (
                  <span className="text-xs text-gray-400">
                    by {report.reviewedByName}
                    {report.reviewedAt ? ` · ${formatDate(report.reviewedAt)}` : ''}
                  </span>
                )}
              </div>
            </div>

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

            {report.status !== 'resolved' && (
              <div className="flex gap-2 border-t border-gray-100 pt-4">
                {report.status === 'pending' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('reviewed')}
                    className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    Mark Reviewed
                  </button>
                )}
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('resolved')}
                  className="flex-1 rounded-lg bg-leaf-600 py-2.5 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-60"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = 'text-gray-900',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
