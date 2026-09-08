# Migration Prototype

A FastAPI backend and Vite + React frontend for the M-BOX to VTMF migration prototype.

## Prerequisites

- Git
- Python 3.10 or newer, available through the Windows `py` launcher
- Node.js and npm

## Clone the project

```powershell
git clone https://github.com/dpatra5/migration-prototype.git
cd migration-prototype
```

## Install the backend

Run these commands from the project root:

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The backend includes a small worker that can copy and extract files from `local_mbox` into `local_vtmf`. To regenerate the local sample folders:

```powershell
.venv\Scripts\python.exe scripts\generate_local_structure.py
```

## Install the frontend

Open a second PowerShell window at the project root:

```powershell
cd C:\Projects\migration-prototype
npm --prefix frontend install
```

## Run the project

Start the backend in the first PowerShell window:

```powershell
cd C:\Projects\migration-prototype\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8082
```

Start the frontend in the second PowerShell window:

```powershell
cd C:\Projects\migration-prototype
npm --prefix frontend run dev
```

Open the application at <http://localhost:5173/>.

The backend API and interactive documentation are available at <http://localhost:8082/> and <http://localhost:8082/docs>.

## Useful frontend commands

```powershell
npm --prefix frontend run build
npm --prefix frontend run preview
```
