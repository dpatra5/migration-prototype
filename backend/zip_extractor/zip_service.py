"""Recursive ZIP extraction service."""
from __future__ import annotations

import zipfile
from pathlib import Path

from .logging_setup import get_logger
from .safe_extract import validate_and_extract


class ZipExtractor:
    """Extracts ZIP files into a destination and recursively unpacks nested ZIPs."""

    def __init__(self, destination_root: Path) -> None:
        self.destination_root = destination_root
        self._log = get_logger()

    @staticmethod
    def is_valid_zip(zip_path: Path) -> bool:
        try:
            with zipfile.ZipFile(zip_path, "r") as z:
                bad = z.testzip()
                return bad is None
        except (zipfile.BadZipFile, OSError):
            return False

    def extract(self, zip_path: Path) -> Path:
        """Extract `zip_path` into `<destination_root>/<zip_stem>/` and process nested ZIPs.

        Returns the top-level extraction folder path.
        """
        if not self.is_valid_zip(zip_path):
            raise RuntimeError(f"Invalid or corrupt ZIP: {zip_path}")

        target_dir = self.destination_root / zip_path.stem
        target_dir.mkdir(parents=True, exist_ok=True)

        self._log.info("Extraction started: %s -> %s", zip_path.name, target_dir)
        validate_and_extract(zip_path, target_dir)
        self._log.info("Extraction completed: %s", zip_path.name)

        self._extract_nested(target_dir)
        return target_dir

    def _extract_nested(self, root: Path) -> None:
        """Recursively find nested ZIPs inside `root`, extract in place, then delete them."""
        while True:
            nested_zips = [p for p in root.rglob("*.zip") if p.is_file()]
            if not nested_zips:
                return
            for nested in nested_zips:
                nested_target = nested.parent / nested.stem
                try:
                    if not self.is_valid_zip(nested):
                        self._log.error("Invalid nested ZIP skipped: %s", nested)
                        nested.unlink(missing_ok=True)
                        continue
                    self._log.info("Nested ZIP extraction started: %s", nested)
                    nested_target.mkdir(parents=True, exist_ok=True)
                    validate_and_extract(nested, nested_target)
                    self._log.info("Nested ZIP extraction completed: %s", nested)
                except Exception as exc:
                    self._log.exception("Nested ZIP extraction failed: %s (%s)", nested, exc)
                    raise
                finally:
                    try:
                        nested.unlink(missing_ok=True)
                    except OSError as exc:
                        self._log.warning("Failed to remove nested ZIP %s: %s", nested, exc)
