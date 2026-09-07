/**
 * Reports page for the CAO admin platform.
 *
 * Route: /reports
 *
 * Every outbreak report a farmer has filed, newest first, with
 * Messenger-style unread state: a report a farmer just filed shows
 * in bold with a dot until the CAO opens it. Opening a report shows
 * a centered modal where the CAO can inspect each reported disease
 * and the farmer's own photos, then move the report along its
 * field-assessment lifecycle - the farmer is notified at each step.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import { mediaUrl } from '../services/media';
import * as reportService from '../services/report.service';
import { useNotifications } from '../context/NotificationsContext';
import {
  STATUS_LABEL,
  type AdminSettableStatus,
  type ReportDetail,
  type ReportImage,
  type ReportStatus,
  type ReportSummary,
  type RiskLevel,
} from '../types';

const STATUS_OPTIONS: { label: string; value: ReportStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Submitted', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Agriculturist Visit Required', value: 'agriculturist_required' },
  { label: 'Agriculturist Assigned', value: 'agriculturist_assigned' },
  { label: 'Field Assessment Completed', value: 'field_assessment_completed' },
  { label: 'Resolved', value: 'resolved' },
];

const STATUS_BADGE: Record<ReportStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  under_review: 'bg-blue-50 text-blue-700',
  verified: 'bg-indigo-50 text-indigo-700',
  agriculturist_required: 'bg-orange-50 text-orange-700',
  agriculturist_assigned: 'bg-purple-50 text-purple-700',
  field_assessment_completed: 'bg-teal-50 text-teal-700',
  resolved: 'bg-green-50 text-green-700',
};

const RISK_BADGE: Record<RiskLevel, string> = {
  none: 'bg-green-50 text-green-700',
  low: 'bg-lime-50 text-lime-700',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

/** Every status the CAO can set, in lifecycle order - the dropdown options. */
const SETTABLE_STATUSES: AdminSettableStatus[] = [
  'under_review',
  'verified',
  'agriculturist_required',
  'agriculturist_assigned',
  'field_assessment_completed',
  'resolved',
];

