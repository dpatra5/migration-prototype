"""Document mapper (Part B).

Scans a source folder and maps each document to a TMF destination folder based
on the *folder path* only. Filenames are ignored for classification. Any file
whose containing folder chain has no resolvable TMF number goes to
``_Unclassified``.
"""

from __future__ import annotations

import csv
import hashlib
import logging
import os
import re
import shutil
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from .hierarchy import (
    TMF_HIERARCHY,
    artifact_folder_path,
    section_folder_path,
    unclassified_folder_path,
    zone_folder_name,
)

log = logging.getLogger(__name__)

IGNORED_FILENAMES = {".DS_Store", "Thumbs.db", "desktop.ini", ".gitkeep"}
IGNORED_PATH_PARTS = {"__MACOSX"}


def _long_path(p: Path) -> Path:
    """On Windows, prefix with \\?\\ to bypass the 260-char MAX_PATH limit."""
    if os.name != "nt":
        return p
    s = str(p)
    if s.startswith("\\\\?\\"):
        return p
    try:
        resolved = str(p.resolve())
    except OSError:
        resolved = os.path.abspath(s)
    if resolved.startswith("\\\\"):
        return Path("\\\\?\\UNC\\" + resolved.lstrip("\\"))
    return Path("\\\\?\\" + resolved)

# TMF number patterns. Longest matches (3-segment) take priority. Separators
# accepted: '.', '_', '-', and space.
_NUM_3 = re.compile(r"(?<!\d)(\d{2})[._\- ]?(\d{2})[._\- ]?(\d{2})(?!\d)")
_NUM_2 = re.compile(r"(?<!\d)(\d{2})[._\- ](\d{2})(?!\d)")
_NUM_2_STRICT = re.compile(r"(?<!\d)(\d{2})[._\-](\d{2})(?!\d)")
_NUM_6 = re.compile(r"(?<!\d)(\d{2})(\d{2})(\d{2})(?!\d)")
_NUM_1 = re.compile(r"(?<!\d)(\d{2})(?!\d)")


# ---------------------------------------------------------------------------
# Result records
# ---------------------------------------------------------------------------

@dataclass
class MappingResult:
    source_name: str
    source_path: Path
    destination_path: Optional[Path]
    match_method: str  # exact_number_path | unclassified
    match_confidence: float
    status: str  # success | failed:<reason>


@dataclass
class MappingSummary:
    source_folder: Path
    destination_root: Path
    total_scanned: int = 0
    by_method: Dict[str, int] = field(default_factory=lambda: {
        "exact_number_path": 0,
        "unclassified": 0,
    })
    failed: int = 0
    duplicates_skipped: int = 0
    unclassified_files: List[str] = field(default_factory=list)
    duplicate_files: List[Tuple[str, str]] = field(default_factory=list)
    failed_files: List[Tuple[str, str]] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def total_placed(self) -> int:
        return sum(self.by_method.values())


# ---------------------------------------------------------------------------
# Scan
# ---------------------------------------------------------------------------

def _is_ignored(path: Path) -> bool:
    if path.name in IGNORED_FILENAMES:
        return True
    if path.name.startswith("."):
        return True
    if any(part in IGNORED_PATH_PARTS for part in path.parts):
        return True
    return False


def scan_source(source_folder: Path) -> List[Path]:
    """Recursively list files in source, ignoring system junk.

    Uses os.walk with the Windows \\?\\ long-path prefix so that files buried
    beyond MAX_PATH (260 chars) are still discoverable.
    """
    if not source_folder.exists():
        return []
    root = _long_path(source_folder)
    found: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(str(root)):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_PATH_PARTS and not d.startswith(".")]
        for name in filenames:
            p = Path(dirpath) / name
            if not _is_ignored(p):
                found.append(p)
    return found


# ---------------------------------------------------------------------------
# Priority 1 & 2: TMF number extraction
# ---------------------------------------------------------------------------

def _iter_tmf_numbers(text: str) -> Iterable[str]:
    """Yield every candidate TMF number found in `text`, longest-first, de-duped."""
    seen: set[str] = set()

    def emit(num: str):
        if num not in seen:
            seen.add(num)
            return True
        return False

    # 3-segment matches first (highest specificity).
    for m in _NUM_3.finditer(text):
        num = f"{m.group(1)}.{m.group(2)}.{m.group(3)}"
        if emit(num):
            yield num
    # 6 consecutive digits (e.g., "010101") are equivalent to 3-segment.
    for m in _NUM_6.finditer(text):
        num = f"{m.group(1)}.{m.group(2)}.{m.group(3)}"
        if emit(num):
            yield num
    # 2-segment matches (section-level) — try strict separators first, then
    # space-separated as a fallback.
    for m in _NUM_2_STRICT.finditer(text):
        num = f"{m.group(1)}.{m.group(2)}"
        if emit(num):
            yield num
    for m in _NUM_2.finditer(text):
        num = f"{m.group(1)}.{m.group(2)}"
        if emit(num):
            yield num
    # Single 2-digit (zone-level) matches, lowest priority.
    for m in _NUM_1.finditer(text):
        num = m.group(1)
        if emit(num):
            yield num


