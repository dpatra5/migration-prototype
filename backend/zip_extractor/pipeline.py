from pathlib import Path
import shutil

from .collapse import collapse_duplicate_wrappers
from .file_ops import remove_empty_dirs, robust_delete
from .recursive import extract_all_recursive
from .report import write_report
from .safe_extract import validate_and_extract


def run_pipeline(
    zip_path: Path,
    output_root: Path | None = None,
    delete_source_zip: bool = False,
    collapse_wrappers: bool = False,
    remove_empty: bool = False,
    fresh: bool = False,
) -> Path:
    """Extract `zip_path` into a dedicated folder named after the zip stem, recursively.

    By default the source zip is preserved and the extracted tree is left exactly as
    it appeared inside the archive (no folder flattening, no empty-folder cleanup).
    Enable `collapse_wrappers` / `remove_empty` explicitly if you want that behavior.

    Returns the extraction directory.
    """
    zip_path = zip_path.resolve()
    if not zip_path.is_file():
        raise FileNotFoundError(f"ZIP not found: {zip_path}")

    output_root = (output_root or zip_path.parent).resolve()
    extract_dir = output_root / zip_path.stem
    if fresh and extract_dir.exists():
        print(f"--fresh: removing existing {extract_dir}")
        shutil.rmtree(extract_dir, ignore_errors=True)
    extract_dir.mkdir(parents=True, exist_ok=True)

    print(f"Extracting: {zip_path.name} -> {extract_dir}")
    validate_and_extract(zip_path, extract_dir)
    print(f"Extracted root zip: {zip_path.name}")

    root_deleted = False
    if delete_source_zip:
        ok, err = robust_delete(zip_path)
        root_deleted = ok
        print(f"Deleted source zip: {zip_path.name}" if ok else f"Could not delete source zip: {err}")

    stats = extract_all_recursive(extract_dir)

    collapsed = 0
    if collapse_wrappers:
        print("\n--- Collapsing duplicate folder wrappers ---")
        collapsed = collapse_duplicate_wrappers(extract_dir)

    empties = 0
    if remove_empty:
        print("\n--- Removing empty folders ---")
        empties = remove_empty_dirs(extract_dir)

    report_path = extract_dir / "extraction_report.csv"
    write_report(report_path, stats.records)

    print("\n============ SUMMARY ============")
    print(f"Total ZIPs found:            {stats.found}")
    print(f"Successfully extracted:      {stats.succeeded}")
    print(f"Failed:                      {stats.failed}")
    print(f"Deleted after extraction:    {stats.deleted}{' (+ source zip)' if root_deleted else ''}")
    print(f"Duplicate folders collapsed: {collapsed}")
    print(f"Empty folders removed:       {empties}")
    print(f"Source zip preserved:        {'No' if root_deleted else 'Yes'}")
    print(f"Report:                      {report_path}")
    print(f"Extraction directory:        {extract_dir}")
    print("=================================")

    failed = [r for r in stats.records if r.status == "FAILED"]
    if failed:
        print("\nFailed zips (kept for manual review):")
        for r in failed:
            print(f"  - {r.original_path}\n      {r.error}")

    return extract_dir
