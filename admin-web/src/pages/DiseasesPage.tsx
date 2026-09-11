/**
 * Diseases page for the CAO admin platform.
 *
 * Route: /diseases  (deep-linkable per class: /diseases#gray_leaf_spot)
 *
 * The reference content behind every detection: the four classes the
 * model can output. The four classes themselves are fixed, but the
 * CAO can edit each one's name, description, symptoms and default
 * risk level here (they are stored as data for exactly that reason).
 * Treatment recommendations are managed on the Recommendations page.
 */

import { useEffect, useState } from 'react';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as diseaseService from '../services/disease.service';
import type { DiseaseInfo, RiskLevel } from '../types';

const RISK_BADGE: Record<RiskLevel, string> = {
  none: 'bg-green-50 text-green-700',
  low: 'bg-lime-50 text-lime-700',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

const RISK_LEVELS: RiskLevel[] = ['none', 'low', 'moderate', 'high'];

export function DiseasesPage() {
  const [diseases, setDiseases] = useState<DiseaseInfo[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    diseaseService
      .listDiseases()
      .then((data) => {
        if (!isMounted) return;
        setDiseases(data);
        const hash = window.location.hash.slice(1);
        if (hash) {
          requestAnimationFrame(() => {
            document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiError ? error.message : 'Could not load the disease library.'
          );
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function applyUpdate(updated: DiseaseInfo) {
    setDiseases((list) =>
      list ? list.map((d) => (d.id === updated.id ? updated : d)) : list
    );
    setEditingId(null);
  }

  return (
    <AdminLayout title="Diseases">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {!diseases ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {diseases.map((disease) =>
            editingId === disease.id ? (
              <DiseaseEditCard
                key={disease.id}
                disease={disease}
                onCancel={() => setEditingId(null)}
                onSaved={applyUpdate}
              />
            ) : (
              <DiseaseCard
                key={disease.id}
                disease={disease}
                onEdit={() => setEditingId(disease.id)}
              />
            )
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function DiseaseCard({ disease, onEdit }: { disease: DiseaseInfo; onEdit: () => void }) {
  return (
    <section
      id={disease.classLabel}
      className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
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
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          Edit
        </button>
      </div>

      {disease.scientificName && (
        <p className="mt-0.5 text-sm italic text-gray-500">{disease.scientificName}</p>
      )}
      {disease.description && (
        <p className="mt-3 text-sm text-gray-700">{disease.description}</p>
      )}
      {disease.symptoms && (
        <div className="mt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Symptoms</h3>
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
          <ul className="mt-2 space-y-1.5">
            {disease.treatments.map((treatment) => (
              <li key={treatment.id} className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">{treatment.title}</span> —{' '}
                {treatment.recommendationText}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Add or edit these on the Recommendations page.
        </p>
      </div>
    </section>
  );
}

function DiseaseEditCard({
  disease,
  onCancel,
  onSaved,
}: {
  disease: DiseaseInfo;
  onCancel: () => void;
  onSaved: (updated: DiseaseInfo) => void;
}) {
  const [displayName, setDisplayName] = useState(disease.displayName);
  const [scientificName, setScientificName] = useState(disease.scientificName ?? '');
  const [description, setDescription] = useState(disease.description ?? '');
  const [symptoms, setSymptoms] = useState(disease.symptoms ?? '');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(disease.defaultRiskLevel);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (displayName.trim().length < 2) {
      setError('The disease name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const { disease: updated } = await diseaseService.updateDisease(disease.id, {
        displayName: displayName.trim(),
        scientificName: scientificName.trim(),
        description: description.trim(),
        symptoms: symptoms.trim(),
        defaultRiskLevel: riskLevel,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this disease.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      id={disease.classLabel}
      className="scroll-mt-6 rounded-xl border-2 border-leaf-300 bg-white p-5"
    >
      <div className="space-y-3">
        <EditField label="Display name" value={displayName} onChange={setDisplayName} />
        <EditField
          label="Scientific name"
          value={scientificName}
          onChange={setScientificName}
          placeholder="Puccinia sorghi"
        />
        <EditArea label="Description" value={description} onChange={setDescription} />
        <EditArea label="Symptoms" value={symptoms} onChange={setSymptoms} />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Default risk level
          </span>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize focus:border-leaf-500 focus:outline-none"
          >
            {RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={save}
          className="rounded-lg bg-leaf-600 px-3 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function EditField({
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

function EditArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
      />
    </label>
  );
}
