"""
LeafScan AI - Prediction Service (Phase 12)

Usa ra ang trabaho niini:
  dawaton ang corn leaf image -> MobileNetV2 -> ibalik ang disease + confidence.

DILI kini mohatag og treatment recommendation o risk level.
Kana gikan sa MySQL (CAO-managed) pinaagi sa Express backend.
"""

import io
import json
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

# ---------------------------------------------------------------------------
# 2. Basaha ang labels.json (ang contract gikan sa Colab export)
# ---------------------------------------------------------------------------
with open(LABELS_PATH, encoding="utf-8") as f:
    META = json.load(f)

CLASS_LABELS = META["class_labels"]       # southern_rust, gray_leaf_spot, healthy, northern_leaf_blight
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

    arr = np.asarray(img, dtype=np.float32)
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