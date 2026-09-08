Migration Prototype (standalone)

Structure:
- backend/: FastAPI-like scaffold (minimal)
- frontend/: Vite + React prototype

Usage (backend):

Windows PowerShell example:

```powershell
cd C:\Projects\migration-prototype\backend
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
# generate local folders
.venv\Scripts\python.exe scripts\generate_local_structure.py
# run server
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8082
```

The backend includes a small `worker` that can copy/extract files from `local_mbox` into `local_vtmf`.

Usage (frontend):

From the project root, run:

```powershell
npm --prefix frontend run dev
```

Then open http://localhost:5173/ in your browser.
