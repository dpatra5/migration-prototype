import os
import zipfile
from pathlib import Path


def _long_path(dest: Path) -> Path:
    """Return `dest` prefixed with \\?\\ on Windows so paths can exceed MAX_PATH (260)."""
    if os.name != "nt":
        return dest
    s = str(dest)
    if s.startswith("\\\\?\\"):
        return dest
    if s.startswith("\\\\"):
        return Path("\\\\?\\UNC\\" + s.lstrip("\\"))
    return Path("\\\\?\\" + s)


def validate_and_extract(zip_path: Path, dest: Path) -> None:
    """Extract `zip_path` into `dest`, rejecting zip-slip and absolute paths.

    Uses the Windows extended-length prefix so long paths (>260 chars) work.
    """
    dest = dest.resolve()
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        for info in z.infolist():
            name = info.filename
            if name.startswith(("/", "\\")) or (len(name) > 1 and name[1] == ":"):
                raise RuntimeError(f"Absolute path in {zip_path}: {name}")
            target = (dest / name).resolve()
            try:
                target.relative_to(dest)
            except ValueError as e:
                raise RuntimeError(f"Zip-slip in {zip_path}: {name}") from e
        z.extractall(_long_path(dest))
