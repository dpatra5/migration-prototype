"""APScheduler-based polling service for the ZIP pipeline."""
from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .archive_manager import ArchiveManager
from .config import PipelineConfig, load_config
from .folder_watcher import FolderWatcher
from .logging_setup import configure_logging, get_logger
from .registry import ProcessingRegistry
from .zip_service import ZipExtractor


class SchedulerService:
    """Wires the pipeline together and drives it on a fixed polling interval."""

    JOB_ID = "zip_pipeline_scan"

    def __init__(self, config: PipelineConfig | None = None, blocking: bool = False) -> None:
        self.config = config or load_config()
        self.config.ensure_folders()
        configure_logging(log_file=self.config.registry_path.parent / "zip_pipeline.log")
        self._log = get_logger()

        self.registry = ProcessingRegistry(self.config.registry_path)
        self.extractor = ZipExtractor(self.config.destination_folder)
        self.archiver = ArchiveManager(self.config.archive_folder, self.config.failed_folder)
        self.watcher = FolderWatcher(self.config, self.registry, self.extractor, self.archiver)

        self._scheduler = BlockingScheduler() if blocking else BackgroundScheduler()

    def _job(self) -> None:
        try:
            self.watcher.scan_once()
        except Exception as exc:
            self._log.exception("Scan cycle failed: %s", exc)

    def start(self, run_immediately: bool = True) -> None:
        interval_minutes = max(1, int(self.config.polling_interval_minutes))
        trigger = IntervalTrigger(minutes=interval_minutes)
        self._scheduler.add_job(
            self._job,
            trigger=trigger,
            id=self.JOB_ID,
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        self._log.info(
            "Starting ZIP pipeline scheduler (interval=%s min, source=%s)",
            interval_minutes,
            self.config.source_folder,
        )
        if run_immediately:
            self._job()
        self._scheduler.start()

    def shutdown(self, wait: bool = True) -> None:
        if self._scheduler.running:
            self._log.info("Shutting down ZIP pipeline scheduler")
            self._scheduler.shutdown(wait=wait)
