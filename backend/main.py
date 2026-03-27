"""
Aegis.ai — main.py
FastAPI application entry point.

Endpoints:
  POST /classify   — classify a prompt, persist to DB
  GET  /history    — paginated history of all classifications
  GET  /stats      — aggregate metrics
  GET  /health     — liveness + model status
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from classifier import classify, is_loaded, load_model
from database import Classification, get_db, init_db
from schemas import (
    ClassifyRequest,
    ClassifyResponse,
    HealthResponse,
    HistoryItem,
    StatsResponse,
)

load_dotenv()

# ─── Allowed CORS origins (comma-separated in env) ────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]


# ─── Lifespan: startup + shutdown logic ───────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[startup] Initialising database …")
    init_db()
    print("[startup] Loading ML model …")
    ok = load_model()
    if not ok:
        print("[startup] ⚠️  Model failed to load — /classify will return 503")
    yield
    # Shutdown (nothing to clean up for SQLite / in-memory model)
    print("[shutdown] Aegis.ai backend shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Aegis.ai API",
    description="Real-time AI Firewall — prompt injection / jailbreak classifier",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ─── POST /classify ───────────────────────────────────────────────────────────
@app.post("/classify", response_model=ClassifyResponse, status_code=200)
def classify_prompt(body: ClassifyRequest, db: Session = Depends(get_db)):
    """
    Classify a prompt as SAFE or MALICIOUS.
    Persists the result to the database and returns id + confidence + timestamp.
    """
    if not is_loaded():
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Ensure model.pkl and vectorizer.pkl exist in backend/model/.",
        )

    try:
        label, confidence = classify(body.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    record = Classification(
        prompt=body.prompt,
        label=label,
        confidence=confidence,
        timestamp=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ClassifyResponse(
        id=record.id,
        label=record.label,
        confidence=record.confidence,
        timestamp=record.timestamp,
    )


# ─── GET /history ─────────────────────────────────────────────────────────────
@app.get("/history", response_model=List[HistoryItem])
def get_history(
    limit:  int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db:     Session = Depends(get_db),
):
    """
    Return paginated classification history, newest first.
    Query params: ?limit=20&offset=0
    """
    records = (
        db.query(Classification)
        .order_by(Classification.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return records


# ─── GET /stats ───────────────────────────────────────────────────────────────
@app.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Return aggregate classification metrics."""
    total     = db.query(func.count(Classification.id)).scalar() or 0
    safe      = db.query(func.count(Classification.id)).filter(Classification.label == "SAFE").scalar() or 0
    malicious = db.query(func.count(Classification.id)).filter(Classification.label == "MALICIOUS").scalar() or 0
    avg_conf  = db.query(func.avg(Classification.confidence)).scalar() or 0.0

    block_rate = round(malicious / total, 4) if total > 0 else 0.0

    return StatsResponse(
        total=total,
        safe=safe,
        malicious=malicious,
        block_rate=block_rate,
        avg_confidence=round(float(avg_conf), 4),
    )


# ─── GET /health ──────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Liveness check — confirms API is alive, model is loaded, DB is reachable."""
    db_ok = False
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    model_ok     = is_loaded()
    vectorizer_ok= is_loaded()   # both loaded in the same call

    return HealthResponse(
        status="ok" if (model_ok and db_ok) else "degraded",
        model_loaded=model_ok,
        vectorizer_loaded=vectorizer_ok,
        db_connected=db_ok,
    )


# ─── Dev entry point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
