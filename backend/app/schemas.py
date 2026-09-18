from pydantic import BaseModel
from typing import Optional, List
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


class DashboardMetrics(BaseModel):
    total: int
    success: int
    failed: int
    unclassified: int
    studies: int
    countries: int
    sites: int


class DashboardJob(BaseModel):
    id: str
    jobRef: str
    study: str
    zipName: str
    sourceType: str
    status: str
    assignedBy: str
    totalFiles: int
    successfulFiles: int
    failedFiles: int
    unclassifiedFiles: int
    mappedFiles: int = 0
    destinationFiles: int = 0
    startedAt: datetime
    finishedAt: Optional[datetime] = None
    errorMessage: Optional[str] = None

    class Config:
        from_attributes = True


class DashboardJobFile(BaseModel):
    fileName: str
    status: str
    destPath: Optional[str] = None
    errorMessage: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class DashboardJobDetail(DashboardJob):
    files: List[DashboardJobFile] = []


class DashboardSnapshot(BaseModel):
    metrics: DashboardMetrics
    active: List[DashboardJob]
    recent: List[DashboardJob]
    generatedAt: datetime


class TransferReportJob(BaseModel):
    jobId: str
    startedAt: Optional[str] = None
    finishedAt: Optional[str] = None
    study: str
    sourceName: str
    sourceType: str
    sourceDocs: int
    destinationDocs: int
    docsMatch: bool
    sourceSize: int
    destinationSize: int
    sizeMatch: bool
    status: str
    notes: str
    mappedDocs: int
    unclassifiedDocs: int


class TransferReportResponse(BaseModel):
    jobs: List[TransferReportJob]
    totalJobs: int
    totalMapped: int
    totalUnclassified: int
    totalSourceDocs: int
    totalDestinationDocs: int
    statuses: dict[str, int]
    studies: List[str]
    reportPath: str
    reportExists: bool

