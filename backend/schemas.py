"""
Aegis.ai — schemas.py
Pydantic v2 request / response models for all API endpoints.
"""

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


# ─── /classify ────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4096, description="Raw prompt to classify")


class ClassifyResponse(BaseModel):
    id:         int
    label:      Literal["SAFE", "MALICIOUS"]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0–1")
    timestamp:  datetime

    model_config = {"from_attributes": True}


# ─── /history ─────────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    id:         int
    prompt:     str
    label:      Literal["SAFE", "MALICIOUS"]
    confidence: float
    timestamp:  datetime

    model_config = {"from_attributes": True}


# ─── /stats ───────────────────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    total:          int
    safe:           int
    malicious:      int
    block_rate:     float = Field(..., description="malicious / total, 0 if no records")
    avg_confidence: float = Field(..., description="Mean confidence across all classifications")


# ─── /health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:            Literal["ok", "degraded"]
    model_loaded:      bool
    vectorizer_loaded: bool
    db_connected:      bool
