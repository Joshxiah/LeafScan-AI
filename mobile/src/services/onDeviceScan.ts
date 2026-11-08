/**
 * Scans a corn leaf ON THE PHONE, with no internet.
 *
 * The same MobileNetV2 model the server runs (ai-model/models/leafscan_mobilenetv2.tflite)
 * is bundled in the app (assets/models/) and run by react-native-fast-tflite. The photo is
 * handled the way the server handles it, so the two give the same answer:
 *
 *   photo -> shrink to 224x224 (plain bilinear, no crop) -> "is this a plant?" colour
 *   check -> raw 0-255 pixels -> model -> top class + confidence.
 *
 * The shrunken picture is handed over as a PNG, not a JPEG: PNG is lossless, so the
 * pixels the model sees are exactly the ones the shrink produced. (A JPEG round trip
 * nudged confidences by up to ~5 points in testing and could tip the colour check.)
 *
 * The plain (non-antialiased) bilinear shrink matters: it is what the model was trained
 * with. A smoothed shrink flips the answer on some photos. Android's
 * Bitmap.createScaledBitmap(filter = true), which expo-image-manipulator uses, is that.
 *
 * Only the DISPLAYED result comes from here. The server still classifies the same photo
 * itself once the phone is online, and that is the record the CAO sees.
 *
 * Needs a development / EAS build: the model runs in a native module, which Expo Go and
 * the web do not have. There OnDeviceModelUnavailableError is thrown and the caller falls
 * back to saving the photo for the server to scan later.
 */

import { Platform } from 'react-native';
import { File as LocalFile } from 'expo-file-system';
import * as UPNG from 'upng-js';
import type { TensorflowModel } from 'react-native-fast-tflite';

import { ApiError } from './api';
import { ScanClassLabel } from '../data/scanStats';
import { ConfidenceLevel } from '../types';
import {
  MODEL_INPUT_SIZE,
  checkLooksLikeCornLeaf,
  pickTopClass,
  rgbToModelInput,
} from '../utils/leafVision';
import labelsFile from '../../assets/models/labels.json';

