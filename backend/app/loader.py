from pathlib import Path
import json
import zipfile
import shutil

LOCAL_VTMF = Path(__file__).resolve().parent.parent / "local_vtmf"
UNCLASSIFIED_DIR = Path(__file__).resolve().parent.parent / "local_unclassified"


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def load_record(record: dict) -> dict:
    """Write a record to the VTMF destination folder."""
    study = record["study"]
    country = record["country"]
    site = record["site"]
    dest = LOCAL_VTMF / study / country / site
    ensure_dir(dest)

    ft = record.get("file_type")
    if ft == "json":
        payload = record.get("payload") or {}
        out = dest / Path(record["file_path"]).name
        out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return {"status": "ok", "path": str(out)}
    elif ft == "zip":
        src = Path(record["file_path"])
        with zipfile.ZipFile(src, "r") as zf:
            zf.extractall(dest)
        return {"status": "ok", "extracted_to": str(dest)}
    else:
        src = Path(record["file_path"])
        dst = dest / src.name
        shutil.copy2(src, dst)
        return {"status": "ok", "path": str(dst)}


def load_to_unclassified(record: dict) -> dict:
    """Move a record to the unclassified folder when path matching fails."""
    study = record["study"]
    country = record["country"]
    site = record["site"]
    dest = UNCLASSIFIED_DIR / study / country / site
    ensure_dir(dest)

    src = Path(record["file_path"])
    dst = dest / src.name
    shutil.copy2(src, dst)
    return {"status": "unclassified", "path": str(dst)}
