"""Windows long-path-safe filesystem helpers."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

_LONG_PREFIX = "\\\\?\\"
_UNC_PREFIX = "\\\\?\\UNC\\"


def _extended(path: Path) -> str:
    r"""Return an extended-length (\\?\) form of `path` on Windows so >260-char paths work."""
    resolved = os.path.abspath(str(path))
    if os.name != "nt":
        return resolved
    if resolved.startswith(_LONG_PREFIX):
        return resolved
    if resolved.startswith("\\\\"):
        return _UNC_PREFIX + resolved.lstrip("\\")
    return _LONG_PREFIX + resolved


def iter_files(root: Path) -> Iterator[tuple[Path, int]]:
    r"""Yield (path, size) for every file under `root`, tolerating long paths on Windows.

    `path` is returned as a normal Path (without the \\?\ prefix) so callers can
    display it. `size` is 0 on stat failure rather than raising.
    """
    if not root.exists():
        return
    start = _extended(root)
    for dirpath, _dirnames, filenames in os.walk(start, followlinks=False):
        for name in filenames:
            full = os.path.join(dirpath, name)
            try:
                size = os.path.getsize(full)
            except OSError:
                size = 0
            display = full
            if display.startswith(_UNC_PREFIX):
                display = "\\\\" + display[len(_UNC_PREFIX):]
            elif display.startswith(_LONG_PREFIX):
                display = display[len(_LONG_PREFIX):]
            yield Path(display), size
