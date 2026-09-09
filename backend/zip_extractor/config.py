"""Configuration for the ZIP processing pipeline."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_SOURCE = r"C:\Users\ADas155\QuIn\POC\Source"
DEFAULT_DESTINATION = r"C:\Users\ADas155\QuIn\POC\Destination"
DEFAULT_ARCHIVE = r"C:\Users\ADas155\QuIn\POC\Archive"
DEFAULT_POLLING_MINUTES = 120


@dataclass(frozen=True)
class PipelineConfig:
    source_folder: Path
    destination_folder: Path
    archive_folder: Path
    failed_folder: Path
    registry_path: Path
    polling_interval_minutes: int

    def ensure_folders(self) -> None:
        for p in (
            self.source_folder,
            self.destination_folder,
            self.archive_folder,
            self.failed_folder,
        ):
            p.mkdir(parents=True, exist_ok=True)
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)


def load_config(
    source_folder: str | os.PathLike[str] | None = None,
    destination_folder: str | os.PathLike[str] | None = None,
    archive_folder: str | os.PathLike[str] | None = None,
    polling_interval_minutes: int | None = None,
    failed_folder: str | os.PathLike[str] | None = None,
    registry_path: str | os.PathLike[str] | None = None,
) -> PipelineConfig:
    """Build a config from explicit args, environment variables, or defaults."""

    source = Path(source_folder or os.getenv("SOURCE_FOLDER", DEFAULT_SOURCE))
    dest = Path(destination_folder or os.getenv("DESTINATION_FOLDER", DEFAULT_DESTINATION))
    archive = Path(archive_folder or os.getenv("ARCHIVE_FOLDER", DEFAULT_ARCHIVE))
    failed = Path(failed_folder or os.getenv("FAILED_FOLDER", str(archive / "_Failed")))
    registry = Path(
        registry_path
        or os.getenv("REGISTRY_PATH", str(Path(__file__).resolve().parent / "processing_registry.sqlite"))
    )

    interval_env = os.getenv("POLLING_INTERVAL")
    if polling_interval_minutes is None and interval_env:
        try:
            polling_interval_minutes = int(interval_env)
        except ValueError:
            polling_interval_minutes = DEFAULT_POLLING_MINUTES
    if polling_interval_minutes is None:
        polling_interval_minutes = DEFAULT_POLLING_MINUTES

    return PipelineConfig(
        source_folder=source,
        destination_folder=dest,
        archive_folder=archive,
        failed_folder=failed,
        registry_path=registry,
        polling_interval_minutes=polling_interval_minutes,
    )
