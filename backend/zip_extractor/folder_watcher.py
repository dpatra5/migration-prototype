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
                    self._handle_folder(entry)
                elif entry.suffix.lower() == ".zip":
                    self._handle_zip(entry)
                else:
                    self._transfer_non_zip(entry)
            except Exception as exc:
                self._log.exception("Unexpected error processing %s: %s", entry, exc)

    # ------------------------------------------------------------------ helpers

    def _handle_folder(self, folder_path: Path) -> None:
        """Source folder is already unzipped; move to Extracted_Folders and map directly."""
        self._log.info("Unzipped folder detected: %s", folder_path.name)
        target = self.config.extracted_folder / folder_path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        started_at = time.strftime("%Y-%m-%d %H:%M:%S")

        if target.exists():
            self._log.info(
                "Folder already present at %s; skipping move and re-running mapping.",
                target,
            )
            extracted_dir = target
        else:
            try:
                shutil.move(str(folder_path), str(target))
                extracted_dir = target
                self._log.info("Moved unzipped folder to extracted folder: %s", target)
            except OSError as exc:
                self._log.error("Failed to move folder %s to %s: %s", folder_path, target, exc)
                self._safe_transfer_folder_report(folder_path.name, folder_path.name, target, "FAILED", str(exc), started_at, 0, 0)
                return

        mapped, unclass = self._map_extracted(extracted_dir)
        self._safe_transfer_folder_report(
            folder_path.name, folder_path.name, extracted_dir, "COMPLETED", "", started_at, mapped, unclass
        )

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
        extracted_dir = self.config.extracted_folder / study_name
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
            mapped, unclass = self._map_extracted(extracted_dir)
            self._safe_transfer_report(study_name, zip_path, extracted_dir, "COMPLETED", "", started_at, mapped, unclass)
            self.archiver.archive(zip_path)
        except Exception as exc:
            self._log.exception("Processing failed for %s: %s", zip_path.name, exc)
            self.registry.mark_failed(fingerprint, f"{type(exc).__name__}: {exc}")
            if self.reporter is not None:
                docs_after = self.reporter.count_folder_documents(extracted_dir)
                self._safe_report(
                    study_name, zip_path, extracted_dir, docs_before, docs_after, "FAILED", str(exc)
                )
            self._safe_transfer_report(study_name, zip_path, extracted_dir, "FAILED", str(exc), started_at, 0, 0)
            try:
                self.archiver.move_to_failed(zip_path)
            except Exception as move_exc:
                self._log.error("Failed to move %s to failed folder: %s", zip_path, move_exc)

    def _transfer_non_zip(self, path: Path) -> None:
        destination_root = self.config.extracted_folder
        destination_root.mkdir(parents=True, exist_ok=True)
        target = destination_root / path.name
        if target.exists():
            self._log.debug("Non-ZIP already present at extracted folder, skipping: %s", path.name)
            return
        try:
            shutil.move(str(path), str(target))
            self._log.info("Transferred non-ZIP file to extracted folder: %s", path.name)
            if self.transfer_reporter is not None:
                try:
                    self.transfer_reporter.record_direct_transfer(path, target)
                except Exception as exc:
                    self._log.error("Failed to update transfer report for %s: %s", path.name, exc)
            self._map_extracted(target.parent)
        except OSError as exc:
            self._log.error("Failed to transfer non-ZIP file %s: %s", path, exc)

    def _map_extracted(self, extracted_dir: Path) -> tuple[int, int]:
        """Map an extracted folder into the TMF destination hierarchy; returns (mapped, unclassified)."""
        try:
            from mapping import run_agent  # local import avoids hard dep at module load
        except ImportError as exc:
            self._log.error("TMF mapping module unavailable: %s", exc)
            return 0, 0
        try:
            summary = run_agent(
                source_folder=extracted_dir,
                destination_root=self.config.destination_folder,
                overwrite_existing=False,
            )
            mapped = summary.by_method.get("exact_number_path", 0)
            unclass = summary.by_method.get("unclassified", 0)
            self._log.info(
                "TMF mapping: scanned=%d placed=%d unclassified=%d failed=%d (source=%s)",
                summary.total_scanned,
                summary.total_placed,
                unclass,
                summary.failed,
                extracted_dir,
            )
            self._cleanup_extracted(extracted_dir, summary.failed)
            return mapped, unclass
        except Exception as exc:
            self._log.exception("TMF mapping failed for %s: %s", extracted_dir, exc)
            return 0, 0

    def _cleanup_extracted(self, extracted_dir: Path, failures: int) -> None:
        """Remove the extracted source tree once mapping succeeds so only Destination retains docs."""
        if failures:
            self._log.info("Keeping %s for retry (%d failed copies)", extracted_dir, failures)
            return
        try:
            extracted_dir = extracted_dir.resolve()
            root = self.config.extracted_folder.resolve()
        except OSError as exc:
            self._log.warning("Could not resolve paths for cleanup: %s", exc)
            return
        if extracted_dir == root or root not in extracted_dir.parents:
            self._log.debug("Skipping cleanup of %s (outside extracted root or is root)", extracted_dir)
            return
        try:
            shutil.rmtree(extracted_dir)
            self._log.info("Removed extracted folder after mapping: %s", extracted_dir)
        except OSError as exc:
            self._log.error("Failed to remove extracted folder %s: %s", extracted_dir, exc)

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
        mapped_count: int = 0,
        unclassified_count: int = 0,
    ) -> None:
        if self.transfer_reporter is None:
            return
        try:
            self.transfer_reporter.record_zip_job(
                study_name, zip_path, extracted_dir, status, notes, started_at,
                mapped_count=mapped_count, unclassified_count=unclassified_count,
            )
        except Exception as exc:
            self._log.error("Failed to update transfer report for %s: %s", zip_path.name, exc)

    def _safe_transfer_folder_report(
        self,
        study_name: str,
        source_name: str,
        extracted_dir: Path,
        status: str,
        notes: str,
        started_at: str,
        mapped_count: int,
        unclassified_count: int,
    ) -> None:
        if self.transfer_reporter is None:
            return
        try:
            self.transfer_reporter.record_folder_job(
                study_name, source_name, extracted_dir, status, notes, started_at,
                mapped_count=mapped_count, unclassified_count=unclassified_count,
            )
        except Exception as exc:
            self._log.error("Failed to update transfer report for folder %s: %s", source_name, exc)

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