def _resolve_number_to_folder(
    destination_root: Path, number: str
) -> Optional[Tuple[Path, str]]:
    """Map a normalized TMF number to a folder path.

    Returns (folder_path, "artifact"|"section") or None if number is unknown.
    """
    parts = number.split(".")
    if len(parts) == 3:
        zone, section_key = parts[0], f"{parts[0]}.{parts[1]}"
        if zone in TMF_HIERARCHY:
            zone_data = TMF_HIERARCHY[zone]
            if section_key in zone_data["sections"]:
                artifacts = zone_data["sections"][section_key]["artifacts"]
                if number in artifacts:
                    return (
                        artifact_folder_path(destination_root, zone, section_key, number),
                        "artifact",
                    )
                # Number not defined — fall back to section if section itself exists.
                return (
                    section_folder_path(destination_root, zone, section_key),
                    "section",
                )
        return None
    if len(parts) == 2:
        zone = parts[0]
        if zone in TMF_HIERARCHY and number in TMF_HIERARCHY[zone]["sections"]:
            return (
                section_folder_path(destination_root, zone, number),
                "section",
            )
        return None
    if len(parts) == 1:
        zone = parts[0]
        if zone in TMF_HIERARCHY:
            zone_name = TMF_HIERARCHY[zone]["name"]
            return (
                destination_root / zone_folder_name(zone, zone_name),
                "zone",
            )
        return None
    return None


def _first_resolvable(text: str, destination_root: Path) -> Optional[Tuple[Path, str]]:
    """Return the first TMF number in `text` that resolves to an artifact/section folder."""
    for number in _iter_tmf_numbers(text):
        resolved = _resolve_number_to_folder(destination_root, number)
        if resolved is not None:
            return resolved
    return None


def _match_by_path_number(
    file_path: Path, source_root: Path, destination_root: Path
) -> Optional[Tuple[Path, str, float]]:
    """Walk path segments from deepest to shallowest; return the first resolvable number."""
    try:
        rel = file_path.relative_to(source_root)
    except ValueError:
        rel = file_path
    # Segments excluding the file itself, deepest first.
    segments = list(rel.parts[:-1])
    for part in reversed(segments):
        resolved = _first_resolvable(part, destination_root)
        if resolved is not None:
            folder, _level = resolved
            return folder, "exact_number_path", 100.0
    return None


# ---------------------------------------------------------------------------
# Placement
# ---------------------------------------------------------------------------

def _unique_destination(dest_folder: Path, filename: str, overwrite: bool) -> Path:
    dest_folder = _long_path(dest_folder)
    dest_folder.mkdir(parents=True, exist_ok=True)
    target = dest_folder / filename
    if overwrite or not target.exists():
        return target
    stem = target.stem
    suffix = target.suffix
    i = 1
    while True:
        candidate = dest_folder / f"{stem}_{i}{suffix}"
        if not candidate.exists():
            return candidate
        i += 1


def _copy_with_retry(src: Path, dst: Path) -> Tuple[bool, str]:
    src = _long_path(src)
    dst = _long_path(dst)
    for attempt in (1, 2):
        try:
            shutil.copy2(src, dst)
            return True, ""
        except Exception as exc:  # noqa: BLE001
            last = f"{type(exc).__name__}: {exc}"
            log.warning("Copy attempt %d failed for %s -> %s: %s", attempt, src, dst, last)
    return False, last


