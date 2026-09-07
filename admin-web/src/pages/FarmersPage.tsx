/**
 * Farmers page for the CAO admin platform.
 *
 * Route: /farmers
 *
 * Every farmer account registered through the mobile app, newest
 * first. Read-only for now - there is no edit/deactivate action
 * yet, only visibility into who is using the app.
 */

import { useCallback, useEffect, useState } from 'react';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as farmerService from '../services/farmer.service';
import type { FarmerAccountStatus, FarmerSummary } from '../types';

const STATUS_FILTERS: { label: string; value: FarmerAccountStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const CORN_TYPE_LABEL: Record<'white' | 'yellow' | 'both', string> = {
  white: 'White Corn',
  yellow: 'Yellow Corn',
  both: 'White & Yellow',
};

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function initialsOf(fullName: string): string {
  return fullName.trim().charAt(0).toUpperCase() || '?';
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export function FarmersPage() {
  const [filter, setFilter] = useState<FarmerAccountStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [farmers, setFarmers] = useState<FarmerSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<FarmerSummary | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const result = await farmerService.listFarmers({
        status: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      });
      setFarmers(result.farmers);
      setTotal(result.total);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load farmers.');
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="Farmers">
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
        {!farmers ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
          </div>
        ) : farmers.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-500">No farmers have registered yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Farmer accounts created through the mobile app will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Corn Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr
                    key={farmer.id}
                    onClick={() => setSelected(farmer)}
                    className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-xs font-bold text-leaf-700">
                          {initialsOf(farmer.fullName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{farmer.fullName}</p>
                          <p className="text-xs text-gray-400">@{farmer.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{farmer.phoneNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {farmer.address ?? '—'}
                      {farmer.municipality ? `, ${farmer.municipality}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {farmer.cornType ? CORN_TYPE_LABEL[farmer.cornType] : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={farmer.isActive} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(farmer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Pagination ---------- */}
      {farmers && farmers.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages} · {total} farmer{total === 1 ? '' : 's'}
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

      {selected && <FarmerDetailPanel farmer={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}

function FarmerDetailPanel({
  farmer,
  onClose,
}: {
  farmer: FarmerSummary;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Farmer Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-lg font-bold text-leaf-700">
              {initialsOf(farmer.fullName)}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{farmer.fullName}</p>
              <p className="text-sm text-gray-500">@{farmer.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Phone" value={farmer.phoneNumber ?? 'Not set'} />
            <DetailField label="Email" value={farmer.email ?? 'Not set'} />
            <DetailField label="Address" value={farmer.address ?? 'Not set'} />
            <DetailField label="Municipality" value={farmer.municipality ?? 'Not set'} />
            <DetailField
              label="Corn Type"
              value={farmer.cornType ? CORN_TYPE_LABEL[farmer.cornType] : 'Not set'}
            />
            <DetailField
              label="Farm Size"
              value={farmer.farmSizeHectares != null ? `${farmer.farmSizeHectares} ha` : 'Not set'}
            />
            <DetailField
              label="Years Farming"
              value={farmer.yearsFarming != null ? String(farmer.yearsFarming) : 'Not set'}
            />
            <DetailField label="Joined" value={formatDate(farmer.createdAt)} />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Account status
            </h3>
            <div className="mt-1.5">
              <StatusBadge isActive={farmer.isActive} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
  );
}
