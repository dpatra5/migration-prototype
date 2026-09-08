# zip_extractor

Recursive ZIP extraction package used by the SprintGuard backend.

## Why this folder exists

`zip_extractor/` is a small, self-contained package that handles a task the rest of
the backend does not: safely unpacking arbitrarily nested ZIP archives (zips inside
zips), cleaning up the resulting tree, and producing a report. It is imported by
backend code (via `from zip_extractor import run_pipeline`) and is also runnable as
a standalone CLI through `extractor.py` (kept inside this folder).

Keeping it as its own package:

- isolates the extraction logic from Jira / LLM / API concerns,
- makes the modules individually testable (`safe_extract`, `recursive`, `collapse`,
  `file_ops`, `report`, `pipeline`),
- lets the CLI and the backend share the exact same pipeline.

## Modules

| File | Responsibility |
| --- | --- |
| `pipeline.py` | Orchestrates the full extract -> recurse -> (optional) collapse -> report flow. Exposes `run_pipeline`. |
| `safe_extract.py` | Validates a ZIP and extracts it while guarding against Zip Slip / unsafe paths. |
| `recursive.py` | Walks the extracted tree and extracts any nested ZIPs it finds. |
| `collapse.py` | Optional cleanup of duplicate wrapper folders (e.g. `ABC/abc/` -> `ABC/`). |
| `file_ops.py` | Filesystem helpers: robust delete, empty-directory pruning. |
| `report.py` | Writes a summary report of what was extracted. |
| `extractor.py` | CLI entry point. |
| `__init__.py` | Public API: re-exports `run_pipeline`. |

## Programmatic use

```python
from pathlib import Path
from zip_extractor import run_pipeline

extract_dir = run_pipeline(
    Path("archive.zip"),
    output_root=Path("C:/ex"),
    fresh=True,
)
```

## CLI use

Run from the `backend/` directory so that the `zip_extractor` package is importable:

```powershell
python zip_extractor/extractor.py "C:\path\to\archive.zip" --output "C:\ex" --fresh
```

Options:

- `--output <dir>` — parent directory for the extraction folder (default: alongside the zip).
- `--delete-source` — delete the input ZIP after successful extraction.
- `--collapse-wrappers` — collapse duplicate folder wrappers like `ABC/abc/` -> `ABC/`.
- `--remove-empty` — remove empty folders after extraction.
- `--fresh` — delete the extraction folder before starting (recover from a prior polluted run).
