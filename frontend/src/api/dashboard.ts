import type { Job, JobStatus, MigrationMetrics } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

export interface DashboardJobDTO {
  id: string;
  jobRef: string;
  study: string;
  zipName: string;
  sourceType: string;
  status: string;
  assignedBy: string;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  unclassifiedFiles: number;
  mappedFiles: number;
  destinationFiles: number;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface DashboardMetricsDTO extends MigrationMetrics {}

export interface DashboardSnapshotDTO {
  metrics: DashboardMetricsDTO;
  active: DashboardJobDTO[];
  recent: DashboardJobDTO[];
  generatedAt: string;
}

const STATUS_MAP: Record<string, JobStatus> = {
  Done: "Done",
  Partial: "Partial",
  Running: "Running",
  Pending: "Pending",
  Failed: "Failed",
  Revoked: "Revoked",
};

export function dtoToJob(dto: DashboardJobDTO): Job {
  const rawStatus = STATUS_MAP[dto.status] ?? "Pending";
  const rawTs = dto.finishedAt ?? dto.startedAt;
  return {
    id: dto.jobRef,
    study: dto.study,
    status: rawStatus,
    date: rawTs.slice(0, 10),
    sortAt: rawTs,
    assignedBy: dto.assignedBy,
    totalFiles: dto.totalFiles,
    successfulFiles: dto.successfulFiles,
    failedFiles: dto.failedFiles,
    unclassifiedFiles: dto.unclassifiedFiles,
    mappedFiles: dto.mappedFiles,
    destinationFiles: dto.destinationFiles,
  };
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function fetchSnapshot(signal?: AbortSignal): Promise<DashboardSnapshotDTO> {
  return jsonFetch<DashboardSnapshotDTO>("/dashboard/snapshot?limit=30", { signal });
}

export function fetchMetrics(signal?: AbortSignal): Promise<DashboardMetricsDTO> {
  return jsonFetch<DashboardMetricsDTO>("/dashboard/metrics", { signal });
}

export function fetchJobs(signal?: AbortSignal): Promise<DashboardJobDTO[]> {
  return jsonFetch<DashboardJobDTO[]>("/dashboard/jobs?limit=30", { signal });
}

export function fetchActive(signal?: AbortSignal): Promise<DashboardJobDTO[]> {
  return jsonFetch<DashboardJobDTO[]>("/dashboard/active", { signal });
}

export function fetchJobDetail(jobRef: string, signal?: AbortSignal) {
  return jsonFetch(`/dashboard/jobs/${encodeURIComponent(jobRef)}`, { signal });
}

export function revokeJob(jobRef: string): Promise<DashboardJobDTO> {
  return jsonFetch<DashboardJobDTO>(`/dashboard/jobs/${encodeURIComponent(jobRef)}/revoke`, {
    method: "POST",
  });
}

export function retryJob(jobRef: string): Promise<DashboardJobDTO> {
  return jsonFetch<DashboardJobDTO>(`/dashboard/jobs/${encodeURIComponent(jobRef)}/retry`, {
    method: "POST",
  });
}

export interface TransferReportJobDTO {
  jobId: string;
  startedAt: string | null;
  finishedAt: string | null;
  study: string;
  sourceName: string;
  sourceType: string;
  sourceDocs: number;
  destinationDocs: number;
  docsMatch: boolean;
  sourceSize: number;
  destinationSize: number;
  sizeMatch: boolean;
  status: string;
  notes: string;
  mappedDocs: number;
  unclassifiedDocs: number;
}

export interface TransferReportDTO {
  jobs: TransferReportJobDTO[];
  totalJobs: number;
  totalMapped: number;
  totalUnclassified: number;
  totalSourceDocs: number;
  totalDestinationDocs: number;
  statuses: Record<string, number>;
  studies: string[];
  reportPath: string;
  reportExists: boolean;
}

export function fetchTransferReport(
  limit?: number,
  signal?: AbortSignal,
): Promise<TransferReportDTO> {
  const qs = limit ? `?limit=${limit}` : "";
  return jsonFetch<TransferReportDTO>(`/dashboard/reports${qs}`, { signal });
}
