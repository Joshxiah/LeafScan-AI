/**
 * Farmers page for the CAO admin platform.
 *
 * Route: /farmers
 *
 * The CAO owns farmer accounts here: create one (and hand the
 * farmer the generated credentials), search the list, edit details,
 * reset a password, or activate / deactivate an account. Farmers do
 * not self-register.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as farmerService from '../services/farmer.service';
import type { FarmPlotPayload } from '../services/farmer.service';
import type {
  AreaUnit,
  CreatedFarmer,
  FarmerAccountStatus,
  FarmerSummary,
  FarmPlot,
} from '../types';

const STATUS_FILTERS: { label: string; value: FarmerAccountStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [farmers, setFarmers] = useState<FarmerSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<FarmerSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedFarmer | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const result = await farmerService.listFarmers({
        status: filter === 'all' ? undefined : filter,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setFarmers(result.farmers);
      setTotal(result.total);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load farmers.');
    }
  }, [filter, search, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="Farmers">
      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, username, phone…"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-leaf-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-700"
          >
            + Add Farmer
          </button>
        </div>
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
            <p className="text-sm text-gray-500">
              {search ? 'No farmers match your search.' : 'No farmer accounts yet.'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Use “Add Farmer” to create an account and issue credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Barangay</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Reports</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr
                    key={farmer.id}
                    onClick={() => setSelected(farmer)}
                    className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-100"
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
                      {farmer.barangay ?? '—'}
                      {farmer.municipality ? `, ${farmer.municipality}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {farmer.totalAreaHectares > 0 ? (
                        <>
                          {formatHectares(farmer.totalAreaHectares)}
                          {farmer.plots.length > 0 && (
                            <span className="text-xs text-gray-400">
                              {' '}
                              · {farmer.plots.length} plot{farmer.plots.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{farmer.reportCount}</td>
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

      {selected && (
        <FarmerDetailModal
          farmer={selected}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}

      {isCreating && (
        <CreateFarmerModal
          onClose={() => setIsCreating(false)}
          onCreated={(result) => {
            setIsCreating(false);
            setCreatedResult(result);
            void load();
          }}
        />
      )}

      {createdResult && (
        <CredentialsModal
          title="Farmer account created"
          username={createdResult.credentials.username}
          password={createdResult.credentials.password}
          onClose={() => setCreatedResult(null)}
        />
      )}
    </AdminLayout>
  );
}

// ============================================================
// Create
// ============================================================

function CreateFarmerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (result: CreatedFarmer) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [barangay, setBarangay] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [plots, setPlots] = useState<PlotDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (fullName.trim().length < 2) {
      setError('Enter the farmer’s full name.');
      return;
    }
    if (!/^(09\d{9}|\+639\d{9})$/.test(phoneNumber.trim())) {
      setError('Enter a valid mobile number, e.g. 09171234567.');
      return;
    }
    if (plots.some((plot) => plot.area.trim() !== '' && !(Number(plot.area) > 0))) {
      setError('Every plot needs an area greater than zero, or remove the row.');
      return;
    }

    const payloadPlots = plotsPayloadFrom(plots);

    setIsSubmitting(true);
    try {
      const result = await farmerService.createFarmer({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        barangay: barangay.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        plots: payloadPlots.length > 0 ? payloadPlots : undefined,
      });
      onCreated(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create this account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="Add Farmer" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Juan Dela Cruz" />
        <Field
          label="Mobile number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="09171234567"
        />
        <Field label="Barangay" value={barangay} onChange={setBarangay} placeholder="Balangasan" />

        <PlotsEditor plots={plots} onChange={setPlots} />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Username (optional)"
            value={username}
            onChange={setUsername}
            placeholder="auto-generated"
          />
          <Field
            label="Password (optional)"
            value={password}
            onChange={setPassword}
            placeholder="auto-generated"
          />
        </div>
        <p className="text-xs text-gray-400">
          Leave username or password blank to have the system generate them. You will see the
          credentials once, to hand to the farmer.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="flex-1 rounded-lg bg-leaf-600 py-2.5 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// Detail / edit
// ============================================================

function FarmerDetailModal({
  farmer,
  onClose,
  onChanged,
}: {
  farmer: FarmerSummary;
  onClose: () => void;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(farmer);
  const [fullName, setFullName] = useState(farmer.fullName);
  const [phoneNumber, setPhoneNumber] = useState(farmer.phoneNumber ?? '');
  const [barangay, setBarangay] = useState(farmer.barangay ?? '');
  const [plots, setPlots] = useState<PlotDraft[]>(() => draftsFromPlots(farmer.plots));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);

  const plotsChanged = !plotsUnchanged(plots, current.plots);
  const dirty =
    fullName.trim() !== current.fullName ||
    phoneNumber.trim() !== (current.phoneNumber ?? '') ||
    barangay.trim() !== (current.barangay ?? '') ||
    plotsChanged;

  async function save(extra: Parameters<typeof farmerService.updateFarmer>[1] = {}) {
    setError(null);
    if (plotsChanged && plots.some((plot) => plot.area.trim() !== '' && !(Number(plot.area) > 0))) {
      setError('Every plot needs an area greater than zero, or remove the row.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await farmerService.updateFarmer(current.id, {
        fullName: fullName.trim() !== current.fullName ? fullName.trim() : undefined,
        phoneNumber:
          phoneNumber.trim() !== (current.phoneNumber ?? '') ? phoneNumber.trim() : undefined,
        barangay: barangay.trim() !== (current.barangay ?? '') ? barangay.trim() : undefined,
        plots: plotsChanged ? plotsPayloadFrom(plots) : undefined,
        ...extra,
      });
      setCurrent(result.farmer);
      setPlots(draftsFromPlots(result.farmer.plots));
      if (result.newPassword) setResetPassword(result.newPassword);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this account.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Farmer Details" onClose={onClose}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-lg font-bold text-leaf-700">
          {initialsOf(current.fullName)}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{current.fullName}</p>
          <p className="text-sm text-gray-500">@{current.username}</p>
        </div>
        <span className="ml-auto">
          <StatusBadge isActive={current.isActive} />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <Field label="Mobile number" value={phoneNumber} onChange={setPhoneNumber} />
        <Field label="Barangay" value={barangay} onChange={setBarangay} />

        <PlotsEditor plots={plots} onChange={setPlots} />
        {current.plots.length > 0 && (
          <p className="text-xs text-gray-400">{summarizeByPurok(current.plots)}</p>
        )}

        <div className="grid grid-cols-3 gap-3 pt-1 text-sm">
          <ReadOnly label="Total area" value={formatHectares(current.totalAreaHectares)} />
          <ReadOnly label="Reports filed" value={String(current.reportCount)} />
          <ReadOnly label="Joined" value={formatDate(current.createdAt)} />
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            navigate(`/detections?farmerId=${current.id}`);
          }}
          className="text-sm font-medium text-leaf-700 hover:underline"
        >
          View this farmer’s scans →
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isSaving || !dirty}
          onClick={() => save()}
          className="rounded-lg bg-leaf-600 px-3 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => save({ isActive: !current.isActive })}
          className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 ${
            current.isActive
              ? 'border border-red-200 text-red-600 hover:bg-red-50'
              : 'border border-green-200 text-green-700 hover:bg-green-50'
          }`}
        >
          {current.isActive ? 'Deactivate' : 'Reactivate'}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => save({ password: Math.random().toString(36).slice(2, 12) })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
        >
          Reset password
        </button>
      </div>

      {resetPassword && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-800">New password (shown once)</p>
          <p className="mt-0.5 font-mono text-sm text-amber-900">{resetPassword}</p>
        </div>
      )}
    </ModalShell>
  );
}

// ============================================================
// Shared bits
// ============================================================

function CredentialsModal({
  title,
  username,
  password,
  onClose,
}: {
  title: string;
  username: string;
  password: string;
  onClose: () => void;
}) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-sm text-gray-600">
        Give these to the farmer. The password is not stored in readable form and cannot be shown
        again.
      </p>
      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-gray-50 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Username</p>
          <p className="font-mono text-sm text-gray-900">{username}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Password</p>
          <p className="font-mono text-sm text-gray-900">{password}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(`Username: ${username}\nPassword: ${password}`);
        }}
        className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Copy to clipboard
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-lg bg-leaf-600 py-2.5 text-sm font-medium text-white hover:bg-leaf-700"
      >
        Done
      </button>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
      />
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
  );
}

// ============================================================
// Farm plots by purok
// ============================================================

/** A plot row while it is being edited - area is a raw input string. */
interface PlotDraft {
  purok: string;
  area: string;
  unit: AreaUnit;
}

