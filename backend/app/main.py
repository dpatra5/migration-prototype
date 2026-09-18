from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from .db import get_db, init_db
from .hierarchy_stats import count_study_hierarchy
from .models import Job, JobFile, JobStatus, MigrationRecord, MigrationStatus
from .schemas import (
    DashboardJob,
    DashboardJobDetail,
    DashboardJobFile,
    DashboardMetrics,
    DashboardSnapshot,
    MigrationSummary,
    RecordOut,
    TransferReportJob,
    TransferReportResponse,
)
from . import transfer_report_reader
from .worker import retry_failed, run_pull

app = FastAPI(title="Migration Prototype Backend")

# Local filesystem folder where files uploaded from the Upload page are copied.
MIGRATION_TARGET_DIR = Path(r"C:\Users\DPatra5\Downloads\MigragionTarget")

# Destination root the extractor writes into; used to compute study/country/site rollups.
DEFAULT_DESTINATION = Path(r"C:\Users\ADas155\QuIn\POC\Destination")


def _destination_root() -> Path:
    import os

    return Path(os.getenv("DESTINATION_FOLDER", str(DEFAULT_DESTINATION)))


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


@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """Copies an uploaded migration source file to the local migration target folder."""
    MIGRATION_TARGET_DIR.mkdir(parents=True, exist_ok=True)
    destination = MIGRATION_TARGET_DIR / file.filename

    with destination.open("wb") as target:
        target.write(file.file.read())

    return {"status": "ok", "path": str(destination)}


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


# ---------------------------------------------------------------------------
# Dashboard API — live view of extractor Jobs + Destination coverage.
# ---------------------------------------------------------------------------


_JOB_STATUS_TO_UI = {
    JobStatus.PENDING: "Pending",
    JobStatus.RUNNING: "Running",
    JobStatus.DONE: "Done",
    JobStatus.PARTIAL: "Partial",
    JobStatus.FAILED: "Failed",
    JobStatus.REVOKED: "Revoked",
}


def _job_to_dashboard(job: Job) -> DashboardJob:
    # DB Job tracks scanned/placed/unclassified; treat placed+unclassified as "transferred".
    destination_files = (job.successful_files or 0) + (job.unclassified_files or 0)
    return DashboardJob(
        id=job.job_ref,
        jobRef=job.job_ref,
        study=job.study or job.zip_name,
        zipName=job.zip_name,
        sourceType=job.source_type,
        status=_JOB_STATUS_TO_UI.get(job.status, str(job.status.value if hasattr(job.status, "value") else job.status)),
        assignedBy=job.assigned_by,
        totalFiles=job.total_files,
        successfulFiles=job.successful_files,
        failedFiles=job.failed_files,
        unclassifiedFiles=job.unclassified_files,
        mappedFiles=job.successful_files,
        destinationFiles=destination_files,
        startedAt=job.started_at,
        finishedAt=job.finished_at,
        errorMessage=job.error_message,
    )


def _compute_metrics(db: Session) -> DashboardMetrics:
    totals = db.query(
        func.coalesce(func.sum(Job.total_files), 0),
        func.coalesce(func.sum(Job.successful_files), 0),
        func.coalesce(func.sum(Job.failed_files), 0),
        func.coalesce(func.sum(Job.unclassified_files), 0),
    ).one()
    total, success, failed, unclassified = (int(v) for v in totals)

    # Overlay counts from the extractor's transfer_report.xlsx so the dashboard
    # reflects historic runs that predate the SQLite Jobs table.
    excel_jobs = transfer_report_reader.read_jobs()
    excel_summary = transfer_report_reader.summarize(excel_jobs)
    total = max(total, excel_summary.totalSourceDocs)
    success = max(success, excel_summary.totalDestinationDocs)
    unclassified = max(unclassified, excel_summary.totalUnclassified)
    failed = max(failed, max(0, excel_summary.totalSourceDocs - excel_summary.totalDestinationDocs))

    studies, countries, sites = count_study_hierarchy(_destination_root())
    if studies == 0:
        studies = db.query(func.count(func.distinct(Job.study))).filter(Job.study.isnot(None)).scalar() or 0
    if studies == 0:
        studies = len(excel_summary.studies)

    return DashboardMetrics(
        total=total,
        success=success,
        failed=failed,
        unclassified=unclassified,
        studies=int(studies),
        countries=int(countries),
        sites=int(sites),
    )


