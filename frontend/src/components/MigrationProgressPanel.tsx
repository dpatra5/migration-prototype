import { useEffect, useState } from "react";
import CircularProgress from "./CircularProgress";
import { JobStatusValues, type Job, type JobStatus } from "../types/index";

export type ScheduledMigration = {
  id: string;
  study: string;
  masterFolder: string;
  startedAt: number;
};

export type SchedulerPhase = "running" | "complete" | "revoked";

const migrationDefaults = {
  totalFiles: 120,
  successfulFiles: 114,
  failedFiles: 6,
  durationMs: 20_000,
};

type JobStats = {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  progress: number;
};

function getStaticJobStats(job: Job): JobStats {
  const total = job.totalFiles ?? 0;
  const successful = job.successfulFiles ?? 0;
  const failed = job.failedFiles ?? 0;
  const pending = Math.max(total - successful - failed, 0);
  const progress = total > 0 ? ((successful + failed) / total) * 100 : 0;
  return { total, successful, failed, pending, progress };
}

const statusRingColor: Record<JobStatus, string> = {
  Done: "#10b981",
  Partial: "#f59e0b",
  Running: "#3b82f6",
  Pending: "#94a3b8",
  Failed: "#f43f5e",
  Revoked: "#6b7280",
};

function MiniCircularProgress({ progress, status }: { progress: number; status: JobStatus }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const color = statusRingColor[status];

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} stroke="#e5e7eb" strokeWidth="4" fill="none" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-gray-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

const statusBadgeClass: Record<JobStatus, string> = {
  Done: "bg-emerald-50 text-emerald-700",
  Partial: "bg-amber-50 text-amber-700",
  Running: "bg-blue-50 text-blue-700",
  Pending: "bg-gray-100 text-gray-600",
  Failed: "bg-rose-50 text-rose-700",
  Revoked: "bg-gray-100 text-gray-600",
};

type MigrationProgressPanelProps = {
  jobs: Job[];
  activeMigration: ScheduledMigration | null;
  migrationPhase: SchedulerPhase;
  onJobComplete: (jobId: string) => void;
  onRevoke: (jobId: string) => void;
};

export function MigrationProgressPanel({
  jobs,
  activeMigration,
  migrationPhase,
  onJobComplete,
  onRevoke,
}: MigrationProgressPanelProps) {
  const [pinnedJobId, setPinnedJobId] = useState<string | null>(null);

  const [elapsedMs, setElapsedMs] = useState(() =>
    activeMigration && migrationPhase === "running"
      ? Math.min(Date.now() - activeMigration.startedAt, migrationDefaults.durationMs)
      : migrationDefaults.durationMs,
  );

  useEffect(() => {
    if (!activeMigration || migrationPhase !== "running") return;
    const timer = window.setInterval(() => {
      setElapsedMs(Math.min(Date.now() - activeMigration.startedAt, migrationDefaults.durationMs));
    }, 250);
    return () => window.clearInterval(timer);
  }, [activeMigration, migrationPhase]);

  useEffect(() => {
    if (!activeMigration || migrationPhase !== "running") return;
    if (elapsedMs >= migrationDefaults.durationMs) {
      onJobComplete(activeMigration.id);
    }
  }, [elapsedMs, activeMigration, migrationPhase, onJobComplete]);

  const liveRatio = Math.min(elapsedMs / migrationDefaults.durationMs, 1);
  const liveProcessed = Math.floor(migrationDefaults.totalFiles * liveRatio);
  const liveFailed =
    migrationPhase === "complete"
      ? migrationDefaults.failedFiles
      : Math.floor(migrationDefaults.failedFiles * liveRatio);
  const liveSuccessful = Math.min(liveProcessed - liveFailed, migrationDefaults.successfulFiles);
  const livePending = migrationDefaults.totalFiles - liveSuccessful - liveFailed;

  const liveStats: JobStats = {
    total: migrationDefaults.totalFiles,
    successful: liveSuccessful,
    failed: liveFailed,
    pending: livePending,
    progress: liveRatio * 100,
  };

  const getJobStats = (job: Job): JobStats =>
    activeMigration && job.id === activeMigration.id ? liveStats : getStaticJobStats(job);

  const getJobStatus = (job: Job): JobStatus =>
    activeMigration && job.id === activeMigration.id
      ? migrationPhase === "running"
        ? JobStatusValues.Running
        : migrationPhase === "complete"
          ? JobStatusValues.Partial
          : JobStatusValues.Pending
      : job.status;

  const defaultFocusId = activeMigration?.id ?? jobs[0]?.id ?? null;
  const displayedJobId = pinnedJobId ?? defaultFocusId;
  const isLiveDisplay = !!activeMigration && displayedJobId === activeMigration.id;
  const displayedJob = jobs.find((job) => job.id === displayedJobId) ?? null;

  const stats: JobStats = displayedJob
    ? getJobStats(displayedJob)
    : isLiveDisplay
      ? liveStats
      : { total: 0, successful: 0, failed: 0, pending: 0, progress: 0 };

  const displayedStatus: JobStatus = displayedJob
    ? getJobStatus(displayedJob)
    : isLiveDisplay
      ? migrationPhase === "running"
        ? JobStatusValues.Running
        : migrationPhase === "complete"
          ? JobStatusValues.Partial
          : JobStatusValues.Pending
      : JobStatusValues.Pending;

  const historyJobs = jobs.filter((job) => job.id !== displayedJobId).slice(0, 5);

  const selectJob = (jobId: string) => {
    setPinnedJobId(jobId);
  };

  if (!displayedJobId) {
    return null;
  }

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-5">
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-400">Job ID</p>
            <p className="text-sm font-semibold text-gray-800">{displayedJobId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass[displayedStatus]}`}>
              {displayedStatus}
            </span>
            {isLiveDisplay && migrationPhase === "running" && (
              <button
                type="button"
                onClick={() => onRevoke(activeMigration.id)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
              >
                Revoke
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center py-2">
          <CircularProgress
            progress={stats.progress}
            successfulFiles={stats.successful}
            pendingFiles={stats.pending}
            failedFiles={stats.failed}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mt-2">
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-semibold text-gray-800">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Transferred</p>
            <p className="text-sm font-semibold text-emerald-600">{stats.successful}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-sm font-semibold text-amber-600">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 border-t border-gray-100 pt-4 md:border-t-0 md:border-l md:pl-5 md:pt-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Previous Migrations
        </p>
        {historyJobs.length === 0 ? (
          <p className="text-xs text-gray-400">No previous migrations yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {historyJobs.map((job) => {
              const jobStats = getJobStats(job);
              const jobStatus = getJobStatus(job);
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => selectJob(job.id)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors text-left"
                >
                  <MiniCircularProgress progress={jobStats.progress} status={jobStatus} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{job.id}</p>
                    <p className="text-[11px] text-gray-500">{job.study}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
