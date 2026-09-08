# Migration Prototype

A local M-BOX to VTMF migration prototype with a FastAPI backend and a React/Vite frontend.

## Prerequisites

Install the following before starting:

- Git
- Python 3.10 or newer, available through the Windows `py` launcher
- Node.js 18 or newer, including npm

## Clone the repository

From PowerShell:

```powershell
git clone https://github.com/dpatra5/migration-prototype.git
cd migration-prototype
```

## Install the backend

Create a Python virtual environment and install the backend dependencies:

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Generate the local sample source and destination folders when needed:

```powershell
.venv\Scripts\python.exe scripts\generate_local_structure.py
```

## Install the frontend

From the repository root:

```powershell
cd ..
npm --prefix frontend install
```

## Run the project

Start the backend in one PowerShell window:

```powershell
cd C:\Projects\migration-prototype\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8082
```

The backend is available at `http://localhost:8082`.

Start the frontend in a second PowerShell window:

```powershell
cd C:\Projects\migration-prototype
npm --prefix frontend run dev
```

Open the frontend at `http://localhost:5173`.

Interactive API documentation is available at `http://localhost:8082/docs`.

## Run the frontend production build

```powershell
cd C:\Projects\migration-prototype
npm --prefix frontend run build
npm --prefix frontend run preview
```

## Main backend endpoints

- `POST /pull` - scan and migrate matching source files
- `POST /retry` - retry failed migration records
- `GET /summary` - retrieve migration status counts
- `GET /records?status=` - list migration records, optionally filtered by status

## Project structure

```text
backend/    FastAPI application, migration worker, and local sample data
frontend/   React/Vite user interface
```
