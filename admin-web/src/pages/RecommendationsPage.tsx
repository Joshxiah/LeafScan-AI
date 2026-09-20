/**
 * Recommendations page for the CAO admin platform.
 *
 * Route: /recommendations
 *
 * The CAO authors every treatment recommendation here - add, edit,
 * activate / deactivate, or delete. Tapping "Recommendations" shows
 * the diseases first; picking one then shows only that disease's
 * recommendations, so two diseases' treatments never appear together.
 * The mobile app shows the ACTIVE ones after a diagnosis (via GET
 * /api/diseases); inactive ones are hidden there but stay visible on
 * this page so they can be brought back.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as recommendationService from '../services/recommendation.service';
import * as diseaseService from '../services/disease.service';
import type { DiseaseInfo, RecommendationSummary } from '../types';

export function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationSummary[] | null>(null);
  const [diseases, setDiseases] = useState<DiseaseInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedDiseaseId, setSelectedDiseaseId] = useState<number | null>(null);
  const [editing, setEditing] = useState<RecommendationSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const list = await recommendationService.listRecommendations();
      setRecommendations(list);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not load recommendations.'
      );
    }
  }, []);

  useEffect(() => {
    void load();
    diseaseService
      .listDiseases()
      .then(setDiseases)
      .catch(() => setDiseases([]));
  }, [load]);

  /** The diseases a CAO writes treatments for - the "healthy" class has none. */
  const treatableDiseases = useMemo(() => diseases.filter((d) => !d.isHealthy), [diseases]);

  const selectedDisease = useMemo(
    () => treatableDiseases.find((d) => d.id === selectedDiseaseId) ?? null,
    [treatableDiseases, selectedDiseaseId]
  );

  const recommendationsForSelected = useMemo(
    () => (recommendations ?? []).filter((rec) => rec.diseaseId === selectedDiseaseId),
    [recommendations, selectedDiseaseId]
  );

  return (
    <AdminLayout title="Recommendations">
      <div className="flex items-center justify-between">
        {selectedDisease ? (
          <button
            type="button"
            onClick={() => setSelectedDiseaseId(null)}
            className="text-sm font-medium text-leaf-700 hover:underline"
          >
            ← Back to diseases
          </button>
        ) : (
          <p className="text-sm text-gray-500">Select a disease to view its recommendations.</p>
        )}
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="rounded-lg bg-leaf-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-700"
        >
          + Add Recommendation
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {!recommendations ? (
        <div className="mt-4 flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
        </div>
      ) : !selectedDisease ? (
        <DiseaseSelector
          diseases={treatableDiseases}
          recommendations={recommendations}
          onSelect={setSelectedDiseaseId}
        />
      ) : (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {selectedDisease.displayName}
            <span className="ml-2 text-xs font-normal text-gray-400">
              {recommendationsForSelected.length} recommendation
              {recommendationsForSelected.length === 1 ? '' : 's'}
            </span>
          </h2>

          {recommendationsForSelected.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-16 text-center">
              <p className="text-sm text-gray-500">
                No treatment recommendations for this disease yet.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Use “Add Recommendation” to publish the first one.
              </p>
            </div>
          ) : (
            <div className="mt-2 grid gap-3 lg:grid-cols-2">
              {recommendationsForSelected.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onEdit={() => setEditing(rec)}
                  onChanged={load}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isCreating && (
        <RecommendationModal
          diseases={treatableDiseases}
          initialDiseaseId={selectedDiseaseId ?? undefined}
          onClose={() => setIsCreating(false)}
          onSaved={() => {
            setIsCreating(false);
            void load();
          }}
        />
      )}

      {editing && (
        <RecommendationModal
          diseases={treatableDiseases}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </AdminLayout>
  );
}

function DiseaseSelector({
  diseases,
  recommendations,
  onSelect,
}: {
  diseases: DiseaseInfo[];
  recommendations: RecommendationSummary[];
  onSelect: (diseaseId: number) => void;
}) {
  if (diseases.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-16 text-center">
        <p className="text-sm text-gray-500">No diseases in the library yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      {diseases.map((disease) => {
        const count = recommendations.filter((rec) => rec.diseaseId === disease.id).length;
        return (
          <button
            key={disease.id}
            type="button"
            onClick={() => onSelect(disease.id)}
            className="rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-leaf-300 hover:bg-leaf-50"
          >
            <h3 className="text-base font-semibold text-gray-900">{disease.displayName}</h3>
            {disease.scientificName && (
              <p className="mt-0.5 text-xs italic text-gray-500">{disease.scientificName}</p>
            )}
            <p className="mt-3 text-xs font-medium text-leaf-700">
              {count} recommendation{count === 1 ? '' : 's'} →
            </p>
          </button>
        );
      })}
    </div>
  );
}

function RecommendationCard({
  rec,
  onEdit,
  onChanged,
}: {
  rec: RecommendationSummary;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        rec.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
        {!rec.isActive && (
          <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            Inactive
          </span>
        )}
      </div>

      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{rec.recommendationText}</p>
      {rec.applicationMethod && (
        <p className="mt-2 text-xs text-gray-600">
          <span className="font-semibold">Application: </span>
          {rec.applicationMethod}
        </p>
      )}
      {rec.preventiveMeasures && (
        <p className="mt-1 text-xs text-gray-600">
          <span className="font-semibold">Prevention: </span>
          {rec.preventiveMeasures}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onEdit}
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(() =>
              recommendationService.updateRecommendation(rec.id, { isActive: !rec.isActive })
            )
          }
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          {rec.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
        {askDelete ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => recommendationService.deleteRecommendation(rec.id))}
              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              Confirm delete
            </button>
            <button
              type="button"
              onClick={() => setAskDelete(false)}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setAskDelete(true)}
            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function RecommendationModal({
  diseases,
  existing,
  initialDiseaseId,
  onClose,
  onSaved,
}: {
  diseases: DiseaseInfo[];
  existing?: RecommendationSummary;
  /** Pre-selects the disease being viewed when "Add Recommendation" is used from its page. */
  initialDiseaseId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [diseaseId, setDiseaseId] = useState<number>(
    existing?.diseaseId ?? initialDiseaseId ?? diseases[0]?.id ?? 0
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [text, setText] = useState(existing?.recommendationText ?? '');
  const [applicationMethod, setApplicationMethod] = useState(existing?.applicationMethod ?? '');
  const [preventiveMeasures, setPreventiveMeasures] = useState(
    existing?.preventiveMeasures ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!existing && !diseaseId) {
      setError('Pick a disease.');
      return;
    }
    if (title.trim().length < 2 || text.trim().length < 2) {
      setError('A title and the recommendation text are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (existing) {
        await recommendationService.updateRecommendation(existing.id, {
          title: title.trim(),
          recommendationText: text.trim(),
          applicationMethod: applicationMethod.trim(),
          preventiveMeasures: preventiveMeasures.trim(),
        });
      } else {
        await recommendationService.createRecommendation({
          diseaseId,
          title: title.trim(),
          recommendationText: text.trim(),
          applicationMethod: applicationMethod.trim() || undefined,
          preventiveMeasures: preventiveMeasures.trim() || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this recommendation.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {existing ? 'Edit Recommendation' : 'Add Recommendation'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Disease
            </span>
            <select
              value={diseaseId}
              disabled={!!existing}
              onChange={(e) => setDiseaseId(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            >
              {existing ? (
                <option value={existing.diseaseId}>{existing.diseaseName}</option>
              ) : (
                diseases.map((disease) => (
                  <option key={disease.id} value={disease.id}>
                    {disease.displayName}
                  </option>
                ))
              )}
            </select>
          </label>

          <ModalField label="Title" value={title} onChange={setTitle} placeholder="Fungicide Application" />
          <ModalArea
            label="Recommendation text"
            value={text}
            onChange={setText}
            rows={4}
          />
          <ModalArea
            label="Application method (optional)"
            value={applicationMethod}
            onChange={setApplicationMethod}
            rows={2}
          />
          <ModalArea
            label="Preventive measures (optional)"
            value={preventiveMeasures}
            onChange={setPreventiveMeasures}
            rows={2}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-gray-100 px-5 py-4">
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
            {isSaving ? 'Saving…' : existing ? 'Save changes' : 'Add recommendation'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalField({
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

function ModalArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
      />
    </label>
  );
}
