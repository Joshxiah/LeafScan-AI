"""
LeafScan AI - Prediction Service (Phase 12)

Usa ra ang trabaho niini:
  dawaton ang corn leaf image -> MobileNetV2 -> ibalik ang disease + confidence.

DILI kini mohatag og treatment recommendation o risk level.
Kana gikan sa MySQL (CAO-managed) pinaagi sa Express backend.
"""

import io
import json
import os
import time
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

# ---------------------------------------------------------------------------
# 1. Mga path ug settings
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent          # ai-model/
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "leafscan_mobilenetv2.keras"
LABELS_PATH = MODELS_DIR / "labels.json"

MAX_IMAGE_BYTES = 10 * 1024 * 1024                          # 10 MB
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

# "Dahon ba kini?" check (tan-awa ang reject_if_not_a_leaf). Gi-calibrate sa tinuod nga
# corn leaf photos (min ~31% tanom-kolor) batok sa selfie/lugar/screenshot (max ~12%).
# Ibutang ang LEAFSCAN_MIN_PLANT_FRACTION=0 aron i-off ang kolor check.
MIN_PLANT_FRACTION = float(os.environ.get("LEAFSCAN_MIN_PLANT_FRACTION", "0.15"))
PLANT_HUE_DEGREES = (45, 170)   # dilaw-berde ngadto sa berde; gawas ang beige/skin/kahoy
PLANT_MIN_SATURATION = 0.18
PLANT_MIN_VALUE = 0.15
# Ang berde nga naimprenta (packaging, label, plastik) sobra ka-saturated ug cool/emerald
# (hue ~130, saturation ~0.8), dili parehas sa dahon (dilaw-berde, saturation ~0.3-0.4).
# Dili ihilot sa "tanom-kolor" ang pixel nga cool-green ug saturated na kaayo. Gipakita sa
# usa ka berde nga suka-pouch: 23% tanom-kolor -> 7% human sa pagtangtang, mao nga na-reject
# na; ang tinuod nga corn leaf nausab ra og <= 0.3 ka puntos. (Ibutang ang parehas nga numero
# sa mobile/src/utils/leafVision.ts.)
ARTIFICIAL_GREEN_MIN_HUE = 115
ARTIFICIAL_GREEN_MIN_SATURATION = 0.60
MIN_LUMA_STD = 8.0              # ubos aniini = blangko/solid nga hulagway

# ---------------------------------------------------------------------------
# 2. Basaha ang labels.json (ang contract gikan sa Colab export)
# ---------------------------------------------------------------------------
with open(LABELS_PATH, encoding="utf-8") as f:
    META = json.load(f)

CLASS_LABELS = META["class_labels"]       # gikan ra sa labels.json; ang han-ay = han-ay sa output sa model (karon 5, apil ang not_corn)
IMG_H, IMG_W = META["input_size"]         # 224, 224

if META.get("input_range") != "raw_0_255":
    raise RuntimeError(
        "labels.json says the model does not expect raw 0-255 pixels. "
        "This service would feed it the wrong values - stop and check the export."
    )