function emptyPlotDraft(): PlotDraft {
  return { purok: '', area: '', unit: 'hectare' };
}

function draftsFromPlots(plots: FarmPlot[]): PlotDraft[] {
  return plots.map((plot) => ({
    purok: plot.purok ?? '',
    area: String(plot.areaValue),
    unit: plot.areaUnit,
  }));
}

/** Drafts -> API payload, dropping rows without a positive area. */
function plotsPayloadFrom(drafts: PlotDraft[]): FarmPlotPayload[] {
  return drafts
    .map((draft) => ({
      purok: draft.purok.trim(),
      areaValue: Number(draft.area),
      areaUnit: draft.unit,
    }))
    .filter((plot) => Number.isFinite(plot.areaValue) && plot.areaValue > 0);
}

function toHectares(value: number, unit: AreaUnit): number {
  return unit === 'sqm' ? value / 10_000 : value;
}

function draftsTotalHectares(drafts: PlotDraft[]): number {
  return plotsPayloadFrom(drafts).reduce(
    (sum, plot) => sum + toHectares(plot.areaValue, plot.areaUnit),
    0
  );
}

function formatHectares(hectares: number): string {
  return `${hectares.toLocaleString('en-PH', { maximumFractionDigits: 2 })} ha`;
}

/** "Purok 1 — 1.2 ha · Purok 3 — 0.8 ha · No purok — 0.4 ha" */
function summarizeByPurok(plots: FarmPlot[]): string {
  const byPurok = new Map<string, number>();
  for (const plot of plots) {
    const key = plot.purok?.trim() || 'No purok';
    byPurok.set(key, (byPurok.get(key) ?? 0) + plot.areaHectares);
  }
  return [...byPurok.entries()]
    .map(([purok, hectares]) => `${purok} — ${formatHectares(hectares)}`)
    .join(' · ');
}

