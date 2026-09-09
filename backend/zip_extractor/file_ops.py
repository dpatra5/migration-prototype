import shutil
import time
from pathlib import Path

DELETE_RETRIES = 6
DELETE_BACKOFF_SEC = 1.0


def robust_delete(path: Path) -> tuple[bool, str]:
    """Retry-delete a file; returns (ok, error_message)."""
    last_err = ""
    for attempt in range(1, DELETE_RETRIES + 1):
        try:
            path.unlink()
            return True, ""
        except FileNotFoundError:
            return True, ""
        except PermissionError as e:
            last_err = f"PermissionError: {e}"
            time.sleep(DELETE_BACKOFF_SEC * attempt)
        except Exception as e:
            return False, f"{type(e).__name__}: {e}"
    return False, last_err


def unique_target_name(target: Path) -> Path:
    """If `target` exists, produce `stem_duplicate_N.suffix` that doesn't exist."""
    if not target.exists():
        return target
    stem, suffix, parent = target.stem, target.suffix, target.parent
    n = 1
    while True:
        candidate = parent / f"{stem}_duplicate_{n}{suffix}"
        if not candidate.exists():
            return candidate
        n += 1


def safe_move_file(src: Path, dst_dir: Path) -> Path:
    """Move a file into `dst_dir`, renaming on conflict. Returns the final path."""
    target = unique_target_name(dst_dir / src.name)
    shutil.move(str(src), str(target))
    return target


def merge_directory(src: Path, dst: Path) -> None:
    """Recursively merge `src` into `dst`. Files get renamed on conflict; folders merge."""
    dst.mkdir(parents=True, exist_ok=True)
    for child in list(src.iterdir()):
        target = dst / child.name
        if child.is_dir():
            if target.exists() and target.is_dir():
                merge_directory(child, target)
                try:
                    child.rmdir()
                except OSError:
                    shutil.rmtree(child, ignore_errors=True)
            else:
                shutil.move(str(child), str(target))
        else:
            safe_move_file(child, dst)


def remove_empty_dirs(root: Path) -> int:
    """Recursively remove empty directories under `root` (excluding root). Returns count removed."""
    removed = 0
    dirs = sorted(
        (p for p in root.rglob("*") if p.is_dir()),
        key=lambda p: -len(p.parts),
    )
    for d in dirs:
        try:
            if not any(d.iterdir()):
                d.rmdir()
                removed += 1
        except OSError:
            pass
    return removed
