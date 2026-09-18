"""Agent entry-point: orchestrates Part A (hierarchy) and Part B (mapping)."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Callable, Optional

from .hierarchy import TMF_HIERARCHY, build_hierarchy, unclassified_folder_path
from .mapper import (
    MappingSummary,
    ProgressCallback,
    map_source_to_destination,
    write_mapping_log,
    write_summary_report,
)

log = logging.getLogger(__name__)


def _hierarchy_exists(destination_root: Path) -> bool:
    """Cheap check: destination root exists and contains at least one zone folder."""
    if not destination_root.exists():
        return False
    # Look for any expected zone folder.
    for zone_num, zone in TMF_HIERARCHY.items():
        expected = destination_root / f"{zone_num} - {zone['name']}"
        if expected.exists():
            return True
    return False


def run_agent(
    source_folder: Path,
    destination_root: Path,
    overwrite_existing: bool = False,
    progress_callback: Optional[ProgressCallback] = None,
) -> MappingSummary:
    """Run the full agent: ensure hierarchy exists, then map documents."""
    source_folder = Path(source_folder)
    destination_root = Path(destination_root)

    # Part A: create hierarchy if not present (idempotent either way).
    if not _hierarchy_exists(destination_root):
        log.info("Destination hierarchy missing — running Part A (one-time setup).")
        zones, sections, artifacts, unc = build_hierarchy(destination_root)
        log.info(
            "Part A created: zones=%d sections=%d artifacts=%d unclassified=%d",
            zones, sections, artifacts, unc,
        )
    else:
        # Still call build_hierarchy to fill in any missing folders idempotently.
        build_hierarchy(destination_root)

    # Part B: map documents.
    if not source_folder.exists():
        log.warning("Source folder does not exist: %s", source_folder)
        summary = MappingSummary(source_folder=source_folder, destination_root=destination_root)
        write_summary_report(destination_root, summary)
        return summary

    results, summary = map_source_to_destination(
        source_folder=source_folder,
        destination_root=destination_root,
        overwrite_existing=overwrite_existing,
        progress_callback=progress_callback,
    )
    write_mapping_log(destination_root, results)
    write_summary_report(destination_root, summary)

    _print_user_summary(summary)
    return summary


def _print_user_summary(summary: MappingSummary) -> None:
    print("")
    print("TMF Mapping complete.")
    print(f"  Scanned: {summary.total_scanned}   Placed: {summary.total_placed}   Duplicates skipped: {summary.duplicates_skipped}   Failed: {summary.failed}")
    print(f"  Unclassified: {summary.by_method.get('unclassified', 0)}")
    if summary.unclassified_files:
        print("  Unclassified files needing manual attention:")
        for p in summary.unclassified_files:
            print(f"    - {p}")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m mapping.agent",
        description="TMF folder hierarchy builder and document mapper agent.",
    )
    parser.add_argument("--source", required=True, help="Source folder with unzipped documents.")
    parser.add_argument("--destination", required=True, help="Destination TMF root folder.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing files at destination.")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging.")
    return parser


def main(argv: Optional[list] = None) -> int:
    args = _build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    run_agent(
        source_folder=Path(args.source),
        destination_root=Path(args.destination),
        overwrite_existing=args.overwrite,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
