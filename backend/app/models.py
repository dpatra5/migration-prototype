from sqlalchemy import Column, String, Integer, DateTime, Text, Enum as SAEnum
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
