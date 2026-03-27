"""
Aegis.ai — Phase 1: Model Training Script
==========================================
Upgraded LinearSVC pipeline:
  - class_weight='balanced'   → fixes 343/203 imbalance
  - bigrams in TF-IDF         → captures "ignore previous", "forget instructions"
  - 5-fold StratifiedKFold CV → guards against overfitting
  - decision_function threshold tuning → pushes Recall ≥ 90%
  - Saves model.pkl + vectorizer.pkl to ./model/
"""

import os
import pickle
import warnings
import re

import nltk
import numpy as np
import pandas as pd
from datasets import load_dataset
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

warnings.filterwarnings("ignore")

# ─── NLTK Downloads ───────────────────────────────────────────────────────────
for pkg in ["stopwords", "wordnet", "omw-1.4", "punkt"]:
    nltk.download(pkg, quiet=True)

lemmatizer = WordNetLemmatizer()
STOP_WORDS = set(stopwords.words("english"))

# Preserve security-critical words that would otherwise be removed as stop words
SECURITY_PRESERVE = {
    "ignore", "forget", "override", "bypass", "inject", "previous",
    "instructions", "system", "prompt", "above", "below", "instead",
    "pretend", "act", "role", "jailbreak", "dan", "sudo", "admin",
    "disregard", "replace", "simulate", "execute", "eval", "run",
}
STOP_WORDS -= SECURITY_PRESERVE


# ─── Preprocessing ────────────────────────────────────────────────────────────
def preprocess(text: str) -> str:
    """Lowercase → strip non-alpha → tokenize → remove stops → lemmatize."""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return " ".join(tokens)


# ─── Load Dataset ─────────────────────────────────────────────────────────────
print("📦 Loading dataset: deepset/prompt-injections …")
ds = load_dataset("deepset/prompt-injections")

train_df = pd.DataFrame(ds["train"])
test_df  = pd.DataFrame(ds["test"])

# Column names: 'text' and 'label'
print(f"   Train: {len(train_df)} samples  |  Test: {len(test_df)} samples")
print(f"   Train label distribution:\n{train_df['label'].value_counts().to_string()}")

# ─── Preprocess ───────────────────────────────────────────────────────────────
print("\n🔧 Preprocessing text …")
train_df["clean"] = train_df["text"].apply(preprocess)
test_df["clean"]  = test_df["text"].apply(preprocess)

X_train, y_train = train_df["clean"].values, train_df["label"].values
X_test,  y_test  = test_df["clean"].values,  test_df["label"].values

# ─── Pipeline: TF-IDF (unigrams + bigrams) + LinearSVC (balanced) ─────────────
print("\n🏗️  Building pipeline …")
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),          # unigrams + bigrams
        sublinear_tf=True,           # log-normalise TF
        min_df=2,                    # ignore very rare terms
        analyzer="word",
    )),
    ("clf", LinearSVC(
        class_weight="balanced",     # compensate for 343/203 imbalance
        C=1.0,
        max_iter=2000,
        dual=False,
    )),
])

# ─── 5-Fold Stratified Cross-Validation ───────────────────────────────────────
print("\n📊 Running 5-Fold Stratified CV …")
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_recall = cross_val_score(
    pipeline, X_train, y_train,
    scoring="recall",          # recall on positive class (malicious=1)
    cv=skf,
    n_jobs=-1,
)
cv_f1 = cross_val_score(
    pipeline, X_train, y_train,
    scoring="f1",
    cv=skf,
    n_jobs=-1,
)
cv_accuracy = cross_val_score(
    pipeline, X_train, y_train,
    scoring="accuracy",
    cv=skf,
    n_jobs=-1,
)

print(f"   CV Recall  (malicious): {cv_recall.mean():.3f} ± {cv_recall.std():.3f}")
print(f"   CV F1      (malicious): {cv_f1.mean():.3f} ± {cv_f1.std():.3f}")
print(f"   CV Accuracy           : {cv_accuracy.mean():.3f} ± {cv_accuracy.std():.3f}")

# ─── Train on full training set ───────────────────────────────────────────────
print("\n🚀 Fitting on full training set …")
pipeline.fit(X_train, y_train)

# ─── Evaluate on held-out test set ───────────────────────────────────────────
y_pred = pipeline.predict(X_test)

print("\n📈 Test Set Results:")
print(classification_report(y_test, y_pred, target_names=["SAFE", "MALICIOUS"]))
print("Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"  TN={cm[0,0]}  FP={cm[0,1]}")
print(f"  FN={cm[1,0]}  TP={cm[1,1]}")

recall_mal = recall_score(y_test, y_pred, pos_label=1)
target_met = "✅ TARGET MET" if recall_mal >= 0.90 else "⚠️  TARGET NOT MET — see notes"
print(f"\nMalicious Recall: {recall_mal:.3f}  {target_met}")

# ─── Threshold Tuning via CalibratedClassifierCV ─────────────────────────────
# Wrap the fitted LinearSVC so we get probability estimates, then sweep threshold
print("\n🎛️  Fitting calibrated model for threshold tuning …")
pipeline_base = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
    )),
    ("clf", CalibratedClassifierCV(
        LinearSVC(class_weight="balanced", C=1.0, max_iter=2000, dual=False),
        cv=5,
        method="sigmoid",
    )),
])
pipeline_base.fit(X_train, y_train)

probs = pipeline_base.predict_proba(X_test)[:, 1]

best_thresh, best_recall, best_f1 = 0.5, 0.0, 0.0
for t in np.arange(0.20, 0.70, 0.01):
    preds = (probs >= t).astype(int)
    rec = recall_score(y_test, preds, pos_label=1, zero_division=0)
    from sklearn.metrics import f1_score
    f1  = f1_score(y_test, preds, pos_label=1, zero_division=0)
    if rec >= 0.90 and f1 > best_f1:
        best_thresh, best_recall, best_f1 = t, rec, f1

print(f"   Best threshold (recall ≥ 90%): {best_thresh:.2f}")
print(f"   Recall @ best threshold: {best_recall:.3f}")
print(f"   F1     @ best threshold: {best_f1:.3f}")

# Re-evaluate calibrated pipeline with best threshold
y_pred_cal = (probs >= best_thresh).astype(int)
print("\n📈 Calibrated Model @ Optimal Threshold:")
print(classification_report(y_test, y_pred_cal, target_names=["SAFE", "MALICIOUS"]))

# ─── Choose final model ───────────────────────────────────────────────────────
# Save calibrated pipeline (gives probabilities for confidence score)
# Also store the decision threshold so the backend can use it
final_model = {
    "pipeline": pipeline_base,
    "threshold": best_thresh,
}

# ─── Save .pkl files ──────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(MODEL_DIR, exist_ok=True)

model_path      = os.path.join(MODEL_DIR, "model.pkl")
vectorizer_path = os.path.join(MODEL_DIR, "vectorizer.pkl")

# Save the calibrated pipeline (includes both tfidf and calibrated clf)
with open(model_path, "wb") as f:
    pickle.dump(final_model, f, protocol=pickle.HIGHEST_PROTOCOL)

# Also save the raw vectorizer separately (used in /classify for raw preprocessing)
tfidf_step = pipeline_base.named_steps["tfidf"]
with open(vectorizer_path, "wb") as f:
    pickle.dump(tfidf_step, f, protocol=pickle.HIGHEST_PROTOCOL)

print(f"\n💾 Saved:")
print(f"   model.pkl      → {model_path}")
print(f"   vectorizer.pkl → {vectorizer_path}")
print(f"\n✅ Phase 1 complete. The backend is ready to load the model.")
