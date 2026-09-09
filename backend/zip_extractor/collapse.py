import shutil
from pathlib import Path

from .file_ops import merge_directory


def collapse_duplicate_wrappers(root: Path) -> int:
    """Collapse folders that contain a single subfolder with the same (case-insensitive) name.

    e.g. `SMF_CERES/smf_ceres/report.pdf` -> `SMF_CERES/report.pdf`.
    Returns the number of collapses performed. Runs until stable.
    """
    total = 0
    while True:
        collapsed_this_pass = 0
        # Bottom-up so inner duplicates collapse first.
        for folder in sorted(
            (p for p in root.rglob("*") if p.is_dir()),
            key=lambda p: -len(p.parts),
        ):
            if not folder.exists():
                continue
            try:
                children = list(folder.iterdir())
            except FileNotFoundError:
                continue
            if len(children) != 1:
                continue
            child = children[0]
            if not child.is_dir() or child.name.lower() != folder.name.lower():
                continue
            print(f"Collapsing duplicate folder:\n  {child}")
            merge_directory(child, folder)
            try:
                child.rmdir()
            except OSError:
                shutil.rmtree(child, ignore_errors=True)
            collapsed_this_pass += 1
        total += collapsed_this_pass
        if collapsed_this_pass == 0:
            return total
