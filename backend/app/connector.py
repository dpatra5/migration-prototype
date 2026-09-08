from pathlib import Path
import json
from typing import Iterator

LOCAL_MBOX = Path(__file__).resolve().parent.parent / "local_mbox"


def iter_source_files() -> Iterator[dict]:
    """Recursively scan local_mbox yielding records with study/country/site metadata."""
    if not LOCAL_MBOX.exists():
        return
    for p in sorted(LOCAL_MBOX.rglob("*")):
        if not p.is_file():
            continue
        try:
            rel = p.relative_to(LOCAL_MBOX)
        except Exception:
            continue
        parts = rel.parts
        if len(parts) < 4:
            continue
        study, country, site = parts[0], parts[1], parts[2]
        filename = parts[-1]
        source_id = f"{study}-{country}-{site}-{filename}"
        rec = {
            "source_id": source_id,
            "study": study,
            "country": country,
            "site": site,
            "file_path": str(p),
        }
        if p.suffix.lower() == ".json":
            try:
                rec["payload"] = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                rec["payload"] = None
            rec["file_type"] = "json"
        elif p.suffix.lower() in (".zip", ".tar", ".gz"):
            rec["file_type"] = "zip"
        else:
            rec["file_type"] = "file"
        yield rec
