"""FolderWatcher: scan the source folder and dispatch work per file."""
from __future__ import annotations

import shutil
import time
from pathlib import Path

from .archive_manager import ArchiveManager
from .config import PipelineConfig
from .logging_setup import get_logger
from .registry import STATUS_COMPLETED, ProcessingRegistry
from .zip_service import ZipExtractor


class FolderWatcher:
    """Scans the SOURCE_FOLDER for new files and drives the pipeline."""

    def __init__(
        self,
        config: PipelineConfig,
        registry: ProcessingRegistry,
        extractor: ZipExtractor,
        archiver: ArchiveManager,
    ) -> None:
        self.config = config
        self.registry = registry
        self.extractor = extractor
        self.archiver = archiver
        self._log = get_logger()

    def scan_once(self) -> None:
        """Perform a single scan pass over SOURCE_FOLDER."""
        source = self.config.source_folder
        if not source.exists():
            self._log.warning("Source folder does not exist: %s", source)
            return

        self._log.info("Scanning source folder: %s", source)
        entries = sorted(source.iterdir())
        for entry in entries:
            try:
                if entry.is_dir():
                    continue
                if entry.suffix.lower() == ".zip":
                    self._handle_zip(entry)
                else:
                    self._transfer_non_zip(entry)
            except Exception as exc:
                self._log.exception("Unexpected error processing %s: %s", entry, exc)

    # ------------------------------------------------------------------ helpers

    def _handle_zip(self, zip_path: Path) -> None:
        if not self._is_stable(zip_path):
            self._log.debug("Skipping %s: still being written", zip_path.name)
            return

        self._log.info("ZIP detected: %s", zip_path.name)
        try:
            fingerprint, size, sha1 = self.registry.compute_fingerprint(zip_path)
        except OSError as exc:
            self._log.error("Failed to fingerprint %s: %s", zip_path, exc)
            return

        existing_status = self.registry.get_status(fingerprint)
        if existing_status == STATUS_COMPLETED:
            self._log.info("Skipping already-processed ZIP: %s", zip_path.name)
            try:
                self.archiver.archive(zip_path)
            except Exception as exc:
                self._log.warning("Could not archive duplicate ZIP %s: %s", zip_path, exc)
            return

        self.registry.mark_processing(fingerprint, zip_path, size, sha1)
        try:
            self.extractor.extract(zip_path)
            self.archiver.archive(zip_path)
            self.registry.mark_completed(fingerprint)
        except Exception as exc:
            self._log.exception("Processing failed for %s: %s", zip_path.name, exc)
            self.registry.mark_failed(fingerprint, f"{type(exc).__name__}: {exc}")
            try:
                self.archiver.move_to_failed(zip_path)
            except Exception as move_exc:
                self._log.error("Failed to move %s to failed folder: %s", zip_path, move_exc)

    def _transfer_non_zip(self, path: Path) -> None:
        destination_root = self.config.destination_folder
        destination_root.mkdir(parents=True, exist_ok=True)
        target = destination_root / path.name
        if target.exists():
            self._log.debug("Non-ZIP already present at destination, skipping: %s", path.name)
            return
        try:
            shutil.move(str(path), str(target))
            self._log.info("Transferred non-ZIP file to destination: %s", path.name)
        except OSError as exc:
            self._log.error("Failed to transfer non-ZIP file %s: %s", path, exc)

    @staticmethod
    def _is_stable(path: Path, checks: int = 2, delay: float = 1.0) -> bool:
        """Return True if the file size is unchanged across consecutive checks."""
        try:
            last = path.stat().st_size
        except OSError:
            return False
        for _ in range(checks):
            time.sleep(delay)
            try:
                current = path.stat().st_size
            except OSError:
                return False
            if current != last:
                last = current
                return False
        return True