/** True when the drafts describe the same plots already saved on the farmer. */
function plotsUnchanged(drafts: PlotDraft[], saved: FarmPlot[]): boolean {
  const a = plotsPayloadFrom(drafts);
  if (a.length !== saved.length) return false;
  return a.every((plot, i) => {
    const s = saved[i];
    return (
      plot.purok === (s.purok ?? '') &&
      plot.areaUnit === s.areaUnit &&
      plot.areaValue === s.areaValue
    );
  });
}

function PlotsEditor({
  plots,
  onChange,
}: {
  plots: PlotDraft[];
  onChange: (next: PlotDraft[]) => void;
}) {
  function update(index: number, patch: Partial<PlotDraft>) {
    onChange(plots.map((plot, i) => (i === index ? { ...plot, ...patch } : plot)));
  }

  const total = draftsTotalHectares(plots);

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Farm plots by purok
      </span>

      {plots.length === 0 ? (
        <p className="text-xs text-gray-400">
          None yet. A farmer may work several plots (“luna”) across different puroks.
        </p>
      ) : (
        <div className="space-y-2">
          {plots.map((plot, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={plot.purok}
                onChange={(e) => update(index, { purok: e.target.value })}
                placeholder="Purok"
                className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
              />
              <input
                type="text"
                inputMode="decimal"
                value={plot.area}
                onChange={(e) => update(index, { area: e.target.value })}
                placeholder="Area"
                className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
              />
              <select
                value={plot.unit}
                onChange={(e) => update(index, { unit: e.target.value as AreaUnit })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
              >
                <option value="hectare">ha</option>
                <option value="sqm">m²</option>
              </select>
              <button
                type="button"
                onClick={() => onChange(plots.filter((_, i) => i !== index))}
                aria-label="Remove plot"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          onClick={() => onChange([...plots, emptyPlotDraft()])}
          className="text-sm font-medium text-leaf-700 hover:underline"
        >
          + Add plot
        </button>
        {total > 0 && (
          <span className="text-xs text-gray-500">Total: {formatHectares(total)}</span>
        )}
      </div>
    </div>
  );
}
