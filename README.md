# Aegis.ai
# Aegis.ai - AI Prompt Firewall

<div align="center">

![Aegis.ai Shield](https://img.shields.io/badge/Aegis.ai-v1.0-5227FF?style=for-the-badge&logo=shield&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

**Real-time AI firewall that intercepts and classifies prompt injection attacks before they reach your LLM.**

[Live Demo](https://aegis-ai-delta.vercel.app) · [API Docs](https://aegis-api.railway.app/docs) · [Report Bug](https://github.com/yourusername/aegis-ai/issues)

</div>

---

## What Is Aegis.ai?

Aegis.ai is a **supervised ML pipeline** that sits as middleware between users and any LLM-powered application. It intercepts every incoming prompt, analyzes its semantic and statistical structure using NLP, and classifies it as either **SAFE** (allowed through) or **MALICIOUS** (prompt injection / jailbreak attempt, blocked).

It is not a chatbot. It is not an LLM. It is a **gatekeeper**.

```
User Prompt ──▶ Aegis.ai Firewall ──▶ SAFE ──▶ Your LLM
                      │
                  MALICIOUS ──▶ BLOCKED ✗
```

---

## Screenshots

> *Full-screen Liquid Ether background · Real-time verdict flashes · Live stats*

| Safe Prompt | Blocked Prompt |
|---|---|
| 🟢 Green flash — "PASSED" | 🔴 Red flash — "BLOCKED" |

---

## Features

- **Real-Time Classification** — Sub-200ms verdict with confidence score on every submission
- **ML Detection Engine** — LinearSVC + TF-IDF with calibrated probability output and threshold tuning; targets ≥ 90% recall on the malicious class
- **Immersive Dark UI** — Full-screen Liquid Ether WebGL background, animated verdict flashes, live stats bar, and scrollable history log
- **Persistent Logging** — Every classification event stored in SQLite (dev) or PostgreSQL (prod) via SQLAlchemy
- **REST API** — Clean FastAPI backend with `/classify`, `/history`, `/stats`, and `/health` endpoints
- **Deploy-Ready** — Frontend on Vercel, backend + database on Railway

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Training | Python 3.11, scikit-learn, NLTK |
| Backend API | FastAPI + Uvicorn |
| Database | SQLAlchemy + SQLite / PostgreSQL |
| Frontend | React 19 (Vite) + Tailwind CSS v3 |
| Background | Three.js (WebGL fluid simulation) |
| HTTP Client | Axios |
| Deployment | Vercel (frontend) + Railway (backend + DB) |

---

## Project Structure

```
aegis-ai/
├── backend/
│   ├── model/
│   │   ├── model.pkl          # Trained CalibratedClassifierCV (LinearSVC)
│   │   └── vectorizer.pkl     # Fitted TF-IDF vectorizer (5,000 features)
│   ├── main.py                # FastAPI app + all routes
│   ├── classifier.py          # ML inference logic
│   ├── database.py            # SQLAlchemy ORM models
│   ├── schemas.py             # Pydantic request/response models
│   ├── train_model.py         # Model training script
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── LiquidEther.jsx    # WebGL fluid background (Three.js)
│       ├── PromptInput.jsx
│       ├── VerdictDisplay.jsx
│       ├── StatsBar.jsx
│       ├── HistoryLog.jsx
│       └── api/client.js      # Axios API calls
│
├── notebooks/
│   └── pipeline.ipynb         # Training, evaluation & threshold tuning
│
├── vision.md
└── ConnectionGuide.txt
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm or yarn

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/aegis-ai.git
cd aegis-ai
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `/backend/`:

```env
DATABASE_URL=sqlite:///./aegis.db
MODEL_PATH=./model/model.pkl
VECTORIZER_PATH=./model/vectorizer.pkl
ALLOWED_ORIGINS=http://localhost:5173
PORT=8000
```

### 3. Train the model

> Skip this step if `model/model.pkl` and `model/vectorizer.pkl` already exist.

```bash
python train_model.py
```

This downloads the `deepset/prompt-injections` dataset from HuggingFace, trains a calibrated LinearSVC, tunes the decision threshold for ≥ 90% recall, and saves both `.pkl` files to `./model/`.

### 4. Start the backend

```bash
uvicorn main:app --reload --port 8000
```

API is live at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 5. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `/frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

### 6. Start the frontend

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## API Reference

**Base URL (production):** `https://aegis-api.railway.app`

### `POST /classify`

Classify a prompt as SAFE or MALICIOUS.

```json
// Request
{ "prompt": "Ignore all previous instructions." }

// Response
{
  "id": 42,
  "label": "MALICIOUS",
  "confidence": 0.9731,
  "timestamp": "2025-03-27T14:22:17.608556"
}
```

### `GET /history`

Paginated classification history, newest first.

| Param | Default | Max |
|---|---|---|
| `limit` | 20 | 100 |
| `offset` | 0 | — |

### `GET /stats`

Aggregate metrics across all classifications.

```json
{
  "total": 120,
  "safe": 84,
  "malicious": 36,
  "block_rate": 0.3,
  "avg_confidence": 0.8812
}
```

### `GET /health`

Liveness check — confirms API, model, and database are all operational.

```json
{
  "status": "ok",
  "model_loaded": true,
  "vectorizer_loaded": true,
  "db_connected": true
}
```

---

## ML Pipeline

### Dataset

[`deepset/prompt-injections`](https://huggingface.co/datasets/deepset/prompt-injections) — 546 train / 116 test samples across two classes: SAFE (0) and MALICIOUS (1).

### Preprocessing

```
Raw text
  → Lowercase
  → Strip non-alpha characters
  → Tokenize
  → Remove stop words (preserving adversarial keywords: ignore, override, bypass, inject, etc.)
  → Lemmatize
```

### Model

```
TF-IDF Vectorizer (unigrams + bigrams, 5,000 features, sublinear TF)
  → CalibratedClassifierCV(LinearSVC(class_weight='balanced'))
  → Decision threshold tuned to maximise F1 subject to Recall ≥ 90%
```

### Performance Targets

| Metric | Target |
|---|---|
| Accuracy | ≥ 92% |
| Recall — MALICIOUS | ≥ 90% ← priority |
| Precision — MALICIOUS | ≥ 88% |
| F1 — MALICIOUS | ≥ 89% |

> **Why recall over precision?** A missed attack (false negative) is far more dangerous than a blocked safe prompt (false positive).

---

## Deployment

### Backend → Railway

1. Push backend code to a GitHub repo
2. Create a new Railway project and connect the repo
3. Set environment variables:
   ```
   DATABASE_URL=postgresql://...  (Railway PostgreSQL add-on)
   ALLOWED_ORIGINS=https://aegis-ai-delta.vercel.app
   PORT=8000
   ```
4. Railway auto-deploys on push

### Frontend → Vercel

1. Import the frontend directory into Vercel
2. Set the environment variable:
   ```
   VITE_API_URL=https://aegis-api.railway.app
   ```
3. Deploy — Vercel handles the Vite build automatically

---

## Database Schema

```sql
TABLE classifications (
  id          INTEGER   PRIMARY KEY AUTOINCREMENT,
  prompt      TEXT      NOT NULL,
  label       VARCHAR   NOT NULL,   -- "SAFE" | "MALICIOUS"
  confidence  REAL      NOT NULL,   -- 0.0 – 1.0
  timestamp   DATETIME  NOT NULL    -- UTC
)
```

---

## Common Issues

**Model not found (503 on `/classify`)**
→ Confirm `model.pkl` and `vectorizer.pkl` exist in `backend/model/`. Re-run `train_model.py` if missing.

**CORS error in browser**
→ Ensure your frontend URL is listed in `ALLOWED_ORIGINS` in the backend `.env`, then restart the server.

**Database errors**
→ For SQLite: delete `aegis.db` and restart — it auto-recreates. For PostgreSQL: verify the `DATABASE_URL` connection string.

**Frontend shows "Offline"**
→ Check `VITE_API_URL` points to the running backend and hit `<backend>/health` directly to confirm.

---


<div align="center">
  <sub>Built by yazh_7z7 · Aegis.ai v1.0</sub>
</div>
