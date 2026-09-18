"""Bridge used by the zip_extractor scheduler to record job progress in the
shared SQLite DB read by the dashboard API.

Kept intentionally small so the extractor doesn't take on FastAPI dependencies.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func

from .db import SessionLocal, init_db
from .models import Job, JobFile, JobStatus


def _now() -> datetime:
    return datetime.now(timezone.utc)


class JobRecorder:
    """Thin facade over the Job/JobFile tables for use by the extractor."""

    def __init__(self) -> None:
        init_db()

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _next_job_ref(session) -> str:
        last_id = session.query(func.max(Job.id)).scalar() or 0
        return f"J-{last_id + 1:03d}"

    # ---------------------------------------------------------------- public API

    def start_job(
        self,
        zip_name: str,
        study: Optional[str] = None,
        source_type: str = "zip",
        fingerprint: Optional[str] = None,
        assigned_by: str = "Scheduler",
    ) -> str:
        with SessionLocal() as session:
            if fingerprint:
                existing = session.query(Job).filter_by(fingerprint=fingerprint).order_by(Job.id.desc()).first()
                if existing is not None:
                    existing.status = JobStatus.RUNNING
                    existing.started_at = _now()
                    existing.finished_at = None
                    existing.error_message = None
                    existing.successful_files = 0
                    existing.failed_files = 0
                    existing.unclassified_files = 0
                    existing.total_files = 0
                    session.commit()
                    return existing.job_ref

            job_ref = self._next_job_ref(session)
            job = Job(
                job_ref=job_ref,
                zip_name=zip_name,
                fingerprint=fingerprint,
                study=study or zip_name,
                source_type=source_type,
                status=JobStatus.RUNNING,
                assigned_by=assigned_by,
                started_at=_now(),
            )
            session.add(job)
            session.commit()
            return job_ref

    def finish_job(
        self,
        job_ref: str,
        *,
        status: JobStatus,
        total_files: int = 0,
        successful_files: int = 0,
        failed_files: int = 0,
        unclassified_files: int = 0,
        error_message: Optional[str] = None,
    ) -> None:
        with SessionLocal() as session:
            job = session.query(Job).filter_by(job_ref=job_ref).first()
            if job is None:
                return
            job.status = status
            job.total_files = total_files
            job.successful_files = successful_files
            job.failed_files = failed_files
            job.unclassified_files = unclassified_files
            job.error_message = error_message
            job.finished_at = _now()
            session.commit()

    def update_progress(
        self,
        job_ref: str,
        *,
        total_files: int,
        successful_files: int,
        failed_files: int,
        unclassified_files: int,
    ) -> None:
        """Write partial counts on a RUNNING job so the dashboard can render live progress."""
        with SessionLocal() as session:
            job = session.query(Job).filter_by(job_ref=job_ref).first()
            if job is None:
                return
            job.total_files = total_files
            job.successful_files = successful_files
            job.failed_files = failed_files
            job.unclassified_files = unclassified_files
            session.commit()

    def record_file(
        self,
        job_ref: str,
        *,
        file_name: str,
        status: str,
        source_path: Optional[str] = None,
        dest_path: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> None:
        with SessionLocal() as session:
            job = session.query(Job).filter_by(job_ref=job_ref).first()
            if job is None:
                return
            session.add(
                JobFile(
                    job_id=job.id,
                    file_name=file_name,
                    source_path=source_path,
                    dest_path=dest_path,
                    status=status,
                    error_message=error_message,
                )
            )
            session.commit()

    def revoke_job(self, job_ref: str) -> bool:
        with SessionLocal() as session:
            job = session.query(Job).filter_by(job_ref=job_ref).first()
            if job is None:
                return False
            job.status = JobStatus.REVOKED
            job.finished_at = _now()
            session.commit()
            return True

    def find_completed_study_job(self, study: str) -> Optional[dict]:
        """Return counts from the most recent DONE/PARTIAL job for `study`, or None."""
        if not study:
            return None
        with SessionLocal() as session:
            job = (
                session.query(Job)
                .filter(Job.study == study)
                .filter(Job.status.in_([JobStatus.DONE, JobStatus.PARTIAL]))
                .order_by(Job.id.desc())
                .first()
            )
            if job is None:
                return None
            return {
                "job_ref": job.job_ref,
                "total_files": job.total_files or 0,
                "successful_files": job.successful_files or 0,
                "failed_files": job.failed_files or 0,
                "unclassified_files": job.unclassified_files or 0,
            }