_EXCEL_STATUS_TO_UI = {
    "COMPLETED": "Done",
    "FAILED": "Failed",
    "PARTIAL": "Partial",
    "RUNNING": "Running",
    "PENDING": "Pending",
    "REVOKED": "Revoked",
    "TRANSFERRED": "Done",
}


def _excel_job_to_dashboard(row: "transfer_report_reader.TransferJobRow") -> DashboardJob:
    started = _parse_excel_datetime(row.startedAt) or datetime.now(timezone.utc)
    finished = _parse_excel_datetime(row.finishedAt)
    status = _EXCEL_STATUS_TO_UI.get(row.status.upper(), "Done" if finished else "Running")
    source = max(row.sourceDocs, 0)
    destination = max(row.destinationDocs, 0)
    failed = max(0, source - destination)
    return DashboardJob(
        id=row.jobId,
        jobRef=row.jobId,
        study=row.study or row.sourceName,
        zipName=row.sourceName,
        sourceType=row.sourceType.lower() or "zip",
        status=status,
        assignedBy="Scheduler",
        totalFiles=source,
        successfulFiles=destination,
        failedFiles=failed,
        unclassifiedFiles=row.unclassifiedDocs,
        mappedFiles=row.mappedDocs,
        destinationFiles=destination,
        startedAt=started,
        finishedAt=finished,
        errorMessage=row.notes or None,
    )


def _parse_excel_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _merge_recent_jobs(db_jobs: list[DashboardJob], excel_jobs: list[DashboardJob], limit: int) -> list[DashboardJob]:
    """Union DB + Excel jobs. Prefer DB rows when both sides refer to the same zip name.

    Also dedupes by `jobRef` so the same job id can't appear twice in the
    Recent Migrations list when a rerun produces both a DB row and an Excel row
    that share the same J-nnn identifier.
    """
    seen: dict[str, DashboardJob] = {}
    order: list[str] = []
    seen_refs: set[str] = set()

    def _add(job: DashboardJob, *, overwrite: bool) -> None:
        key = job.zipName or job.jobRef
        if job.jobRef and job.jobRef in seen_refs and not overwrite:
            return
        if key not in seen:
            order.append(key)
        elif not overwrite:
            return
        seen[key] = job
        if job.jobRef:
            seen_refs.add(job.jobRef)

    for job in db_jobs:
        _add(job, overwrite=True)
    for job in excel_jobs:
        _add(job, overwrite=False)

    merged = [seen[k] for k in order]
    merged.sort(key=lambda j: j.startedAt, reverse=True)
    return merged[:limit]


@app.get("/dashboard/metrics", response_model=DashboardMetrics)
def dashboard_metrics(db: Session = Depends(get_db)):
    return _compute_metrics(db)


@app.get("/dashboard/jobs", response_model=list[DashboardJob])
def dashboard_jobs(
    limit: int = Query(20, ge=1, le=200),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Job)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(func.lower(Job.job_ref).like(like) | func.lower(Job.study).like(like))
    rows = q.order_by(Job.id.desc()).limit(limit).all()
    return [_job_to_dashboard(j) for j in rows]


@app.get("/dashboard/active", response_model=list[DashboardJob])
def dashboard_active(db: Session = Depends(get_db)):
    rows = (
        db.query(Job)
        .filter(Job.status == JobStatus.RUNNING)
        .order_by(Job.id.desc())
        .all()
    )
    return [_job_to_dashboard(j) for j in rows]


