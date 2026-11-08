/**
 * Client for the Python AI prediction service (Phase 12/13).
 *
 * Express never classifies a leaf itself: it reads the uploaded photo
 * from disk, sends it to the Python service's POST /predict, and hands
 * the verdict back to the caller. Uses only Node's built-in fetch,
 * FormData and Blob, so there is no extra package to install.
 */

import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { describeLabelMismatch } from '../utils/labelMismatch';
import { readModelLabels } from './modelLabels';

/**
 * Every class the model can answer with, spelled exactly as in labels.json.
 * Always compare the label string, never its position in the model's output.
 *
 * The first four are diseases.class_label values. "not_corn" is the model's
 * rejection class: it has no row in `diseases` and is never saved as a scan -
 * POST /api/detections/scan answers 422 NOT_CORN for it (detection.controller.ts).
 */
export const CLASS_LABELS = [
  'southern_rust',
  'gray_leaf_spot',
  'healthy',
  'northern_leaf_blight',
  'not_corn',
] as const;

export type ClassLabel = (typeof CLASS_LABELS)[number];
export type ConfidenceLevel = 'low' | 'moderate' | 'high';

export interface AiPrediction {
  classLabel: ClassLabel;
  /** 0-100 */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  /** Per-class percentages, keyed by class label. */
  probabilities: Record<string, number>;
  inferenceMs: number;
  /** Model name/version reported by the Python service. */
  model: string;
}

/** The raw JSON the Python service returns. */
interface PythonPrediction {
  class_label?: unknown;
  confidence?: unknown;
  confidence_level?: unknown;
  probabilities?: unknown;
  inference_ms?: unknown;
  model?: unknown;
}

const UNAVAILABLE_MESSAGE = 'AI service is unavailable, please try again';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/** ApiError.code when the photo is readable but is not a corn leaf. */
const NOT_A_CORN_LEAF = 'NOT_A_CORN_LEAF';

/**
 * Pulls a readable message (and the machine-readable code, if the
 * Python service set one) out of a Python error body. FastAPI sends
 * { detail: "text" } or { detail: { code, message } } for errors we
 * raise and { detail: [ {msg}, ... ] } for its own validation failures.
 */
async function readErrorDetail(
  response: Response
): Promise<{ message: string; code?: string }> {
  const fallback = { message: 'The image could not be processed' };

  try {
    const body = (await response.json()) as { detail?: unknown };

    if (typeof body.detail === 'string' && body.detail.trim()) {
      return { message: body.detail };
    }

    if (body.detail && typeof body.detail === 'object' && !Array.isArray(body.detail)) {
      const { code, message } = body.detail as { code?: unknown; message?: unknown };
      if (typeof message === 'string' && message.trim()) {
        return { message, code: typeof code === 'string' ? code : undefined };
      }
    }

    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => (item && typeof (item as { msg?: unknown }).msg === 'string' ? (item as { msg: string }).msg : ''))
        .filter(Boolean);
      if (messages.length > 0) return { message: messages.join('; ') };
    }
  } catch {
    // Body was not JSON - use the fallback.
  }

  return fallback;
}

/** Checks the Python reply has the shape we rely on, and converts it to camelCase. */
function parsePrediction(raw: PythonPrediction): AiPrediction {
  const { class_label, confidence, probabilities, inference_ms, model } = raw;
  // The Python service capitalises the level ("High"); we store it lowercase.
  const confidence_level =
    typeof raw.confidence_level === 'string' ? raw.confidence_level.toLowerCase() : undefined;

  if (
    typeof class_label !== 'string' ||
    !(CLASS_LABELS as readonly string[]).includes(class_label) ||
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    (confidence_level !== 'low' && confidence_level !== 'moderate' && confidence_level !== 'high') ||
    typeof probabilities !== 'object' ||
    probabilities === null
  ) {
    throw new ApiError(502, 'AI service returned an unexpected response', 'AI_BAD_RESPONSE');
  }

  return {
    classLabel: class_label as ClassLabel,
    confidence,
    confidenceLevel: confidence_level,
    probabilities: probabilities as Record<string, number>,
    inferenceMs: typeof inference_ms === 'number' ? inference_ms : 0,
    model: typeof model === 'string' ? model : '',
  };
}

