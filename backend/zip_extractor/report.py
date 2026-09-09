import csv
from pathlib import Path

from .recursive import ZipRecord

REPORT_COLUMNS = [
    "ZIP Name",
    "Original Path",
    "Extraction Status",
    "Deleted (Y/N)",
    "Error Message",
    "Timestamp",
]


def write_report(csv_path: Path, records: list[ZipRecord]) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(REPORT_COLUMNS)
        for r in records:
            w.writerow([
                r.zip_name,
                r.original_path,
                r.status,
                r.deleted,
                r.error,
                r.timestamp,
            ])