@app.get("/dashboard/snapshot", response_model=DashboardSnapshot)
def dashboard_snapshot(limit: int = Query(20, ge=1, le=200), db: Session = Depends(get_db)):
    """Single roundtrip: metrics + active + recent (used by frontend poller)."""
    metrics = _compute_metrics(db)
    active_rows = (
        db.query(Job).filter(Job.status == JobStatus.RUNNING).order_by(Job.id.desc()).all()
    )
    recent_rows = db.query(Job).order_by(Job.id.desc()).limit(limit).all()
    db_jobs = [_job_to_dashboard(j) for j in recent_rows]
    excel_jobs = [_excel_job_to_dashboard(r) for r in transfer_report_reader.read_jobs()]
    merged = _merge_recent_jobs(db_jobs, excel_jobs, limit)
    return DashboardSnapshot(
        metrics=metrics,
        active=[_job_to_dashboard(j) for j in active_rows],
        recent=merged,
        generatedAt=datetime.now(timezone.utc),
    )


@app.get("/dashboard/reports", response_model=TransferReportResponse)
def dashboard_reports(limit: int | None = Query(None, ge=1, le=1000)):
    """Read the extractor's transfer_report.xlsx and return all job rows."""
    rows = transfer_report_reader.read_jobs()
    summary = transfer_report_reader.summarize(rows)

    # Order by date (newest first), not by Job ID — IDs can collide between
    # the primary workbook and pending sidecars, so sheet order is unreliable.
    def _row_ts(row: "transfer_report_reader.TransferJobRow") -> datetime:
        return (
            _parse_excel_datetime(row.finishedAt)
            or _parse_excel_datetime(row.startedAt)
            or datetime.min
        )

    rows = sorted(rows, key=_row_ts, reverse=True)
    if limit is not None:
        rows = rows[:limit]
    # Report the file actually read (pending sidecar wins over locked primary).
    path = transfer_report_reader._pick_active_report(transfer_report_reader.report_path())
    return TransferReportResponse(
        jobs=[TransferReportJob(**row.__dict__) for row in rows],
        totalJobs=summary.totalJobs,
        totalMapped=summary.totalMapped,
        totalUnclassified=summary.totalUnclassified,
        totalSourceDocs=summary.totalSourceDocs,
        totalDestinationDocs=summary.totalDestinationDocs,
        statuses=summary.statuses,
        studies=sorted(summary.studies),
        reportPath=str(path),
        reportExists=path.exists(),
    )


@app.get("/dashboard/jobs/{job_ref}", response_model=DashboardJobDetail)
def dashboard_job_detail(job_ref: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter_by(job_ref=job_ref).first()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_ref} not found")
    files = (
        db.query(JobFile)
        .filter_by(job_id=job.id)
        .order_by(JobFile.id.desc())
        .limit(500)
        .all()
    )
    base = _job_to_dashboard(job).model_dump()
    return DashboardJobDetail(
        **base,
        files=[
            DashboardJobFile(
                fileName=f.file_name,
                status=f.status,
                destPath=f.dest_path,
                errorMessage=f.error_message,
                createdAt=f.created_at,
            )
            for f in files
        ],
    )


@app.post("/dashboard/jobs/{job_ref}/revoke", response_model=DashboardJob)
def dashboard_revoke_job(job_ref: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter_by(job_ref=job_ref).first()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_ref} not found")
    job.status = JobStatus.REVOKED
    job.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return _job_to_dashboard(job)


@app.post("/dashboard/jobs/{job_ref}/retry", response_model=DashboardJob)
def dashboard_retry_job(job_ref: str, db: Session = Depends(get_db)):
    """Mark a job as pending so the next scheduler scan reprocesses its source."""
    job = db.query(Job).filter_by(job_ref=job_ref).first()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_ref} not found")
    job.status = JobStatus.PENDING
    job.finished_at = None
    job.error_message = None
    db.commit()
    db.refresh(job)
    return _job_to_dashboard(job)

