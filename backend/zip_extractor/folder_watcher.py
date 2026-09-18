"""FolderWatcher: scan the source folder and dispatch work per file."""
from __future__ import annotations

import shutil
import time
from pathlib import Path
from typing import Any

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
        job_recorder: Any | None = None,
    ) -> None:
        self.config = config
        self.registry = registry
        self.extractor = extractor
        self.archiver = archiver
        self.reporter = reporter
        self.transfer_reporter = transfer_reporter
        self.job_recorder = job_recorder
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

    def _prior_completed_study_job(self, study: str) -> dict | None:
        """Return counts from a prior DONE/PARTIAL job for `study`, else None."""
        if self.job_recorder is None:
            return None
        try:
            return self.job_recorder.find_completed_study_job(study)
        except Exception as exc:  # pragma: no cover - defensive
            self._log.warning("Lookup of prior study job failed for %s: %s", study, exc)
            return None

    def _start_dashboard_job(
        self,
        *,
        source_name: str,
        study_name: str,
        source_type: str,
        fingerprint: str | None = None,
    ) -> str | None:
        if self.job_recorder is None:
            return None
        try:
            return self.job_recorder.start_job(
                zip_name=source_name,
                study=study_name,
                source_type=source_type,
                fingerprint=fingerprint,
                assigned_by="Scheduler",
            )
        except Exception as exc:  # pragma: no cover - defensive
            self._log.warning("Dashboard start_job failed: %s", exc)
            return None

    def _finish_dashboard_job(
        self,
        job_ref: str | None,
        *,
        status: str,
        total: int = 0,
        successful: int = 0,
        failed: int = 0,
        unclassified: int = 0,
        error: str | None = None,
    ) -> None:
        if self.job_recorder is None or not job_ref:
            return
        try:
            from app.models import JobStatus
        except Exception:  # pragma: no cover - defensive
            return
        status_map = {
            "done": JobStatus.DONE,
            "partial": JobStatus.PARTIAL,
            "failed": JobStatus.FAILED,
            "revoked": JobStatus.REVOKED,
        }
        try:
            self.job_recorder.finish_job(
                job_ref,
                status=status_map.get(status, JobStatus.DONE),
                total_files=total,
                successful_files=successful,
                failed_files=failed,
                unclassified_files=unclassified,
                error_message=error,
            )
        except Exception as exc:  # pragma: no cover - defensive
            self._log.warning("Dashboard finish_job failed: %s", exc)

    @staticmethod
    def _derive_job_status(unclassified: int, failed: int) -> str:
        if failed > 0:
            return "partial"
        if unclassified > 0:
            return "partial"
        return "done"

    def _build_progress_callback(self, job_ref: str | None):
        """Return a throttled callback that writes running counts to the Job row."""
        if self.job_recorder is None or not job_ref:
            return None
        last_call: dict[str, float] = {"t": 0.0}

        def _cb(total: int, mapped: int, unclassified: int, failed: int) -> None:
            done = mapped + unclassified + failed
            now = time.monotonic()
            # Throttle to at most one write per 500ms, but always flush the
            # first tick (total known, done==0) and the final tick (done==total).
            if now - last_call["t"] < 0.5 and 0 < done < total:
                return
            last_call["t"] = now
            try:
                self.job_recorder.update_progress(
                    job_ref,
                    total_files=total,
                    successful_files=mapped,
                    failed_files=failed,
                    unclassified_files=unclassified,
                )
            except Exception as exc:  # pragma: no cover - defensive
                self._log.warning("Dashboard update_progress failed: %s", exc)

        return _cb

    def _handle_folder(self, folder_path: Path) -> None:
        """Source folder is already unzipped; move to Extracted_Folders and map directly."""
        self._log.info("Unzipped folder detected: %s", folder_path.name)
        target = self.config.extracted_folder / folder_path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        started_at = time.strftime("%Y-%m-%d %H:%M:%S")

        prior = self._prior_completed_study_job(folder_path.name)
        if prior is not None:
            self._log.info(
                "Study %s already processed by %s; skipping re-mapping.",
                folder_path.name, prior["job_ref"],
            )
            job_ref = self._start_dashboard_job(
                source_name=folder_path.name,
                study_name=folder_path.name,
                source_type="folder",
            )
            mapped = prior["successful_files"]
            unclass = prior["unclassified_files"]
            total = prior["total_files"] or (mapped + unclass)
            note = f"Duplicate upload — study already processed by {prior['job_ref']}."
            self._safe_transfer_folder_report(
                folder_path.name, folder_path.name, target, "COMPLETED", note,
                started_at, mapped, unclass, job_id=job_ref,
            )
            self._finish_dashboard_job(
                job_ref, status="done",
                total=total, successful=mapped, failed=0, unclassified=unclass,
                error=None,
            )
            if folder_path.exists() and folder_path != target:
                try:
                    shutil.rmtree(folder_path)
                    self._log.info("Removed duplicate source folder: %s", folder_path)
                except OSError as exc:
                    self._log.warning("Could not remove duplicate source folder %s: %s", folder_path, exc)
            return

        job_ref = self._start_dashboard_job(
            source_name=folder_path.name,
            study_name=folder_path.name,
            source_type="folder",
        )

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
                self._safe_transfer_folder_report(folder_path.name, folder_path.name, target, "FAILED", str(exc), started_at, 0, 0, job_id=job_ref)
                self._finish_dashboard_job(job_ref, status="failed", error=str(exc))
                return

        mapped, unclass, total, failed = self._map_extracted(extracted_dir, job_ref=job_ref)
        self._safe_transfer_folder_report(
            folder_path.name, folder_path.name, extracted_dir, "COMPLETED", "", started_at, mapped, unclass,
            job_id=job_ref,
        )
        self._finish_dashboard_job(
            job_ref,
            status=self._derive_job_status(unclass, failed),
            total=total,
            successful=mapped,
            failed=failed,
            unclassified=unclass,
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
        job_ref = self._start_dashboard_job(
            source_name=zip_path.name,
            study_name=study_name,
            source_type="zip",
            fingerprint=fingerprint,
        )
        try:
            extracted_dir = self.extractor.extract(zip_path)
            self.registry.mark_completed(fingerprint)
            if self.reporter is not None:
                docs_after = self.reporter.count_folder_documents(extracted_dir)
                self._safe_report(study_name, zip_path, extracted_dir, docs_before, docs_after, "COMPLETED", "")
            mapped, unclass, total, failed = self._map_extracted(extracted_dir, job_ref=job_ref)
            self._safe_transfer_report(study_name, zip_path, extracted_dir, "COMPLETED", "", started_at, mapped, unclass, job_id=job_ref)
            self.archiver.archive(zip_path)
            self._finish_dashboard_job(
                job_ref,
                status=self._derive_job_status(unclass, failed),
                total=total,
                successful=mapped,
                failed=failed,
                unclassified=unclass,
            )
        except Exception as exc:
            self._log.exception("Processing failed for %s: %s", zip_path.name, exc)
            self.registry.mark_failed(fingerprint, f"{type(exc).__name__}: {exc}")
            if self.reporter is not None:
                docs_after = self.reporter.count_folder_documents(extracted_dir)
                self._safe_report(
                    study_name, zip_path, extracted_dir, docs_before, docs_after, "FAILED", str(exc)
                )
            self._safe_transfer_report(study_name, zip_path, extracted_dir, "FAILED", str(exc), started_at, 0, 0, job_id=job_ref)
            self._finish_dashboard_job(job_ref, status="failed", error=f"{type(exc).__name__}: {exc}")
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
            # Run mapping FIRST so the transfer_report row is written with the
            # actual Mapped/Unclassified counts instead of zeros.
            mapped, unclass, _total, _failed = self._map_extracted(target.parent)
            if self.transfer_reporter is not None:
                try:
                    self.transfer_reporter.record_direct_transfer(
                        path, target,
                        mapped_count=mapped, unclassified_count=unclass,
                    )
                except Exception as exc:
                    self._log.error("Failed to update transfer report for %s: %s", path.name, exc)
        except OSError as exc:
            self._log.error("Failed to transfer non-ZIP file %s: %s", path, exc)

    def _map_extracted(self, extracted_dir: Path, job_ref: str | None = None) -> tuple[int, int, int, int]:
        """Map an extracted folder into the TMF destination hierarchy.

        Returns (mapped, unclassified, total_scanned, failed).
        """
        try:
            from mapping import run_agent  # local import avoids hard dep at module load
        except ImportError as exc:
            self._log.error("TMF mapping module unavailable: %s", exc)
            return 0, 0, 0, 0
        progress_cb = self._build_progress_callback(job_ref)
        try:
            summary = run_agent(
                source_folder=extracted_dir,
                destination_root=self.config.destination_folder,
                overwrite_existing=False,
                progress_callback=progress_cb,
            )
            # Duplicates already exist at destination from a prior job; count
            # them toward the current job so Total == Transferred stays balanced.
            mapped = summary.by_method.get("exact_number_path", 0) + summary.duplicates_skipped
            unclass = summary.by_method.get("unclassified", 0)
            self._log.info(
                "TMF mapping: scanned=%d placed=%d duplicates=%d unclassified=%d failed=%d (source=%s)",
                summary.total_scanned,
                summary.total_placed,
                summary.duplicates_skipped,
                unclass,
                summary.failed,
                extracted_dir,
            )
            self._cleanup_extracted(extracted_dir, summary.failed)
            return mapped, unclass, summary.total_scanned, summary.failed
        except Exception as exc:
            self._log.exception("TMF mapping failed for %s: %s", extracted_dir, exc)
            return 0, 0, 0, 0

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
        job_id: str | None = None,
    ) -> None:
        if self.transfer_reporter is None:
            return
        try:
            self.transfer_reporter.record_zip_job(
                study_name, zip_path, extracted_dir, status, notes, started_at,
                mapped_count=mapped_count, unclassified_count=unclassified_count,
                job_id=job_id,
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
        job_id: str | None = None,
    ) -> None:
        if self.transfer_reporter is None:
            return
        try:
            self.transfer_reporter.record_folder_job(
                study_name, source_name, extracted_dir, status, notes, started_at,
                mapped_count=mapped_count, unclassified_count=unclassified_count,
                job_id=job_id,
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
