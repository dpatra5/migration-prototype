"""Archive the original ZIP or move it to the failed folder."""
from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from .logging_setup import get_logger


class ArchiveManager:
    def __init__(self, archive_folder: Path, failed_folder: Path) -> None:
        self.archive_folder = archive_folder
        self.failed_folder = failed_folder
        self._log = get_logger()

    def archive(self, zip_path: Path) -> Path:
        return self._move(zip_path, self.archive_folder, label="Archive")

    def move_to_failed(self, zip_path: Path) -> Path:
        return self._move(zip_path, self.failed_folder, label="Failed")

    def _move(self, zip_path: Path, target_root: Path, label: str) -> Path:
        target_root.mkdir(parents=True, exist_ok=True)
        destination = target_root / zip_path.name
        if destination.exists():
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            destination = target_root / f"{zip_path.stem}__{stamp}{zip_path.suffix}"
        shutil.move(str(zip_path), str(destination))
        self._log.info("%s completed: %s -> %s", label, zip_path.name, destination)
        return destination
