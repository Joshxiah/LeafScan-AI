/**
 * The pure maths behind scanning a leaf on the phone - no React Native,
 * no native modules, so it can be run and tested anywhere.
 *
 * src/services/onDeviceScan.ts does the phone-specific work (shrinking the
 * photo, running the model). This file is everything that must stay in step
 * with the server (ai-model/service/app.py):
 *
 *   - the "is this even a plant?" colour check (reject_if_not_a_leaf),
 *   - the model input (raw 0-255 pixels - preprocess_input is INSIDE the model),
 *   - how the model's 4 scores become one verdict and a confidence level.
 *
 * If a threshold changes in app.py, change it here too.
 */

import type { ConfidenceLevel } from '../types';

/** The model's input is a square of this many pixels (ai-model/models/labels.json "input_size"). */
export const MODEL_INPUT_SIZE = 224;

// ---- "Is this a plant?" - same numbers as ai-model/service/app.py ----------------------------
// The model only knows 4 corn classes, so a selfie or a black frame would still get a diagnosis.
// These checks turn away photos that clearly are not a leaf BEFORE the model sees them.

/** Least share of plant-coloured pixels a real corn leaf photo has (real leaves >= ~31%, selfies/places <= ~12%). */
const MIN_PLANT_FRACTION = 0.15;
/** Yellow-green to green, in degrees. Beige, skin and wood fall outside it. */
const PLANT_HUE_MIN = 45;
const PLANT_HUE_MAX = 170;
const PLANT_MIN_SATURATION = 0.18;
const PLANT_MIN_VALUE = 0.15;
/**
 * Printed green (packaging, labels, plastic) is cool/emerald and very saturated (hue ~130,
 * saturation ~0.8); a leaf is yellow-green and duller (saturation ~0.3-0.4). A pixel that is
 * BOTH cool-green and this saturated is not counted as plant. A green vinegar pouch went from
 * 23% "plant" to 7% (rejected); real corn leaves moved by <= 0.3 points.
 */
const ARTIFICIAL_GREEN_MIN_HUE = 115;
const ARTIFICIAL_GREEN_MIN_SATURATION = 0.6;
/** Below this the picture is blank / one flat colour (covered lens, black or white frame). */
const MIN_LUMA_STD = 8;

export interface LeafCheck {
  /** False when the photo clearly is not a corn leaf. */
  isLeaf: boolean;
  /** 0-1 share of plant-coloured pixels. */
  plantFraction: number;
  /** Spread of brightness; near 0 means a flat, blank picture. */
  lumaStd: number;
}

/**
 * `rgb` is tightly packed R,G,B bytes (3 per pixel) - the shrunken photo.
 * Mirrors reject_if_not_a_leaf() in app.py, computed on the same 224x224 picture the model sees.
 */
export function checkLooksLikeCornLeaf(rgb: ArrayLike<number>): LeafCheck {
  const pixelCount = Math.floor(rgb.length / 3);
  if (pixelCount === 0) return { isLeaf: false, plantFraction: 0, lumaStd: 0 };

  let plantPixels = 0;
  let lumaSum = 0;
  let lumaSquareSum = 0;

  for (let i = 0; i < pixelCount; i++) {
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];

    // Pillow's convert("L"), whole numbers like the server's.
    const luma = (r * 19595 + g * 38470 + b * 7471 + 32768) >> 16;
    lumaSum += luma;
    lumaSquareSum += luma * luma;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0 || max === min) continue; // black, or grey: no hue, no saturation

    const spread = max - min;

    // The server gets hue and saturation from Pillow's convert("HSV"), which keeps
    // them as whole numbers 0-255, CUT not rounded. Do the same: it moves the edges
    // of the green band by up to a degree, enough to swing a borderline photo.
    const saturation255 = Math.floor((spread * 255) / max);
    if (saturation255 / 255 < PLANT_MIN_SATURATION || max / 255 < PLANT_MIN_VALUE) continue;

    let hue: number;
    if (max === r) hue = ((g - b) / spread) % 6;
    else if (max === g) hue = (b - r) / spread + 2;
    else hue = (r - g) / spread + 4;
    hue /= 6; // 0-1 around the colour wheel
    if (hue < 0) hue += 1;
    const hueDegrees = (Math.floor(hue * 255) * 360) / 255;

    if (hueDegrees < PLANT_HUE_MIN || hueDegrees > PLANT_HUE_MAX) continue;
    if (
      hueDegrees >= ARTIFICIAL_GREEN_MIN_HUE &&
      saturation255 / 255 >= ARTIFICIAL_GREEN_MIN_SATURATION
    ) {
      continue;
    }
    plantPixels++;
  }

  const mean = lumaSum / pixelCount;
  const lumaStd = Math.sqrt(Math.max(0, lumaSquareSum / pixelCount - mean * mean));
  const plantFraction = plantPixels / pixelCount;

  return {
    isLeaf: lumaStd >= MIN_LUMA_STD && plantFraction >= MIN_PLANT_FRACTION,
    plantFraction,
    lumaStd,
  };
}

/**
 * The model wants float32 pixels in 0-255, exactly as they are (NOT divided by 255):
 * preprocess_input is inside the model. Feeding it 0-1 values would quietly give wrong answers.
 */
export function rgbToModelInput(rgb: ArrayLike<number>): Float32Array {
  const input = new Float32Array(rgb.length);
  for (let i = 0; i < rgb.length; i++) input[i] = rgb[i];
  return input;
}

/** Thesis thresholds, the same as the server: Low 0-39%, Moderate 40-69%, High 70-100%. */
export function confidenceLevelFor(confidencePercent: number): ConfidenceLevel {
  if (confidencePercent < 40) return 'low';
  if (confidencePercent < 70) return 'moderate';
  return 'high';
}

export interface TopClass<L extends string> {
  classLabel: L;
  /** 0-100, one decimal place (96.64 -> 96.6) - the same rounding the server's result gets on the phone. */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

/** The highest-scoring class out of the model's softmax scores, in the order of `labels`. */
export function pickTopClass<L extends string>(
  scores: ArrayLike<number>,
  labels: readonly L[]
): TopClass<L> {
  if (scores.length !== labels.length) {
    // A model and a labels file that were exported separately: every answer would be wrong.
    throw new Error(`The model gave ${scores.length} scores but there are ${labels.length} labels.`);
  }

  let best = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[best]) best = i;
  }

  const percent = scores[best] * 100;
  return {
    classLabel: labels[best],
    confidence: Math.round(percent * 10) / 10,
    confidenceLevel: confidenceLevelFor(percent),
  };
}
