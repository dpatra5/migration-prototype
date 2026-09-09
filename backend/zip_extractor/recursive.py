from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from .file_ops import robust_delete
from .safe_extract import validate_and_extract

MAX_PASSES = 50


@dataclass
class ZipRecord:
    zip_name: str
    original_path: str
    status: str  # "SUCCESS" or "FAILED"
    deleted: str  # "Y" or "N"
    error: str
    timestamp: str


@dataclass
class ExtractionStats:
    found: int = 0
    succeeded: int = 0
    failed: int = 0
    deleted: int = 0
    records: list[ZipRecord] = field(default_factory=list)


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def extract_all_recursive(root: Path) -> ExtractionStats:
    """Recursively extract every .zip under `root`, deleting only on success."""
    stats = ExtractionStats()
    processed: set[Path] = set()

    for pass_num in range(1, MAX_PASSES + 1):
        zips = [p for p in root.rglob("*.zip") if p.resolve() not in processed]
        if not zips:
            break
        print(f"\n--- Pass {pass_num}: {len(zips)} zip(s) ---")
        for zip_file in zips:
            processed.add(zip_file.resolve())
            stats.found += 1
            original = str(zip_file)
            print(f"\nExtracting: {zip_file.name}")
            try:
                validate_and_extract(zip_file, zip_file.parent)
            except Exception as e:
                msg = f"{type(e).__name__}: {e}"
                print(f"FAILED: {msg}")
                stats.failed += 1
                stats.records.append(ZipRecord(
                    zip_name=zip_file.name,
                    original_path=original,
                    status="FAILED",
                    deleted="N",
                    error=msg,
                    timestamp=_now(),
                ))
                continue

            stats.succeeded += 1
            ok, err = robust_delete(zip_file)
            if ok:
                print(f"Deleted: {zip_file.name}")
                stats.deleted += 1
                stats.records.append(ZipRecord(
                    zip_name=zip_file.name,
                    original_path=original,
                    status="SUCCESS",
                    deleted="Y",
                    error="",
                    timestamp=_now(),
                ))
            else:
                print(f"Extracted but could not delete: {err}")
                stats.records.append(ZipRecord(
                    zip_name=zip_file.name,
                    original_path=original,
                    status="SUCCESS",
                    deleted="N",
                    error=f"Delete failed: {err}",
                    timestamp=_now(),
                ))
    else:
        print(f"\nStopped after MAX_PASSES={MAX_PASSES}; some zips may remain.")

    return stats
