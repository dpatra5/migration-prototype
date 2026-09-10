"""FolderWatcher: scan the source folder and dispatch work per file."""
from __future__ import annotations

import shutil
import time
from pathlib import Path

from .archive_manager import ArchiveManager
from .config import PipelineConfig
from .logging_setup import get_logger
from .registry import STATUS_COMPLETED, ProcessingRegistry
from .report_writer import ExcelReporter
from .transfer_report import TransferReporter
from .zip_service import ZipExtractor


class FolderWatcher:
    """Scans the SOURCE_FOLDER for new files and drives the pipeline."""

    def __init__(
        self,
        config: PipelineConfig,
        registry: ProcessingRegistry,
        extractor: ZipExtractor,
        archiver: ArchiveManager,
        reporter: ExcelReporter | None = None,
        transfer_reporter: TransferReporter | None = None,
    ) -> None:
        self.config = config
        self.registry = registry
        self.extractor = extractor
        self.archiver = archiver
        self.reporter = reporter
        self.transfer_reporter = transfer_reporter
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
        study_name = zip_path.stem
        extracted_dir = self.config.destination_folder / study_name
        if existing_status == STATUS_COMPLETED and self._destination_has_content(extracted_dir):
            self._log.info("Skipping already-processed ZIP: %s", zip_path.name)
            try:
                self.archiver.archive(zip_path)
            except Exception as exc:
                self._log.warning("Could not archive duplicate ZIP %s: %s", zip_path, exc)
            return
        if existing_status == STATUS_COMPLETED:
            self._log.info(
                "Registry says COMPLETED but destination is missing/empty; re-processing %s",
                zip_path.name,
            )

        self.registry.mark_processing(fingerprint, zip_path, size, sha1)
        docs_before = self.reporter.count_zip_documents(zip_path) if self.reporter else 0
        started_at = time.strftime("%Y-%m-%d %H:%M:%S")
        try:
            extracted_dir = self.extractor.extract(zip_path)
            self.registry.mark_completed(fingerprint)
            if self.reporter is not None:
                docs_after = self.reporter.count_folder_documents(extracted_dir)
                self._safe_report(study_name, zip_path, extracted_dir, docs_before, docs_after, "COMPLETED", "")
            self._safe_transfer_report(study_name, zip_path, extracted_dir, "COMPLETED", "", started_at)
            self.archiver.archive(zip_path)
        except Exception as exc:
            self._log.exception("Processing failed for %s: %s", zip_path.name, exc)
            self.registry.mark_failed(fingerprint, f"{type(exc).__name__}: {exc}")
            if self.reporter is not None:
                docs_after = self.reporter.count_folder_documents(extracted_dir)
                self._safe_report(
                    study_name, zip_path, extracted_dir, docs_before, docs_after, "FAILED", str(exc)
                )
            self._safe_transfer_report(study_name, zip_path, extracted_dir, "FAILED", str(exc), started_at)
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
            if self.transfer_reporter is not None:
                try:
                    self.transfer_reporter.record_direct_transfer(path, target)
                except Exception as exc:
                    self._log.error("Failed to update transfer report for %s: %s", path.name, exc)
        except OSError as exc:
            self._log.error("Failed to transfer non-ZIP file %s: %s", path, exc)

    def _safe_report(
        self,
        study_name: str,
        zip_path: Path,
        extracted_dir: Path,
        docs_before: int,
        docs_after: int,
        status: str,
        notes: str,
    ) -> None:
        if self.reporter is None:
            return
        try:
            self.reporter.record_extraction(
                study_name, zip_path, extracted_dir, docs_before, docs_after, status, notes
            )
        except Exception as exc:
            self._log.error("Failed to update Excel report for %s: %s", zip_path.name, exc)

    def _safe_transfer_report(
        self,
        study_name: str,
        zip_path: Path,
        extracted_dir: Path,
        status: str,
        notes: str,
        started_at: str,
    ) -> None:
        if self.transfer_reporter is None:
            return
        try:
            self.transfer_reporter.record_zip_job(
                study_name, zip_path, extracted_dir, status, notes, started_at
            )
        except Exception as exc:
            self._log.error("Failed to update transfer report for %s: %s", zip_path.name, exc)

    @staticmethod
    def _destination_has_content(folder: Path) -> bool:
        if not folder.exists() or not folder.is_dir():
            return False
        for entry in folder.rglob("*"):
            if entry.is_file():
                return True
        return False

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
