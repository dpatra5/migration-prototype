"""Which file extensions count as a 'document' in the transfer report."""
from __future__ import annotations

import os
from pathlib import Path

DEFAULT_DOCUMENT_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".pdf",
        ".txt",
        ".csv",
        ".rtf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".xml",
        ".json",
        ".msg",
        ".eml",
        ".png",
        ".jpg",
        ".jpeg",
        ".tif",
        ".tiff",
        ".bmp",
        ".gif",
    }
)


def load_document_extensions() -> frozenset[str]:
    """Return the whitelist. Overridable via DOCUMENT_EXTENSIONS env (comma-separated)."""
    raw = os.getenv("DOCUMENT_EXTENSIONS")
    if not raw:
        return DEFAULT_DOCUMENT_EXTENSIONS
    parts = [p.strip().lower() for p in raw.split(",") if p.strip()]
    normalized = {p if p.startswith(".") else f".{p}" for p in parts}
    return frozenset(normalized) or DEFAULT_DOCUMENT_EXTENSIONS


def is_document(name: str | Path, allowed: frozenset[str] | None = None) -> bool:
    """True if `name` has an allowed document extension (case-insensitive)."""
    ext = Path(name).suffix.lower()
    if not ext:
        return False
    if allowed is None:
        allowed = load_document_extensions()
    return ext in allowed
