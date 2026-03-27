"""
Aegis.ai — database.py
SQLAlchemy ORM: Classification model + engine + session factory.
Auto-creates aegis.db (SQLite) on first run. Swappable to PostgreSQL via DATABASE_URL.
"""

import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aegis.db")

# SQLite-specific: allow same connection across threads (needed for FastAPI)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Classification(Base):
    __tablename__ = "classifications"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prompt     = Column(String,  nullable=False)
    label      = Column(String,  nullable=False)          # "SAFE" | "MALICIOUS"
    confidence = Column(Float,   nullable=False)          # 0.0 – 1.0
    timestamp  = Column(DateTime, default=datetime.utcnow, nullable=False)


def init_db() -> None:
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session, closes on exit."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
