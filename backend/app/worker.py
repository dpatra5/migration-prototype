from datetime import datetime, timezone

from sqlalchemy.orm import Session

from .connector import iter_source_files
from .loader import load_record, load_to_unclassified
from .matcher import match_path
from .models import MigrationRecord, MigrationStatus


def run_pull(db: Session) -> dict:
    """Scan source, match paths, migrate or classify, persist status in DB."""
    stats = {"scanned": 0, "matched": 0, "unclassified": 0, "success": 0, "failed": 0, "skipped": 0}

    for rec in iter_source_files():
        stats["scanned"] += 1

        existing = db.query(MigrationRecord).filter_by(source_id=rec["source_id"]).first()
        if existing and existing.status == MigrationStatus.SUCCESS:
            stats["skipped"] += 1
            continue

        match = match_path(rec["study"], rec["country"], rec["site"])

        if not existing:
            row = MigrationRecord(
                source_id=rec["source_id"],
                study=rec["study"],
                country=rec["country"],
                site=rec["site"],
                file_type=rec["file_type"],
                file_path=rec["file_path"],
            )
            db.add(row)
            db.flush()
        else:
            row = existing

        if not match["matched"]:
            try:
                result = load_to_unclassified(rec)
                row.status = MigrationStatus.UNCLASSIFIED
                row.dest_path = result.get("path")
                row.error_message = match["reason"]
                stats["unclassified"] += 1
            except Exception as e:
                row.status = MigrationStatus.FAILED
                row.error_message = str(e)
                stats["failed"] += 1
        else:
            stats["matched"] += 1
            try:
                result = load_record(rec)
                row.status = MigrationStatus.SUCCESS
                row.dest_path = result.get("path") or result.get("extracted_to")
                row.error_message = None
                stats["success"] += 1
            except Exception as e:
                row.status = MigrationStatus.FAILED
                row.error_message = str(e)
                row.retry_count += 1
                stats["failed"] += 1

        row.updated_at = datetime.now(timezone.utc)
        db.commit()

    return stats


def retry_failed(db: Session) -> dict:
    """Retry all failed records."""
    failed = db.query(MigrationRecord).filter_by(status=MigrationStatus.FAILED).all()
    stats = {"retried": 0, "success": 0, "failed": 0}

    for row in failed:
        stats["retried"] += 1
        rec = {
            "source_id": row.source_id,
            "study": row.study,
            "country": row.country,
            "site": row.site,
            "file_type": row.file_type,
            "file_path": row.file_path,
        }
        if row.file_type == "json":
            from pathlib import Path
            import json
            try:
                rec["payload"] = json.loads(Path(row.file_path).read_text(encoding="utf-8"))
            except Exception:
                rec["payload"] = None

        match = match_path(row.study, row.country, row.site)
        if not match["matched"]:
            row.error_message = match["reason"]
            row.status = MigrationStatus.UNCLASSIFIED
            stats["failed"] += 1
        else:
            try:
                result = load_record(rec)
                row.status = MigrationStatus.SUCCESS
                row.dest_path = result.get("path") or result.get("extracted_to")
                row.error_message = None
                stats["success"] += 1
            except Exception as e:
                row.error_message = str(e)
                stats["failed"] += 1

        row.retry_count += 1
        row.updated_at = datetime.now(timezone.utc)
        db.commit()

    return stats