/** What the phone's own scan comes up with. Same fields the server's result has, minus anything the server decides. */
export interface OnDeviceVerdict {
  classLabel: ScanClassLabel;
  /** 0-100, one decimal place. */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

/** Thrown when this build has no on-device model (Expo Go, web, or the model failed to load). */
export class OnDeviceModelUnavailableError extends Error {
  constructor(reason: string) {
    super(`The on-device model is not available: ${reason}`);
    this.name = 'OnDeviceModelUnavailableError';
  }
}

/**
 * Everything the model can answer: the 4 corn classes plus "not_corn". `ScanClassLabel`
 * stays the 4 real classes because those are the only ones a result screen, the history or
 * the queue ever holds - "not_corn" is turned into a NOT_CORN error before it gets that far.
 */
type ModelLabel = ScanClassLabel | 'not_corn';

// Same order as the model's outputs (assets/models/labels.json, a copy of
// ai-model/models/labels.json): indexes 0-3 are the corn classes, index 4 is "not_corn".
const CLASS_LABELS = labelsFile.class_labels as readonly ModelLabel[];

interface Runtime {
  model: TensorflowModel;
  manipulator: typeof import('expo-image-manipulator');
}

let runtime: Promise<Runtime> | null = null;

function loadRuntime(): Promise<Runtime> {
  if (!runtime) {
    runtime = (async (): Promise<Runtime> => {
      if (Platform.OS === 'web') throw new OnDeviceModelUnavailableError('web');

      // Required here, not imported at the top, so a build without the native
      // module (Expo Go) fails only this call instead of crashing the whole app.
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { loadTensorflowModel } =
        require('react-native-fast-tflite') as typeof import('react-native-fast-tflite');
      const manipulator =
        require('expo-image-manipulator') as typeof import('expo-image-manipulator');
      const modelAsset = require('../../assets/models/leafscan_mobilenetv2.tflite');
      /* eslint-enable @typescript-eslint/no-require-imports */

      const model = await loadTensorflowModel(modelAsset);

      const inputShape = model.inputs[0]?.shape ?? [];
      const outputSize = model.outputs[0]?.shape.at(-1);
      if (
        model.inputs[0]?.dataType !== 'float32' ||
        model.outputs[0]?.dataType !== 'float32' ||
        inputShape.length !== 4 ||
        inputShape[1] !== MODEL_INPUT_SIZE ||
        inputShape[2] !== MODEL_INPUT_SIZE ||
        inputShape[3] !== 3 ||
        outputSize !== CLASS_LABELS.length
      ) {
        throw new Error(
          `Unexpected model: input [${inputShape}], ${outputSize} outputs for ${CLASS_LABELS.length} labels.`
        );
      }

      return { model, manipulator };
    })().catch((error: unknown) => {
      runtime = null; // let the next scan try again
      throw error instanceof OnDeviceModelUnavailableError
        ? error
        : new OnDeviceModelUnavailableError(error instanceof Error ? error.message : String(error));
    });
  }
  return runtime;
}

/** Whether this kind of build can scan on the phone at all (cheap; does not load the model). */
export function isOnDeviceScanSupported(): boolean {
  return Platform.OS !== 'web';
}

/** Loads the model in the background so the first scan does not wait for it. Never throws. */
export function warmUpOnDeviceModel(): void {
  if (isOnDeviceScanSupported()) loadRuntime().catch(() => {});
}

/**
 * Shrinks the photo to the model's 224x224 and returns its pixels as packed R,G,B bytes.
 * Saved as PNG (lossless) and decoded here - there is no way to read pixels out of a
 * file directly in React Native.
 */
async function readModelPixels(
  manipulator: Runtime['manipulator'],
  imageUri: string
): Promise<Uint8Array> {
  const context = manipulator.ImageManipulator.manipulate(imageUri);
  let shrunkUri: string | undefined;
  try {
    context.resize({ width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: manipulator.SaveFormat.PNG });
    shrunkUri = saved.uri;
    image.release();

    const bytes = await new LocalFile(saved.uri).bytes();
    const png = UPNG.decode(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    );
    if (png.width !== MODEL_INPUT_SIZE || png.height !== MODEL_INPUT_SIZE) {
      throw new Error(`Unexpected picture size ${png.width}x${png.height}.`);
    }

    // Always 4 bytes per pixel (R,G,B,A), whatever the PNG was stored as. The model has
    // no alpha, so drop it - the same as the server's convert("RGB").
    const rgba = new Uint8Array(UPNG.toRGBA8(png)[0]);
    const rgb = new Uint8Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
    for (let pixel = 0, from = 0, to = 0; pixel < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; pixel++) {
      rgb[to++] = rgba[from++];
      rgb[to++] = rgba[from++];
      rgb[to++] = rgba[from++];
      from++; // alpha
    }
    return rgb;
  } finally {
    context.release();
    if (shrunkUri) {
      try {
        new LocalFile(shrunkUri).delete();
      } catch {
        // A leftover cache file is harmless.
      }
    }
  }
}

/**
 * Classifies the photo at `imageUri` (a local file) without any network.
 *
 * Throws ApiError(422, 'NOT_A_CORN_LEAF') for a photo that clearly is not a leaf (colour
 * check), and ApiError(422, 'NOT_CORN') when the model itself answers "not_corn" - the same
 * two errors the server gives, so the screens already know how to show them.
 * Throws OnDeviceModelUnavailableError when this build cannot scan on the phone.
 */
export async function classifyOnDevice(imageUri: string): Promise<OnDeviceVerdict> {
  const { model, manipulator } = await loadRuntime();

  const pixels = await readModelPixels(manipulator, imageUri);

  const leaf = checkLooksLikeCornLeaf(pixels);
  if (!leaf.isLeaf) {
    console.log(
      `[onDeviceScan] Not a leaf: plant=${(leaf.plantFraction * 100).toFixed(1)}% lumaStd=${leaf.lumaStd.toFixed(1)}`
    );
    throw new ApiError(
      422,
      'This does not look like a corn leaf. Please take a clear photo of a corn leaf.',
      'NOT_A_CORN_LEAF'
    );
  }

  const outputs = await model.run([rgbToModelInput(pixels)]);
  // float32 output - checked when the model was loaded.
  const scores = outputs[0] as Float32Array | undefined;
  if (!scores) throw new Error('The model returned no result.');

  const top = pickTopClass(scores, CLASS_LABELS);

  // The model's own "not corn" answer is the same outcome as the server's, so it is thrown
  // the same way (ApiError 422 NOT_CORN): Preview shows the "Not a Corn Leaf" screen, and
  // because this throws BEFORE the caller queues anything, nothing is saved to the history or
  // to the upload queue.
  if (top.classLabel === 'not_corn') {
    throw new ApiError(
      422,
      'This does not look like a corn leaf. Please take a clear photo of a corn leaf.',
      'NOT_CORN'
    );
  }

  // TypeScript has narrowed top.classLabel to the 4 corn classes by here.
  return {
    classLabel: top.classLabel,
    confidence: top.confidence,
    confidenceLevel: top.confidenceLevel,
  };
}