# ---------------------------------------------------------------------------
# 3. I-load ang model KAUSA ra sa pagsugod (dili kada request)
# ---------------------------------------------------------------------------
print(f"[LeafScan AI] Loading model: {MODEL_PATH.name} ...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

if model.output_shape[-1] != len(CLASS_LABELS):
    raise RuntimeError(
        f"Model has {model.output_shape[-1]} outputs but labels.json has "
        f"{len(CLASS_LABELS)} classes."
    )

# Warm-up: ang una nga prediction kanunay hinay, mao nga buhaton nato dinhi
model(np.zeros((1, IMG_H, IMG_W, 3), dtype=np.float32), training=False)
print(f"[LeafScan AI] Model ready. Classes: {CLASS_LABELS}")


# ---------------------------------------------------------------------------
# 4. Helper functions
# ---------------------------------------------------------------------------
def get_confidence_level(confidence_pct: float) -> str:
    """Thesis thresholds: Low 0-39%, Moderate 40-69%, High 70-100%."""
    if confidence_pct < 40:
        return "Low"
    if confidence_pct < 70:
        return "Moderate"
    return "High"


def reject_if_not_a_leaf(img: Image.Image) -> None:
    """
    Sa dili pa ang 5-class model (walay not_corn), kinahanglan mopili ang model og usa sa
    4 ka sakit bisan unsa pa ang litrato, mao nga ang selfie o itom nga frame mahimong
    "Healthy 53%". Gisala-an gihapon dinhi ang mga litrato nga klaro nga dili dahon, SA DILI
    pa moabot sa model:
      - blangko/solid nga hulagway (natabunan ang lens, itom, puti)
      - kulang ang kolor sa tanom (dilaw-berde ngadto sa berde)

    Heuristic ra kini: dili niini madakpan ang berde nga dili corn (ubang tanom, bungbong) -
    kana na ang trabaho sa "not_corn" nga klase sa model (ibalik sa /predict isip class_label).
    """
    small = img.resize((IMG_W, IMG_H))
    luma_std = float(np.asarray(small.convert("L"), dtype=np.float32).std())

    hsv = np.asarray(small.convert("HSV"), dtype=np.float32)
    hue = hsv[..., 0] * 360.0 / 255.0
    sat = hsv[..., 1] / 255.0
    val = hsv[..., 2] / 255.0
    plant = (
        (hue >= PLANT_HUE_DEGREES[0])
        & (hue <= PLANT_HUE_DEGREES[1])
        & (sat >= PLANT_MIN_SATURATION)
        & (val >= PLANT_MIN_VALUE)
        & ~((hue >= ARTIFICIAL_GREEN_MIN_HUE) & (sat >= ARTIFICIAL_GREEN_MIN_SATURATION))
    )
    plant_fraction = float(plant.mean())

    if luma_std < MIN_LUMA_STD or plant_fraction < MIN_PLANT_FRACTION:
        print(f"[LeafScan AI] Rejected as not a leaf: plant={plant_fraction:.1%} luma_std={luma_std:.1f}")
        # 422 + code: ang Express mosusi sa code, dili sa status (ang FastAPI mismo mo-422 usab).
        raise HTTPException(
            status_code=422,
            detail={
                "code": "NOT_A_CORN_LEAF",
                "message": "This does not look like a corn leaf. Please take a clear photo of a corn leaf.",
            },
        )


def preprocess(raw_bytes: bytes) -> np.ndarray:
    """
    Andama ang hulagway PAREHO sa training:
      - RGB, 224x224, bilinear resize, walay crop
      - RAW 0-255 pixels (ang preprocess_input naa na SULOD sa model)
    """
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        image_format = img.format
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")

    if image_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image format '{image_format}'. Use JPEG, PNG, or WEBP.",
        )

    # Ang mga litrato sa cellphone usahay naay EXIF rotation - i-straighten
    img = ImageOps.exif_transpose(img).convert("RGB")
    reject_if_not_a_leaf(img)

    # uint8 ang i-pasa, DILI float32: ang bilinear resize mismo mo-convert ngadto sa float32
    # (parehas ra gyud ang resulta), pero ang float32 nga kopya sa 12MP nga litrato kay
    # 140 MB (ug usa pa ka kopya sulod sa TensorFlow) - mapakyas kini sa PC nga gamay ang libre nga memory.
    arr = np.asarray(img)
    # Parehas nga resize method sa image_dataset_from_directory sa training
    arr = tf.image.resize(arr, (IMG_H, IMG_W), method="bilinear").numpy()
    return np.expand_dims(arr, axis=0)       # shape: (1, 224, 224, 3)


# ---------------------------------------------------------------------------
# 5. FastAPI app ug endpoints
# ---------------------------------------------------------------------------
app = FastAPI(title="LeafScan AI Prediction Service", version="1.0.0")


@app.get("/health") 
def health():
    return {
        "status": "ok",
        "model": MODEL_PATH.name,
        "classes": CLASS_LABELS,
        "input_size": [IMG_H, IMG_W],
    }


@app.post("/predict")
def predict(image: UploadFile = File(...)):
    # Ang field name 'image' parehas sa multer .single('image') sa Express
    raw = image.file.read(MAX_IMAGE_BYTES + 1)

    if not raw:
        raise HTTPException(status_code=400, detail="No image data received.")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large. Maximum size is 10 MB.")

    x = preprocess(raw)

    start = time.perf_counter()
    try:
        probs = model(x, training=False).numpy()[0]
    except Exception:
        raise HTTPException(status_code=500, detail="AI prediction failed.")
    inference_ms = (time.perf_counter() - start) * 1000

    top_index = int(np.argmax(probs))
    confidence = round(float(probs[top_index]) * 100, 2)

    return {
        "class_label": CLASS_LABELS[top_index],
        "confidence": confidence,
        "confidence_level": get_confidence_level(confidence),
        "probabilities": {
            label: round(float(p) * 100, 2) for label, p in zip(CLASS_LABELS, probs)
        },
        "inference_ms": round(inference_ms, 1),
        "model": MODEL_PATH.name,
    }