/**
 * The Python service loads its model once, at startup. If the model files are
 * swapped while it keeps running, it goes on answering with the OLD classes -
 * a 4-class model cannot say "not_corn", so a photo of a park comes back as
 * "Healthy 98%" and would be saved. Its reply lists every class it scored
 * (`probabilities`); when that differs from labels.json the scan is refused:
 * 503 AI_UNAVAILABLE (the phone already has a message for it, and its offline
 * queue keeps the photo and retries), nothing saved, the photo kept. The real
 * reason goes to the server log. With no readable labels.json there is
 * nothing to compare against, so the check is skipped.
 */
async function assertServiceMatchesLabels(probabilities: Record<string, number>): Promise<void> {
  const expected = await readModelLabels();
  if (!expected || expected.classLabels.length === 0) return;

  const problem = describeLabelMismatch(Object.keys(probabilities), expected.classLabels);
  if (!problem) return;

  console.error(
    `[ai] Scan refused. ${problem}. Restart the Python service (ai-model/service) so it loads the current model.`
  );
  throw ApiError.serviceUnavailable(UNAVAILABLE_MESSAGE, 'AI_UNAVAILABLE');
}

/**
 * Sends the image at `absoluteFilePath` to the Python service and
 * returns its prediction.
 *
 * Errors:
 *   - service down / unreachable / timed out -> 503
 *   - service still running a different model than labels.json describes -> 503 AI_UNAVAILABLE
 *   - Python says the photo is not a corn leaf -> 422 NOT_A_CORN_LEAF
 *   - the model answers class_label "not_corn" -> NOT an error here: it comes back as a
 *     normal prediction, and the scan controller turns it into 422 NOT_CORN
 *   - Python answers any other 4xx (e.g. not a valid image) -> 400 with its message
 *   - Python answers 5xx or garbage -> 502
 */
export async function predictLeaf(absoluteFilePath: string): Promise<AiPrediction> {
  const fileBytes = await fs.readFile(absoluteFilePath);
  const extension = path.extname(absoluteFilePath).toLowerCase();
  const mimeType = MIME_TYPES[extension] ?? 'application/octet-stream';

  const form = new FormData();
  form.append('image', new Blob([fileBytes], { type: mimeType }), path.basename(absoluteFilePath));

  let response: Response;

  try {
    response = await fetch(`${env.aiServiceUrl}/predict`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(env.aiServiceTimeoutMs),
    });
  } catch (error) {
    // Timeout (TimeoutError) or connection refused / DNS / reset (TypeError "fetch failed").
    console.error('AI service request failed:', error);
    throw ApiError.serviceUnavailable(UNAVAILABLE_MESSAGE, 'AI_UNAVAILABLE');
  }

  if (response.status >= 400 && response.status < 500) {
    const { message, code } = await readErrorDetail(response);
    if (code === NOT_A_CORN_LEAF) {
      throw new ApiError(422, message, NOT_A_CORN_LEAF);
    }
    throw ApiError.badRequest(message, 'AI_REJECTED_IMAGE');
  }

  if (!response.ok) {
    console.error(`AI service answered ${response.status}`);
    throw new ApiError(502, 'AI service returned an error', 'AI_BAD_GATEWAY');
  }

  let body: PythonPrediction;

  try {
    body = (await response.json()) as PythonPrediction;
  } catch {
    throw new ApiError(502, 'AI service returned an unexpected response', 'AI_BAD_RESPONSE');
  }

  const prediction = parsePrediction(body);
  await assertServiceMatchesLabels(prediction.probabilities);
  return prediction;
}
