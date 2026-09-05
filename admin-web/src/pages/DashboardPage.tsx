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
import { api, ApiError } from '../services/api';
import type { DashboardStatistics, RiskLevel } from '../types';

const RISK_BADGE: Record<RiskLevel, string> = {
  none: 'bg-green-50 text-green-700',
  low: 'bg-lime-50 text-lime-700',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

export function DashboardPage() {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          {/* ---------- Stat tiles ---------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard
              label="Total Farmers"
              value={statistics.totalFarmers}
              icon="👥"
            />
            <StatCard
              label="Total Scans"
              value={statistics.totalScans}
              icon="🔬"
              hint={`${statistics.scansToday} today`}
            />
            <StatCard
              label="Healthy Scans"
              value={statistics.healthyScans}
              icon="🌿"
              accent="success"
            />
            <StatCard
              label="Diseased Scans"
              value={statistics.diseasedScans}
              icon="⚠️"
              accent="warning"
            />
            <StatCard
              label="High Risk"
              value={statistics.highRiskScans}
              icon="🚨"
              accent="danger"
            />
            <Link to="/reports" className="block">
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
              <h2 className="text-sm font-semibold text-gray-900">
                Recent Detections
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                The ten most recent leaf scans
              </p>

              {statistics.recentDetections.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                  <p className="text-sm text-gray-500">
                    No scans have been recorded yet.
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
                        <th className="py-2 pr-4 font-medium">Result</th>
                        <th className="py-2 pr-4 font-medium">Confidence</th>
                        <th className="py-2 pr-4 font-medium">Risk</th>
                        <th className="py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.recentDetections.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-2.5 pr-4 text-gray-900">
                            {d.farmerName}
                          </td>
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
        </>
      )}
    </AdminLayout>
  );
}
