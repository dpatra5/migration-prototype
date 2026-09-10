"""Helpers for opening/saving openpyxl workbooks when they may be held open in Excel."""
from __future__ import annotations

import time
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook, load_workbook

from .logging_setup import get_logger


def load_workbook_with_retry(path: Path, attempts: int = 6, delay: float = 0.5) -> Workbook:
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            return load_workbook(path)
        except PermissionError as exc:
            last_exc = exc
            get_logger().warning(
                "Workbook %s is locked (attempt %d/%d): %s", path, i + 1, attempts, exc
            )
            time.sleep(delay * (i + 1))
    raise PermissionError(
        f"Workbook is locked (probably open in Excel): {path}"
    ) from last_exc


def save_workbook_with_retry(wb: Workbook, path: Path, attempts: int = 6, delay: float = 0.5) -> Path:
    """Save `wb` to `path`, retrying on PermissionError.

    If `path` stays locked (e.g. the file is open in Excel), fall back to a
    sidecar file `<stem>.pending-<timestamp><suffix>` next to it and return the
    fallback path. This guarantees the row is not lost.
    """
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            wb.save(path)
            return path
        except PermissionError as exc:
            last_exc = exc
            get_logger().warning(
                "Cannot save %s (attempt %d/%d): %s", path, i + 1, attempts, exc
            )
            time.sleep(delay * (i + 1))

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    fallback = path.with_name(f"{path.stem}.pending-{stamp}{path.suffix}")
    try:
        wb.save(fallback)
    except OSError as exc:
        raise PermissionError(
            f"Cannot save workbook (target locked and fallback failed): {path}"
        ) from exc
    get_logger().error(
        "Primary workbook is still locked (probably open in Excel); saved fallback to %s. "
        "Close Excel and merge/rename this file back to %s.",
        fallback,
        path.name,
    )
    if last_exc is not None:
        get_logger().debug("Original lock error: %s", last_exc)
    return fallback
