/**
 * Agriculturists page for the CAO admin platform.
 *
 * Route: /agriculturists
 *
 * The CAO's directory of field agriculturists it can send to a
 * farmer's area for an assessment. Add one, search the list, edit
 * details, activate / deactivate, or remove one. These are not
 * login accounts - just reference records. A report picks one of
 * these in Report Details once it reaches an "agriculturist" stage.
 */

import { useCallback, useEffect, useState } from 'react';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as agriculturistService from '../services/agriculturist.service';
import type {
  AgriculturistAccountStatus,
  AgriculturistSummary,
} from '../types';

const STATUS_FILTERS: { label: string; value: AgriculturistAccountStatus | 'all' }[] = [
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

export function AgriculturistsPage() {
  const [filter, setFilter] = useState<AgriculturistAccountStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [agriculturists, setAgriculturists] = useState<AgriculturistSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<AgriculturistSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const result = await agriculturistService.listAgriculturists({
        status: filter === 'all' ? undefined : filter,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setAgriculturists(result.agriculturists);
      setTotal(result.total);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not load agriculturists.'
      );
    }
  }, [filter, search, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="Agriculturists">
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
            placeholder="Search name, phone, email…"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-leaf-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-700"
          >
            + Add Agriculturist
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
        {!agriculturists ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
          </div>
        ) : agriculturists.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-500">
              {search ? 'No agriculturists match your search.' : 'No agriculturists yet.'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Use “Add Agriculturist” to build the directory the Reports page picks from.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Service area</th>
                  <th className="px-4 py-3 font-medium">Specialization</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {agriculturists.map((agriculturist) => (
                  <tr
                    key={agriculturist.id}
                    onClick={() => setSelected(agriculturist)}
                    className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-100"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-xs font-bold text-leaf-700">
                          {initialsOf(agriculturist.fullName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{agriculturist.fullName}</p>
                          {agriculturist.email && (
                            <p className="text-xs text-gray-400">{agriculturist.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{agriculturist.phoneNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {agriculturist.barangay ?? '—'}
                      {agriculturist.municipality ? `, ${agriculturist.municipality}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {agriculturist.specialization ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={agriculturist.isActive} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(agriculturist.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Pagination ---------- */}
      {agriculturists && agriculturists.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages} · {total} agriculturist{total === 1 ? '' : 's'}
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
        <AgriculturistDetailModal
          agriculturist={selected}
          onClose={() => setSelected(null)}
          onChanged={load}
          onDeleted={() => {
            setSelected(null);
            void load();
          }}
        />
      )}

      {isCreating && (
        <CreateAgriculturistModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            void load();
          }}
        />
      )}
    </AdminLayout>
  );
}

// ============================================================
// Create
// ============================================================

function CreateAgriculturistModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [barangay, setBarangay] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (fullName.trim().length < 2) {
      setError('Enter the agriculturist’s full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await agriculturistService.createAgriculturist({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        barangay: barangay.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add this agriculturist.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="Add Agriculturist" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Grace Villaruz" />
        <Field
          label="Phone (optional)"
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="09171234567 or office landline"
        />
        <Field
          label="Email (optional)"
          value={email}
          onChange={setEmail}
          placeholder="name@cao.pagadian.gov.ph"
        />
        <Field
          label="Service area / barangay (optional)"
          value={barangay}
          onChange={setBarangay}
          placeholder="Balangasan"
        />
        <Field
          label="Specialization (optional)"
          value={specialization}
          onChange={setSpecialization}
          placeholder="Corn foliar diseases"
        />
        <p className="text-xs text-gray-400">
          The service area is used on the Reports page to list the nearest agriculturist first.
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
          {isSubmitting ? 'Adding…' : 'Add agriculturist'}
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// Detail / edit
// ============================================================

function AgriculturistDetailModal({
  agriculturist,
  onClose,
  onChanged,
  onDeleted,
}: {
  agriculturist: AgriculturistSummary;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [current, setCurrent] = useState(agriculturist);
  const [fullName, setFullName] = useState(agriculturist.fullName);
  const [phoneNumber, setPhoneNumber] = useState(agriculturist.phoneNumber ?? '');
  const [email, setEmail] = useState(agriculturist.email ?? '');
  const [barangay, setBarangay] = useState(agriculturist.barangay ?? '');
  const [specialization, setSpecialization] = useState(agriculturist.specialization ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askDelete, setAskDelete] = useState(false);

  const dirty =
    fullName.trim() !== current.fullName ||
    phoneNumber.trim() !== (current.phoneNumber ?? '') ||
    email.trim() !== (current.email ?? '') ||
    barangay.trim() !== (current.barangay ?? '') ||
    specialization.trim() !== (current.specialization ?? '');

  async function save(extra: agriculturistService.AgriculturistPayload = {}) {
    setError(null);
    setIsSaving(true);
    try {
      const { agriculturist: updated } = await agriculturistService.updateAgriculturist(
        current.id,
        {
          fullName: fullName.trim() !== current.fullName ? fullName.trim() : undefined,
          phoneNumber:
            phoneNumber.trim() !== (current.phoneNumber ?? '') ? phoneNumber.trim() : undefined,
          email: email.trim() !== (current.email ?? '') ? email.trim() : undefined,
          barangay: barangay.trim() !== (current.barangay ?? '') ? barangay.trim() : undefined,
          specialization:
            specialization.trim() !== (current.specialization ?? '')
              ? specialization.trim()
              : undefined,
          ...extra,
        }
      );
      setCurrent(updated);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this agriculturist.');
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    setError(null);
    setIsSaving(true);
    try {
      await agriculturistService.deleteAgriculturist(current.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove this agriculturist.');
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Agriculturist Details" onClose={onClose}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-lg font-bold text-leaf-700">
          {initialsOf(current.fullName)}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{current.fullName}</p>
          <p className="text-sm text-gray-500">{current.email ?? 'No email on file'}</p>
        </div>
        <span className="ml-auto">
          <StatusBadge isActive={current.isActive} />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <Field label="Phone" value={phoneNumber} onChange={setPhoneNumber} />
        <Field label="Email" value={email} onChange={setEmail} />
        <Field label="Service area / barangay" value={barangay} onChange={setBarangay} />
        <Field label="Specialization" value={specialization} onChange={setSpecialization} />

        <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
          <ReadOnly label="Municipality" value={current.municipality ?? '—'} />
          <ReadOnly label="Added" value={formatDate(current.createdAt)} />
        </div>
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

        {askDelete ? (
          <>
            <button
              type="button"
              disabled={isSaving}
              onClick={remove}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              Confirm delete
            </button>
            <button
              type="button"
              onClick={() => setAskDelete(false)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setAskDelete(true)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>

      {askDelete && (
        <p className="mt-2 text-xs text-gray-500">
          Removing an agriculturist leaves past reports untouched — they keep the recorded name.
        </p>
      )}
    </ModalShell>
  );
}

// ============================================================
// Shared bits
// ============================================================

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
