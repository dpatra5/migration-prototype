export type JobStatus = "Done" | "Partial" | "Running" | "Pending" | "Failed" | "Revoked";

export const JobStatusValues = {
  Done: "Done" as const,
  Partial: "Partial" as const,
  Running: "Running" as const,
  Pending: "Pending" as const,
  Failed: "Failed" as const,
  Revoked: "Revoked" as const,
} satisfies Record<JobStatus, JobStatus>;

export interface Job {
  id: string;
  study: string;
  status: JobStatus;
  date: string;
  assignedBy: string;
}

export interface JobLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface MigrationMetrics {
  total: number;
  success: number;
  failed: number;
  unclassified: number;
}

export type ModalType =
  | "upload"
  | "mapping"
  | "review"
  | "audit"
  | "unclassified"
  | null;

export interface ModalContextType {
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}
