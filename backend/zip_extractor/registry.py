"""SQLite-backed processing registry to prevent duplicate ZIP processing."""
from __future__ import annotations

import hashlib
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


STATUS_PENDING = "PENDING"
STATUS_PROCESSING = "PROCESSING"
STATUS_COMPLETED = "COMPLETED"
STATUS_FAILED = "FAILED"


class ProcessingRegistry:
    """Tracks ZIP files that have been processed by (name, size, sha1) fingerprint."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._lock = threading.Lock()
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path, timeout=30, isolation_level=None)
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_schema(self) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS processed_zips (
                    fingerprint TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    sha1 TEXT NOT NULL,
                    status TEXT NOT NULL,
                    error TEXT,
                    started_at TEXT,
                    finished_at TEXT
                )
                """
            )

    @staticmethod
    def compute_fingerprint(zip_path: Path) -> tuple[str, int, str]:
        size = zip_path.stat().st_size
        hasher = hashlib.sha256()
        with zip_path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                hasher.update(chunk)
        digest = hasher.hexdigest()
        fingerprint = f"{zip_path.name}:{size}:{digest}"
        return fingerprint, size, digest

    def get_status(self, fingerprint: str) -> Optional[str]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT status FROM processed_zips WHERE fingerprint = ?",
                (fingerprint,),
            ).fetchone()
            return row[0] if row else None

    def mark_processing(self, fingerprint: str, zip_path: Path, size: int, sha1: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO processed_zips (fingerprint, filename, size, sha1, status, started_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(fingerprint) DO UPDATE SET
                    status=excluded.status,
                    started_at=excluded.started_at,
                    error=NULL,
                    finished_at=NULL
                """,
                (fingerprint, zip_path.name, size, sha1, STATUS_PROCESSING, now),
            )

    def mark_completed(self, fingerprint: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                "UPDATE processed_zips SET status=?, finished_at=?, error=NULL WHERE fingerprint=?",
                (STATUS_COMPLETED, now, fingerprint),
            )

    def mark_failed(self, fingerprint: str, error: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                "UPDATE processed_zips SET status=?, finished_at=?, error=? WHERE fingerprint=?",
                (STATUS_FAILED, now, error, fingerprint),
            )
