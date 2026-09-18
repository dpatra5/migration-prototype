from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .db import Base


class MigrationStatus(str, enum.Enum):
    PENDING = "pending"
    MATCHED = "matched"
    UNCLASSIFIED = "unclassified"
    SUCCESS = "success"
    FAILED = "failed"


class MigrationRecord(Base):
    __tablename__ = "migration_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String, unique=True, nullable=False, index=True)
    study = Column(String, nullable=False)
    country = Column(String, nullable=False)
    site = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(SAEnum(MigrationStatus), default=MigrationStatus.PENDING, nullable=False)
    dest_path = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    PARTIAL = "partial"
    FAILED = "failed"
    REVOKED = "revoked"


class Job(Base):
    """One extraction job = one source zip / folder processed by the extractor."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_ref = Column(String, unique=True, nullable=False, index=True)
    zip_name = Column(String, nullable=False)
    fingerprint = Column(String, nullable=True, index=True)
    study = Column(String, nullable=True, index=True)
    source_type = Column(String, nullable=False, default="zip")
    status = Column(SAEnum(JobStatus), default=JobStatus.PENDING, nullable=False, index=True)
    assigned_by = Column(String, nullable=False, default="Scheduler")
    total_files = Column(Integer, default=0, nullable=False)
    successful_files = Column(Integer, default=0, nullable=False)
    failed_files = Column(Integer, default=0, nullable=False)
    unclassified_files = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    finished_at = Column(DateTime, nullable=True)

    files = relationship("JobFile", back_populates="job", cascade="all, delete-orphan")


class JobFile(Base):
    __tablename__ = "job_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    source_path = Column(String, nullable=True)
    dest_path = Column(String, nullable=True)
    status = Column(String, nullable=False)  # success | failed | unclassified
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    job = relationship("Job", back_populates="files")

