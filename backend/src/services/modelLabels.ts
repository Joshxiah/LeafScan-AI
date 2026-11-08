/**
 * Reads labels.json, the file that ships with the AI model
 * (ai-model/models/labels.json; env AI_LABELS_PATH overrides the location).
 *
 * It is the one place that says which model is deployed and which classes it
 * has, so detections.model_version and the stale-service check both read it
 * from here. It is a ~1 KB file and is read on every scan, so swapping the
 * model needs no backend restart.
 */

import fs from 'fs/promises';
import { env } from '../config/env';

export interface ModelLabels {
  /** "model_version", e.g. "mobilenetv2-5class"; null when the file has none. */
  modelVersion: string | null;
  /** "class_labels", in the model's output order. Empty when the file lists none. */
  classLabels: string[];
}

// Say it once, not on every scan, when the file cannot be read.
let hasWarned = false;

/** null when labels.json cannot be read (e.g. the backend runs without the ai-model folder). */
export async function readModelLabels(): Promise<ModelLabels | null> {
  try {
    const file = JSON.parse(await fs.readFile(env.aiLabelsPath, 'utf8')) as {
      model_version?: unknown;
      class_labels?: unknown;
    };

    const version = typeof file.model_version === 'string' ? file.model_version.trim() : '';

    return {
      // detections.model_version is VARCHAR(50).
      modelVersion: version ? version.slice(0, 50) : null,
      classLabels: Array.isArray(file.class_labels)
        ? file.class_labels.filter((label): label is string => typeof label === 'string')
        : [],
    };
  } catch (error) {
    if (!hasWarned) {
      hasWarned = true;
      console.error(
        `[model] Could not read ${env.aiLabelsPath} - model_version will be NULL and the ` +
          'stale-AI-service check is skipped. Set AI_LABELS_PATH if the file lives elsewhere.',
        error
      );
    }
    return null;
  }
}
