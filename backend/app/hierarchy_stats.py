"""Walk the Destination folder to compute Study / Country / Site coverage.

Rules (heuristic):
- Top-level entries that look like TMF zones (start with two digits + " - ") are
  skipped (they belong to the TMF hierarchy, not the study/country/site rollup).
- The `_Unclassified` folder is also skipped.
- Every other top-level directory is treated as a Study; its immediate
  subdirectories are Countries; their subdirectories are Sites.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Tuple

_ZONE_PATTERN = re.compile(r"^\d{2}\s*-\s*")
_SYSTEM_DIRS = {"_Unclassified", "__MACOSX"}


def _iter_studies(destination_root: Path) -> Iterable[Path]:
    if not destination_root.exists() or not destination_root.is_dir():
        return
    for entry in destination_root.iterdir():
        if not entry.is_dir():
            continue
        if entry.name in _SYSTEM_DIRS:
            continue
        if _ZONE_PATTERN.match(entry.name):
            continue
        yield entry


def count_study_hierarchy(destination_root: Path) -> Tuple[int, int, int]:
    """Return (studies, countries, sites) counted from the destination tree."""
    studies = countries = sites = 0
    for study_dir in _iter_studies(destination_root):
        studies += 1
        for country_dir in study_dir.iterdir():
            if not country_dir.is_dir():
                continue
            countries += 1
            for site_dir in country_dir.iterdir():
                if site_dir.is_dir():
                    sites += 1
    return studies, countries, sites
