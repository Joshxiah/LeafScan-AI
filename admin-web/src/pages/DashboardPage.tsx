/**
 * Dashboard page for the CAO admin platform.
 *
 * Route: /dashboard
 *
 * Every figure shown here is read from the database via
 * GET /api/dashboard/statistics. Nothing is hardcoded. While
 * the detections table is empty, the counts are legitimately
 * zero - run backend/scripts/seed_sample_data.js for a realistic
 * demo dataset (sample farmers, three weeks of scan history, and
 * a few outbreak reports) if you want to see this page populated.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AdminLayout } from '../components/layout/AdminLayout';
import { StatCard } from '../components/StatCard';
import { ScanTrendChart } from '../components/charts/ScanTrendChart';
import { DiseaseBreakdownChart } from '../components/charts/DiseaseBreakdownChart';
import { BarangayRiskChart } from '../components/charts/BarangayRiskChart';
import { api, ApiError } from '../services/api';
import * as dashboardService from '../services/dashboard.service';
import type { BarangayBreakdown, DashboardStatistics, RecentDetection, RiskLevel } from '../types';

const RISK_BADGE: Record<RiskLevel, string> = {
  none: 'bg-green-50 text-green-700',
  low: 'bg-lime-50 text-lime-700',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

const RISK_FILTERS: { label: string; value: RiskLevel | 'all' }[] = [
  { label: 'All risk levels', value: 'all' },
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
];

export function DashboardPage() {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---- "Scans by Barangay" section (its own risk filter + fetch) ----
  const [barangayRisk, setBarangayRisk] = useState<RiskLevel | 'all'>('all');
  const [barangayData, setBarangayData] = useState<BarangayBreakdown | null>(null);
  const [barangayError, setBarangayError] = useState<string | null>(null);
  const [isBarangayLoading, setIsBarangayLoading] = useState(true);

  // Every barangay that has at least one scan, for the Recent
  // Detections filter below. Ratchets to the fullest list seen
  // rather than shrinking when barangayRisk filters it down.
  const [barangayOptions, setBarangayOptions] = useState<string[]>([]);
  useEffect(() => {
    if (barangayRisk === 'all' && barangayData) {
      setBarangayOptions(
        [...barangayData.barangays.map((row) => row.barangay)].sort((a, b) =>
          a.localeCompare(b)
        )
      );
    }
  }, [barangayRisk, barangayData]);

  // ---- "Recent Detections" section (its own barangay + risk filters) ----
  const [recentRisk, setRecentRisk] = useState<RiskLevel | 'all'>('all');
  const [recentBarangay, setRecentBarangay] = useState<string>('all');
  const [recentDetections, setRecentDetections] = useState<RecentDetection[] | null>(null);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [isRecentLoading, setIsRecentLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStatistics() {
      try {
        const data = await api.get<DashboardStatistics>('/dashboard/statistics');

        if (isMounted) {
          setStatistics(data);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : 'Could not load dashboard statistics.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsBarangayLoading(true);
    setBarangayError(null);

    dashboardService
      .getBarangayBreakdown(barangayRisk === 'all' ? undefined : barangayRisk)
      .then((data) => {
        if (isMounted) setBarangayData(data);
      })
      .catch((error) => {
        if (isMounted) {
          setBarangayError(
            error instanceof ApiError
              ? error.message
              : 'Could not load the barangay breakdown.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsBarangayLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [barangayRisk]);

  useEffect(() => {
    let isMounted = true;
    setIsRecentLoading(true);
    setRecentError(null);

    dashboardService
      .getRecentDetections({
        risk: recentRisk === 'all' ? undefined : recentRisk,
        barangay: recentBarangay === 'all' ? undefined : recentBarangay,
        limit: 10,
      })
      .then((data) => {
        if (isMounted) setRecentDetections(data);
      })
      .catch((error) => {
        if (isMounted) {
          setRecentError(
            error instanceof ApiError ? error.message : 'Could not load recent detections.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsRecentLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recentRisk, recentBarangay]);

  return (
    <AdminLayout title="Dashboard">
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {statistics && (
        <>
          {/* ---------- Stat tiles (each navigates) ---------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <Link to="/farmers" className="block rounded-xl transition hover:shadow-md">
              <StatCard label="Total Farmers" value={statistics.totalFarmers} icon="👥" />
            </Link>
            <Link to="/agriculturists" className="block rounded-xl transition hover:shadow-md">
              <StatCard
                label="Total Agriculturists"
                value={statistics.totalAgriculturists}
                icon="🧑‍🌾"
              />
            </Link>
            <Link to="/detections" className="block rounded-xl transition hover:shadow-md">
              <StatCard
                label="Total Scans"
                value={statistics.totalScans}
                icon="🔬"
                hint={`${statistics.scansToday} today`}
              />
            </Link>
            <Link
              to="/detections?result=healthy"
              className="block rounded-xl transition hover:shadow-md"
            >
              <StatCard
                label="Healthy Scans"
                value={statistics.healthyScans}
                icon="🌿"
                accent="success"
              />
            </Link>
            <Link
              to="/detections?result=diseased"
              className="block rounded-xl transition hover:shadow-md"
            >
              <StatCard
                label="Diseased Scans"
                value={statistics.diseasedScans}
                icon="⚠️"
                accent="warning"
              />
            </Link>
            <Link
              to="/detections?risk=high"
              className="block rounded-xl transition hover:shadow-md"
            >
              <StatCard
                label="High Risk"
                value={statistics.highRiskScans}
                icon="🚨"
                accent="danger"
              />
            </Link>
            <Link to="/reports" className="block rounded-xl transition hover:shadow-md">
              <StatCard
                label="Reports Pending"
                value={statistics.pendingReports}
                icon="📨"
                accent={statistics.pendingReports > 0 ? 'warning' : 'default'}
                hint={`${statistics.totalReports} filed total`}
              />
            </Link>
          </div>

          {/* ---------- Scan activity trend ---------- */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Scan Activity</h2>
            <p className="mt-0.5 text-xs text-gray-400">Scans recorded per day, last 14 days</p>

            <div className="mt-4">
              <ScanTrendChart data={statistics.scanTrend} />
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ---------- Disease breakdown ---------- */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-1">
              <h2 className="text-sm font-semibold text-gray-900">
                Scans by Disease Class
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Coloured by risk level, not just category
              </p>

              <div className="mt-4">
                <DiseaseBreakdownChart data={statistics.diseaseBreakdown} />
              </div>
            </section>

            {/* ---------- Recent detections ---------- */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Recent Detections</h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    The ten most recent leaf scans matching these filters
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={recentBarangay}
                    onChange={(e) => setRecentBarangay(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
                  >
                    <option value="all">All barangays</option>
                    {barangayOptions.map((barangay) => (
                      <option key={barangay} value={barangay}>
                        {barangay}
                      </option>
                    ))}
                  </select>

                  <select
                    value={recentRisk}
                    onChange={(e) => setRecentRisk(e.target.value as RiskLevel | 'all')}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
                  >
                    {RISK_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {recentError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{recentError}</p>
                </div>
              )}

              {isRecentLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
                </div>
              ) : !recentDetections || recentDetections.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                  <p className="text-sm text-gray-500">
                    {recentRisk === 'all' && recentBarangay === 'all'
                      ? 'No scans have been recorded yet.'
                      : 'No scans match these filters.'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Detections will appear here once farmers begin scanning
                    corn leaves with the mobile app.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                        <th className="py-2 pr-4 font-medium">Farmer</th>
                        <th className="py-2 pr-4 font-medium">Barangay</th>
                        <th className="py-2 pr-4 font-medium">Result</th>
                        <th className="py-2 pr-4 font-medium">Confidence</th>
                        <th className="py-2 pr-4 font-medium">Risk</th>
                        <th className="py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDetections.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-2.5 pr-4 text-gray-900">
                            {d.farmerName}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600">{d.barangay}</td>
                          <td className="py-2.5 pr-4 text-gray-700">
                            {d.diseaseName ?? d.predictedClass}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-700">
                            {d.confidenceScore.toFixed(1)}%
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${RISK_BADGE[d.riskLevel]}`}
                            >
                              {d.riskLevel}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-500">
                            {new Date(d.detectedAt).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* ---------- Scans by Barangay ---------- */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Scans by Barangay</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Where healthy and diseased scans come from. Every scan is
                  counted, so these rows reconcile with the totals above.
                </p>
              </div>

              <select
                value={barangayRisk}
                onChange={(e) => setBarangayRisk(e.target.value as RiskLevel | 'all')}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-leaf-500 focus:outline-none"
              >
                {RISK_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {barangayError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{barangayError}</p>
              </div>
            )}

            {isBarangayLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
              </div>
            ) : barangayData && barangayData.barangays.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* ---- Reconciling table ---- */}
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                          <th className="py-2 pr-4 font-medium">Barangay</th>
                          <th className="py-2 pr-4 text-right font-medium">Healthy</th>
                          <th className="py-2 pr-4 text-right font-medium">Diseased</th>
                          <th className="py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {barangayData.barangays.map((row) => (
                          <tr
                            key={row.barangay}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-2 pr-4 text-gray-900">{row.barangay}</td>
                            <td className="py-2 pr-4 text-right text-green-700">
                              {row.healthy}
                            </td>
                            <td className="py-2 pr-4 text-right text-red-700">
                              {row.diseased}
                            </td>
                            <td className="py-2 text-right text-gray-700">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 text-sm font-semibold text-gray-900">
                          <td className="py-2 pr-4">All barangays</td>
                          <td className="py-2 pr-4 text-right">
                            {barangayData.totals.healthy}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {barangayData.totals.diseased}
                          </td>
                          <td className="py-2 text-right">{barangayData.totals.total}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    {barangayRisk === 'all'
                      ? `Reconciles with ${statistics.healthyScans} healthy / ${statistics.diseasedScans} diseased scans above.`
                      : `Showing ${barangayData.totals.total} scan${
                          barangayData.totals.total === 1 ? '' : 's'
                        } at the selected risk level.`}
                  </p>
                </div>

                {/* ---- Risk-per-disease graph ---- */}
                <div>
                  <p className="mb-3 text-xs font-medium text-gray-500">
                    Risk per disease, by barangay
                  </p>
                  <BarangayRiskChart data={barangayData.barangays} />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                No scans recorded for this filter yet.
              </p>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}
