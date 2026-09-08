from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RecordOut(BaseModel):
    id: int
    source_id: str
    study: str
    country: str
    site: str
    file_type: str
    file_path: str
    status: str
    dest_path: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MigrationSummary(BaseModel):
    total: int
    pending: int
    matched: int
    success: int
    failed: int
    unclassified: int
