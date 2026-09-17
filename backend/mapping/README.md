# TMF Mapping Agent

A standalone module that:

- **Part A** — Builds the complete 3-level TMF folder hierarchy (Zones → Sections → Artifacts) plus `_Unclassified/` under a destination root. Idempotent: existing folders are skipped.
- **Part B** — Scans a source folder of already-unzipped documents and copies each file into the correct TMF folder based on the **folder path** only (filenames are ignored). Writes `mapping_log.csv` and `summary_report.txt` at the destination root.

This module is completely isolated in `backend/mapping/`. It does **not** modify any existing shared folder or module.

## Layout

```
backend/mapping/
├── __init__.py       # public exports
├── agent.py          # CLI + orchestrator (run_agent)
├── hierarchy.py      # TMF_HIERARCHY data + build_hierarchy (Part A)
├── mapper.py         # scan/match/copy + reports (Part B)
└── README.md
```

## Usage

### As a CLI

From `backend/`:

```powershell
python -m mapping.agent --source "C:\path\to\unzipped_source" --destination "C:\path\to\tmf_root"
```

Options:
- `--overwrite` — overwrite existing files at destination (default: append `_1`, `_2`, …)
- `-v` / `--verbose` — debug logging

### As a library

```python
from pathlib import Path
from mapping import run_agent

summary = run_agent(
    source_folder=Path("C:/unzipped_source"),
    destination_root=Path("C:/tmf_root"),
    overwrite_existing=False,
)
print(summary.total_placed, summary.by_method)
```

## Mapping rule

Classification is driven **only by the folder path** of each file:

1. Walk the file's parent folders from **deepest to shallowest**.
2. The first folder whose name contains a valid TMF number (`XX.XX.XX`, `XX_XX_XX`, `XX-XX-XX`, `XX XX XX`, `XXXXXX`, `XX.XX`, `XX_XX`, `XX-XX`, `XX XX`) determines where the file goes.
3. If nothing along the chain resolves, the file is copied to `<destination_root>/_Unclassified/`.

Consequences:
- Filenames are **never** used to classify — they can be in any language (English, Portuguese, Spanish, …) and may contain dates or numbers without affecting placement.
- All documents inside a matched folder (and any of its non-numbered subfolders) go to the same TMF destination.
- Zone-level (Level 1) placement is never allowed — if only a zone number is found, the file is sent to `_Unclassified`.

## Outputs at destination root

- `mapping_log.csv` — one row per file: `SourceFileName, SourceFullPath, DestinationFullPath, MatchMethod, MatchConfidence, Status`
- `summary_report.txt` — timestamped run summary with per-method counts and lists of unclassified and failed files.

## Notes

- Files are **copied** (not moved). Duplicate filenames at destination get `_1`, `_2`, … suffixes unless `--overwrite` is set.
- System files ignored: `.DS_Store`, `Thumbs.db`, `desktop.ini`, `.gitkeep`, `__MACOSX/`, and any dotfile.
- Running the agent multiple times against the same source is safe (duplicate suffixing handles re-runs).