/** Pre-selects the sensible next step for the status dropdown. */
function defaultNextStatus(current: ReportStatus): AdminSettableStatus {
  const flow: Record<ReportStatus, AdminSettableStatus> = {
    pending: 'under_review',
    under_review: 'verified',
    verified: 'agriculturist_required',
    agriculturist_required: 'agriculturist_assigned',
    agriculturist_assigned: 'field_assessment_completed',
    field_assessment_completed: 'resolved',
    resolved: 'resolved',
  };
  return flow[current];
}

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { eventSeq, noteReportOpened, reload: reloadCounts } = useNotifications();

  const [status, setStatus] = useState<ReportStatus | 'all'>('all');
  const [barangay, setBarangay] = useState<string>('all');
  const [barangays, setBarangays] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Deep link from a notification: /reports?open=<id>
  useEffect(() => {
    const open = searchParams.get('open');
    if (open) {
      const id = Number(open);
      if (Number.isInteger(id) && id > 0) setSelectedId(id);
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    reportService
      .listBarangays()
      .then(setBarangays)
      .catch(() => setBarangays([]));
  }, []);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const result = await reportService.listReports({
        status: status === 'all' ? undefined : status,
        barangay: barangay === 'all' ? undefined : barangay,
        page,
        pageSize: PAGE_SIZE,
      });
      setReports(result.reports);
      setTotal(result.total);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load reports.');
    }
  }, [status, barangay, page]);

  // Reload on filter change AND whenever a real-time event lands.
  useEffect(() => {
    void load();
  }, [load, eventSeq]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = status !== 'all' || barangay !== 'all';

  function resetFilters() {
    setStatus('all');
    setBarangay('all');
    setPage(1);
  }

  function openReport(id: number, wasUnread: boolean) {
    setSelectedId(id);
    if (wasUnread) {
      noteReportOpened();
      // Optimistically flip the row so the list matches immediately.
      setReports((list) =>
        list ? list.map((r) => (r.id === id ? { ...r, isRead: true } : r)) : list
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <AdminLayout title="Reports">
      {/* ---------- Heading + unread count ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? (
            <>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" />
              <span className="font-semibold text-gray-900">{unreadCount}</span> unread
            </>
          ) : (
            'All reports read'
          )}
        </p>

        {/* ---------- Filters ---------- */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={barangay}
            onChange={(e) => {
              setBarangay(e.target.value);
              setPage(1);
            }}
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
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ReportStatus | 'all');
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              Reset
            </button>
          )}
        </div>
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
            <p className="text-sm text-gray-500">
              {hasFilter ? 'No reports match these filters.' : 'No reports here yet.'}
            </p>
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
                  <th className="px-4 py-3 font-medium">Photos</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Filed</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const unread = !report.isRead;
                  return (
                    <tr
                      key={report.id}
                      onClick={() => openReport(report.id, unread)}
                      className={`cursor-pointer border-b border-gray-100 transition-colors last:border-0 ${
                        unread
                          ? 'bg-leaf-50/60 hover:bg-leaf-100'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <td
                        className={`px-4 py-3 text-gray-900 ${
                          unread ? 'font-bold' : 'font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              unread ? 'bg-red-500' : 'bg-transparent'
                            }`}
                          />
                          {report.farmerName}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${unread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {report.barangay ?? '—'}
                      </td>
                      <td className={`px-4 py-3 ${unread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {report.totalScans}
                      </td>
                      <td className={`px-4 py-3 ${unread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {report.affectedScans}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {report.imageCount > 0 ? `📷 ${report.imageCount}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[report.status]}`}
                        >
                          {STATUS_LABEL[report.status]}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${unread ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
                        {formatDate(report.createdAt)}
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
        <ReportDetailModal
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            void load();
            void reloadCounts();
          }}
        />
      )}
    </AdminLayout>
  );
}

function ReportDetailModal({
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
  const [message, setMessage] = useState('');
  const [nextStatus, setNextStatus] = useState<AdminSettableStatus>('under_review');
  const [agriculturist, setAgriculturist] = useState('');
  const [lightbox, setLightbox] = useState<ReportImage | null>(null);
  const [openDisease, setOpenDisease] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setReport(null);
    reportService
      .getReport(reportId)
      .then((detail) => {
        if (!isMounted) return;
        setReport(detail);
        setNextStatus(defaultNextStatus(detail.status));
        setAgriculturist(detail.assignedAgriculturist ?? '');
        // Auto-expand the first reported disease so photos are one glance away.
        setOpenDisease(detail.diseaseBreakdown[0]?.classLabel ?? null);
        onChanged();
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiError ? error.message : 'Could not load this report.'
          );
        }
      });
    return () => {
      isMounted = false;
    };
    // onChanged is stable enough for this one-shot load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (lightbox) setLightbox(null);
      else onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, onClose]);

  const agriculturistRelevant =
    nextStatus === 'agriculturist_required' ||
    nextStatus === 'agriculturist_assigned' ||
    !!report?.assignedAgriculturist;

  async function handleUpdate() {
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      await reportService.updateReportStatus(
        reportId,
        nextStatus,
        message.trim() || undefined,
        agriculturistRelevant ? agriculturist.trim() : undefined
      );
      const refreshed = await reportService.getReport(reportId);
      setReport(refreshed);
      setMessage('');
      setNextStatus(defaultNextStatus(refreshed.status));
      setAgriculturist(refreshed.assignedAgriculturist ?? '');
      onChanged();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not update this report.'
      );
    } finally {
      setIsUpdating(false);
    }
  }

  /** Photos grouped by the disease they were classified as. */
  const imagesByClass = useMemo(() => {
    const map = new Map<string, ReportImage[]>();
    for (const img of report?.images ?? []) {
      const key = img.classLabel && img.classLabel !== 'healthy' ? img.classLabel : 'healthy';
      const list = map.get(key) ?? [];
      list.push(img);
      map.set(key, list);
    }
    return map;
  }, [report]);

  const healthyImages = imagesByClass.get('healthy') ?? [];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Header ---------- */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Report Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!report ? (
          <div className="flex h-64 items-center justify-center">
            {errorMessage ? (
              <p className="px-6 text-sm text-red-600">{errorMessage}</p>
            ) : (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* ---------- Farmer ---------- */}
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

            {/* ---------- Disease breakdown (interactive) ---------- */}
            {report.diseaseBreakdown.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Reported diseases — tap to verify
                </h3>
                <div className="mt-2 space-y-2">
                  {report.diseaseBreakdown.map((item) => {
                    const photos = imagesByClass.get(item.classLabel) ?? [];
                    const isOpen = openDisease === item.classLabel;
                    return (
                      <div
                        key={item.classLabel}
                        className="overflow-hidden rounded-lg border border-gray-100"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDisease(isOpen ? null : item.classLabel)
                          }
                          className={`flex w-full items-center justify-between px-3 py-2.5 text-sm ${
                            isOpen ? 'bg-leaf-50' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="flex items-center gap-2 font-medium text-gray-800">
                            <span className="text-gray-400">{isOpen ? '▾' : '▸'}</span>
                            {item.displayName}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {photos.length > 0
                                ? `${photos.length} photo${photos.length === 1 ? '' : 's'}`
                                : 'no photo'}
                            </span>
                            <span className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-700">
                              {item.count}
                            </span>
                          </span>
                        </button>

                        {isOpen && (
                          <DiseasePanel
                            photos={photos}
                            onOpenImage={setLightbox}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------- Healthy photos, if any were attached ---------- */}
            {healthyImages.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Healthy-leaf photos ({healthyImages.length})
                </h3>
                <PhotoGrid photos={healthyImages} onOpenImage={setLightbox} />
              </div>
            )}

            {/* ---------- Estimated area ---------- */}
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

            {/* ---------- Remarks ---------- */}
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

            {/* ---------- Status + workflow ---------- */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[report.status]}`}
                >
                  {STATUS_LABEL[report.status]}
                </span>
                {report.reviewedByName && (
                  <span className="text-xs text-gray-400">
                    updated by {report.reviewedByName}
                    {report.reviewedAt ? ` · ${formatDate(report.reviewedAt)}` : ''}
                  </span>
                )}
              </div>

              {report.assignedAgriculturist && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Agriculturist:</span>{' '}
                  {report.assignedAgriculturist}
                </p>
              )}

              {report.caoMessage && (
                <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Last message to farmer: “{report.caoMessage}”
                </p>
              )}

              {/* ---------- Update form ---------- */}
              <div className="mt-3 space-y-2.5">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Change status to
                  </span>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as AdminSettableStatus)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-leaf-500 focus:outline-none"
                  >
                    {SETTABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>

                {agriculturistRelevant && (
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Agriculturist name
                    </span>
                    <input
                      type="text"
                      value={agriculturist}
                      onChange={(e) => setAgriculturist(e.target.value)}
                      placeholder="Who is being sent to the area?"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Message to farmer <span className="font-normal normal-case">(optional)</span>
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Sent with the status update…"
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
                  />
                </label>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleUpdate}
                  className="w-full rounded-lg bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
                >
                  {isUpdating ? 'Updating…' : 'Update Report'}
                </button>
              </div>

              {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Lightbox ---------- */}
      {lightbox && (
        <ImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function DiseasePanel({
  photos,
  onOpenImage,
}: {
  photos: ReportImage[];
  onOpenImage: (image: ReportImage) => void;
}) {
  const sample = photos[0];
  return (
    <div className="space-y-3 border-t border-gray-100 bg-white px-3 py-3">
      <div className="flex flex-wrap gap-4 text-xs">
        <Fact
          label="Highest confidence"
          value={
            photos.length
              ? `${Math.max(...photos.map((p) => p.confidenceScore ?? 0)).toFixed(1)}%`
              : sample?.confidenceScore != null
                ? `${sample.confidenceScore.toFixed(1)}%`
                : '—'
          }
        />
        <Fact
          label="Risk level"
          value={
            sample?.riskLevel ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${RISK_BADGE[sample.riskLevel]}`}
              >
                {sample.riskLevel}
              </span>
            ) : (
              '—'
            )
          }
        />
        <Fact label="Photos" value={String(photos.length)} />
      </div>

      {photos.length === 0 ? (
        <p className="text-xs text-gray-400">
          The farmer did not attach a photo for this disease.
        </p>
      ) : (
        <PhotoGrid photos={photos} onOpenImage={onOpenImage} />
      )}
    </div>
  );
}

function PhotoGrid({
  photos,
  onOpenImage,
}: {
  photos: ReportImage[];
  onOpenImage: (image: ReportImage) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => {
        const url = mediaUrl(photo.imagePath);
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onOpenImage(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
          >
            {url ? (
              <img
                src={url}
                alt={photo.displayName ?? 'Farmer scan'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                no image
              </span>
            )}
            {photo.confidenceScore != null && (
              <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                {photo.confidenceScore.toFixed(0)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ImageLightbox({ image, onClose }: { image: ReportImage; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const url = mediaUrl(image.imagePath);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] max-w-[90vw] overflow-auto rounded-lg bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          <img
            src={url}
            alt={image.displayName ?? 'Farmer scan'}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="block transition-transform"
          />
        ) : (
          <p className="p-10 text-sm text-gray-300">Image unavailable.</p>
        )}
      </div>

      <div
        className="mt-3 flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
          className="text-lg leading-none disabled:opacity-40"
          disabled={zoom <= 1}
        >
          −
        </button>
        <span className="text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}
          className="text-lg leading-none disabled:opacity-40"
          disabled={zoom >= 4}
        >
          +
        </button>
        <span className="ml-2 border-l border-white/20 pl-3 text-xs">
          {image.displayName ?? 'Healthy leaf'}
          {image.confidenceScore != null ? ` · ${image.confidenceScore.toFixed(1)}%` : ''}
        </span>
        <button type="button" onClick={onClose} className="ml-2 text-sm">
          Close ✕
        </button>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-800">{value}</p>
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
