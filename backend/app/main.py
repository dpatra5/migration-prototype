from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import get_db, init_db
from .models import MigrationRecord, MigrationStatus
from .schemas import RecordOut, MigrationSummary
from .worker import run_pull, retry_failed

app = FastAPI(title="Migration Prototype Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/pull")
def pull(db: Session = Depends(get_db)):
    """Scan local_mbox, match paths, migrate files to local_vtmf."""
    return run_pull(db)


@app.post("/retry")
def retry(db: Session = Depends(get_db)):
    """Retry all failed migration records."""
    return retry_failed(db)


@app.get("/summary", response_model=MigrationSummary)
def summary(db: Session = Depends(get_db)):
    total = db.query(MigrationRecord).count()
    return MigrationSummary(
        total=total,
        pending=db.query(MigrationRecord).filter_by(status=MigrationStatus.PENDING).count(),
        matched=db.query(MigrationRecord).filter_by(status=MigrationStatus.MATCHED).count(),
        success=db.query(MigrationRecord).filter_by(status=MigrationStatus.SUCCESS).count(),
        failed=db.query(MigrationRecord).filter_by(status=MigrationStatus.FAILED).count(),
        unclassified=db.query(MigrationRecord).filter_by(status=MigrationStatus.UNCLASSIFIED).count(),
    )


@app.get("/records", response_model=list[RecordOut])
def list_records(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(MigrationRecord)
    if status:
        q = q.filter(MigrationRecord.status == status)
    return q.order_by(MigrationRecord.id).all()


@app.get("/records/{record_id}", response_model=RecordOut)
def get_record(record_id: int, db: Session = Depends(get_db)):
    return db.query(MigrationRecord).filter_by(id=record_id).first()
