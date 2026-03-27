"""
Aegis.ai — classifier.py
ML inference engine.
- Loads model.pkl + vectorizer.pkl ONCE at startup (cached in module globals)
- Exposes classify(prompt) → (label, confidence)
- Preprocessing mirrors train_model.py exactly
"""

import os
import pickle
import re
from typing import Tuple

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# ─── NLTK setup ───────────────────────────────────────────────────────────────
for _pkg in ["stopwords", "wordnet", "omw-1.4"]:
    nltk.download(_pkg, quiet=True)

_lemmatizer = WordNetLemmatizer()
_STOP_WORDS = set(stopwords.words("english"))

# Keep all words that carry adversarial signal
_SECURITY_PRESERVE = {
    "ignore", "forget", "override", "bypass", "inject", "previous",
    "instructions", "system", "prompt", "above", "below", "instead",
    "pretend", "act", "role", "jailbreak", "dan", "sudo", "admin",
    "disregard", "replace", "simulate", "execute", "eval", "run",
}
_STOP_WORDS -= _SECURITY_PRESERVE

# ─── Model paths (from env or default) ────────────────────────────────────────
_BASE_DIR       = os.path.dirname(__file__)
_MODEL_PATH     = os.getenv("MODEL_PATH",      os.path.join(_BASE_DIR, "model", "model.pkl"))
_VECTORIZER_PATH= os.getenv("VECTORIZER_PATH", os.path.join(_BASE_DIR, "model", "vectorizer.pkl"))

# ─── Module-level singletons (loaded once) ────────────────────────────────────
_pipeline:   object = None
_threshold:  float  = 0.5
_vectorizer: object = None
_loaded:     bool   = False


def load_model() -> bool:
    """
    Load model.pkl and vectorizer.pkl into module globals.
    Called once at FastAPI startup. Returns True on success.
    """
    global _pipeline, _threshold, _vectorizer, _loaded
    try:
        with open(_MODEL_PATH, "rb") as f:
            obj = pickle.load(f)
        _pipeline  = obj["pipeline"]
        _threshold = obj["threshold"]

        with open(_VECTORIZER_PATH, "rb") as f:
            _vectorizer = pickle.load(f)

        _loaded = True
        print(f"[classifier] ✅ Model loaded  | threshold={_threshold:.2f}")
        print(f"[classifier] ✅ Vectorizer loaded")
        return True

    except FileNotFoundError as e:
        print(f"[classifier] ❌ File not found: {e}")
        return False
    except Exception as e:
        print(f"[classifier] ❌ Failed to load model: {e}")
        return False


def is_loaded() -> bool:
    return _loaded


def _preprocess(text: str) -> str:
    """Lowercase → strip non-alpha → tokenize → remove stops → lemmatize."""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = text.split()
    tokens = [
        _lemmatizer.lemmatize(t)
        for t in tokens
        if t not in _STOP_WORDS and len(t) > 1
    ]
    return " ".join(tokens)


def classify(prompt: str) -> Tuple[str, float]:
    """
    Classify a raw prompt string.

    Returns:
        (label, confidence)
        label      : "SAFE" | "MALICIOUS"
        confidence : float 0.0–1.0  (probability of the predicted class)

    Raises:
        RuntimeError if model is not loaded.
    """
    if not _loaded:
        raise RuntimeError("Model is not loaded. Call load_model() first.")

    cleaned = _preprocess(prompt)
    # predict_proba → [P(SAFE), P(MALICIOUS)]
    probs = _pipeline.predict_proba([cleaned])[0]
    p_malicious = float(probs[1])

    if p_malicious >= _threshold:
        return "MALICIOUS", round(p_malicious, 4)
    else:
        return "SAFE", round(float(probs[0]), 4)