def _sha256(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with _long_path(path).open("rb") as f:
        for block in iter(lambda: f.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def _index_folder_hashes(dest_folder: Path) -> Dict[str, Path]:
    """Hash every existing file directly inside `dest_folder` (non-recursive)."""
    index: Dict[str, Path] = {}
    dest_folder = _long_path(dest_folder)
    if not dest_folder.exists():
        return index
    for existing in dest_folder.iterdir():
        if existing.is_file():
            try:
                index[_sha256(existing)] = existing
            except OSError as exc:
                log.warning("Could not hash existing file %s: %s", existing, exc)
    return index


def _index_destination_hashes(destination_root: Path) -> Dict[str, Path]:
    """Hash every existing file anywhere under destination_root (recursive)."""
    index: Dict[str, Path] = {}
    root = _long_path(destination_root)
    if not root.exists():
        return index
    for dirpath, _, filenames in os.walk(str(root)):
        for name in filenames:
            if name in {"mapping_log.csv", "summary_report.txt"}:
                continue
            p = Path(dirpath) / name
            try:
                index.setdefault(_sha256(p), p)
            except OSError as exc:
                log.warning("Could not hash existing file %s: %s", p, exc)
    return index


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def map_source_to_destination(
    source_folder: Path,
    destination_root: Path,
    overwrite_existing: bool = False,
) -> Tuple[List[MappingResult], MappingSummary]:
    source_folder = Path(source_folder)
    destination_root = Path(destination_root)
    summary = MappingSummary(source_folder=source_folder, destination_root=destination_root)
    results: List[MappingResult] = []

    if not source_folder.exists():
        log.warning("Source folder does not exist: %s", source_folder)
        return results, summary

    files = scan_source(source_folder)
    summary.total_scanned = len(files)
    if not files:
        log.warning("Source folder is empty or has no eligible files: %s", source_folder)
        return results, summary

    # Destination-wide content-hash index; guarantees one copy per unique content.
    hash_index: Dict[str, Path] = _index_destination_hashes(destination_root)

    for file_path in files:
        match = _match_by_path_number(file_path, source_folder, destination_root)

        if match is None:
            dest_folder = unclassified_folder_path(destination_root)
            method = "unclassified"
            confidence = 0.0
        else:
            dest_folder, method, confidence = match

        dest_folder.mkdir(parents=True, exist_ok=True)

        try:
            src_hash = _sha256(file_path)
        except OSError as exc:
            summary.failed += 1
            summary.failed_files.append((str(file_path), f"hash error: {exc}"))
            results.append(MappingResult(
                source_name=file_path.name, source_path=file_path,
                destination_path=None, match_method=method,
                match_confidence=round(confidence, 2), status=f"failed:hash error: {exc}",
            ))
            continue

        if src_hash in hash_index:
            existing = hash_index[src_hash]
            summary.duplicates_skipped += 1
            summary.duplicate_files.append((str(file_path), str(existing)))
            results.append(MappingResult(
                source_name=file_path.name, source_path=file_path,
                destination_path=existing, match_method=method,
                match_confidence=round(confidence, 2), status="skipped:duplicate",
            ))
            continue

        target = _unique_destination(dest_folder, file_path.name, overwrite_existing)
        ok, err = _copy_with_retry(file_path, target)

        if ok:
            status = "success"
            summary.by_method[method] = summary.by_method.get(method, 0) + 1
            if method == "unclassified":
                summary.unclassified_files.append(str(file_path))
            hash_index[src_hash] = target
        else:
            status = f"failed:{err}"
            summary.failed += 1
            summary.failed_files.append((str(file_path), err))

        results.append(
            MappingResult(
                source_name=file_path.name,
                source_path=file_path,
                destination_path=target if ok else None,
                match_method=method,
                match_confidence=round(confidence, 2),
                status=status,
            )
        )

    return results, summary


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

def write_mapping_log(destination_root: Path, results: Iterable[MappingResult]) -> Path:
    log_path = Path(destination_root) / "mapping_log.csv"
    write_header = not log_path.exists()
    with log_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow([
                "SourceFileName", "SourceFullPath", "DestinationFullPath",
                "MatchMethod", "MatchConfidence", "Status",
            ])
        for r in results:
            writer.writerow([
                r.source_name,
                str(r.source_path),
                str(r.destination_path) if r.destination_path else "",
                r.match_method,
                r.match_confidence,
                r.status,
            ])
    return log_path


def write_summary_report(destination_root: Path, summary: MappingSummary) -> Path:
    report_path = Path(destination_root) / "summary_report.txt"
    lines = [
        "=" * 70,
        "TMF Mapping Summary Report",
        f"Timestamp: {summary.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Source folder: {summary.source_folder}",
        f"Destination root: {summary.destination_root}",
        "-" * 70,
        f"Total files scanned:            {summary.total_scanned}",
        f"Total files successfully placed:{summary.total_placed}",
        "",
        "Breakdown:",
        f"  Folder-path match:  {summary.by_method.get('exact_number_path', 0)}",
        f"  Unclassified:       {summary.by_method.get('unclassified', 0)}",
        f"  Duplicates skipped: {summary.duplicates_skipped}",
        f"  Failed:             {summary.failed}",
        "",
    ]
    if summary.unclassified_files:
        lines.append("Unclassified files (manual review needed):")
        lines.extend(f"  - {p}" for p in summary.unclassified_files)
        lines.append("")
    if summary.duplicate_files:
        lines.append("Duplicates skipped (identical content already at destination):")
        lines.extend(f"  - {src}  ==  {existing}" for src, existing in summary.duplicate_files)
        lines.append("")
    if summary.failed_files:
        lines.append("Failed files:")
        lines.extend(f"  - {p} :: {err}" for p, err in summary.failed_files)
        lines.append("")
    lines.append("=" * 70)
    report_path.write_text("\n".join(lines), encoding="utf-8")
    return report_path
