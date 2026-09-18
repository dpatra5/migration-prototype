"""One-shot cleanup: purge the ad-hoc `J-001 / Smoke Study` row from the
dashboard's SQLite `jobs` table (and any child rows in `job_files`).

The row was inserted from a manual test call and is not produced by any code
path in the repo, so the delete is safe and idempotent.
"""
from __future__ import annotations

import shutil
import sqlite3
import sys
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent.parent / "migration.db"


def main() -> int:
    if not DB_PATH.exists():
        print(f"DB not found: {DB_PATH}")
        return 1

    backup = DB_PATH.with_suffix(DB_PATH.suffix + ".bak")
    if not backup.exists():
        shutil.copy2(DB_PATH, backup)
        print(f"backup -> {backup}")

    conn = sqlite3.connect(DB_PATH)
    try:
        files_deleted = conn.execute(
            "DELETE FROM job_files "
            "WHERE job_id IN (SELECT id FROM jobs "
            "                 WHERE job_ref = 'J-001' AND study = 'Smoke Study')"
        ).rowcount
        jobs_deleted = conn.execute(
            "DELETE FROM jobs WHERE job_ref = 'J-001' AND study = 'Smoke Study'"
        ).rowcount
        conn.commit()
    finally:
        conn.close()

    print(f"deleted: jobs={jobs_deleted} job_files={files_deleted}")

    conn = sqlite3.connect(DB_PATH)
    try:
        remaining = list(conn.execute("SELECT id, job_ref, study FROM jobs ORDER BY id"))
    finally:
        conn.close()
    print("remaining jobs:")
    for row in remaining:
        print(f"  {row}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
