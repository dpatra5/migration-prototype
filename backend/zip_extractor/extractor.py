"""CLI entry: python extractor.py <zip_path> [--output <dir>] [--keep-source]"""
import argparse
import sys
from pathlib import Path

# Allow running this file directly from inside the package folder.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from zip_extractor import run_pipeline


def main() -> int:
    p = argparse.ArgumentParser(description="Recursively extract a ZIP, clean duplicates, and report.")
    p.add_argument("zip_path", type=Path, help="Path to the ZIP file to extract")
    p.add_argument("--output", type=Path, default=None, help="Parent directory for the extraction folder (default: alongside the zip)")
    p.add_argument("--delete-source", action="store_true", help="Delete the input ZIP after successful extraction (default: keep it)")
    p.add_argument("--collapse-wrappers", action="store_true", help="Collapse duplicate folder wrappers like ABC/abc/ -> ABC/ (default: off)")
    p.add_argument("--remove-empty", action="store_true", help="Remove empty folders after extraction (default: off)")
    p.add_argument("--fresh", action="store_true", help="Delete the extraction folder before starting (recover from a prior polluted run)")
    args = p.parse_args()

    try:
        run_pipeline(
            args.zip_path,
            output_root=args.output,
            delete_source_zip=args.delete_source,
            collapse_wrappers=args.collapse_wrappers,
            remove_empty=args.remove_empty,
            fresh=args.fresh,
        )
    except FileNotFoundError as e:
        print(str(e))
        return 1
    except Exception as e:
        print(f"Fatal: {type(e).__name__}: {e}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
