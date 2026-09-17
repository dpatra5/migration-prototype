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

const statusFallbackProgress: Record<JobStatus, number> = {
  Done: 100,
  Partial: 100,
  Failed: 100,
  Running: 60,
  Revoked: 35,
  Pending: 8,
};

function hasFinishedStatus(status: JobStatus) {
  return status === JobStatusValues.Partial || status === JobStatusValues.Done || status === JobStatusValues.Failed;
}

function getStaticJobStats(job: Job): JobStats {
  const total = job.totalFiles ?? migrationDefaults.totalFiles;
  const hasRecordedCounts = (job.successfulFiles ?? 0) > 0 || (job.failedFiles ?? 0) > 0;
  const successful = hasFinishedStatus(job.status) && !hasRecordedCounts
    ? migrationDefaults.successfulFiles
    : job.successfulFiles ?? 0;
  const failed = hasFinishedStatus(job.status) && !hasRecordedCounts
    ? migrationDefaults.failedFiles
    : job.failedFiles ?? 0;
  const pending = Math.max(total - successful - failed, 0);
  const measuredProgress = total > 0 ? ((successful + failed) / total) * 100 : 0;
  const progress = measuredProgress > 0 ? measuredProgress : statusFallbackProgress[job.status];

  return { total, successful, failed, pending, progress };
}

const statusRingColor: Record<JobStatus, string> = {
  Done: "#10b981",
  Partial: "#f59e0b",
  Running: "#3b82f6",
  Pending: "#8b5cf6",
  Failed: "#f43f5e",
  Revoked: "#f97316",
};

function MiniCircularProgress({ progress, status }: { progress: number; status: JobStatus }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const visibleProgress = Math.min(Math.max(progress, 5), 100);
  const offset = circumference - (visibleProgress / 100) * circumference;
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
  activeMigrations: (ScheduledMigration & { phase: SchedulerPhase })[];
  selectedMigrationId: string | null;
  onSelectMigration: (jobId: string) => void;
  onJobComplete: (jobId: string) => void;
  onRevoke: (jobId: string) => void;
};

export function MigrationProgressPanel({
  jobs,
  activeMigrations,
  selectedMigrationId,
  onSelectMigration,
  onJobComplete,
  onRevoke,
}: MigrationProgressPanelProps) {
  const [elapsedMsMap, setElapsedMsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setElapsedMsMap((currentElapsed) => {
      const nextElapsed = { ...currentElapsed };
      activeMigrations.forEach((migration) => {
        if (!(migration.id in nextElapsed)) {
          nextElapsed[migration.id] = Math.min(Date.now() - migration.startedAt, migrationDefaults.durationMs);
        }
      });
      return nextElapsed;
    });
  }, [activeMigrations]);

  useEffect(() => {
    const runningMigrations = activeMigrations.filter((migration) => migration.phase === "running");
    if (runningMigrations.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMsMap((currentElapsed) => {
        const nextElapsed = { ...currentElapsed };
        runningMigrations.forEach((migration) => {
          nextElapsed[migration.id] = Math.min(Date.now() - migration.startedAt, migrationDefaults.durationMs);
        });
        return nextElapsed;
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, [activeMigrations]);

  useEffect(() => {
    activeMigrations.forEach((migration) => {
      if (migration.phase === "running" && elapsedMsMap[migration.id] >= migrationDefaults.durationMs) {
        onJobComplete(migration.id);
      }
    });
  }, [activeMigrations, elapsedMsMap, onJobComplete]);

  const getActiveMigrationStats = (
    migration: ScheduledMigration & { phase: SchedulerPhase },
    elapsedMs: number,
  ): JobStats => {
    const liveRatio = migration.phase === "complete"
      ? 1
      : Math.min(elapsedMs / migrationDefaults.durationMs, 1);
    const liveProcessed = Math.floor(migrationDefaults.totalFiles * liveRatio);
    const liveFailed = migration.phase === "complete"
      ? migrationDefaults.failedFiles
      : Math.floor(migrationDefaults.failedFiles * liveRatio);
    const liveSuccessful = Math.max(
      Math.min(liveProcessed - liveFailed, migrationDefaults.successfulFiles),
      0,
    );
    const livePending = Math.max(migrationDefaults.totalFiles - liveSuccessful - liveFailed, 0);

    return {
      total: migrationDefaults.totalFiles,
      successful: liveSuccessful,
      failed: liveFailed,
      pending: livePending,
      progress: liveRatio * 100,
    };
  };

  const getActiveMigrationStatus = (migration: ScheduledMigration & { phase: SchedulerPhase }): JobStatus =>
    migration.phase === "running"
      ? JobStatusValues.Running
      : migration.phase === "complete"
        ? JobStatusValues.Partial
        : JobStatusValues.Pending;

  const completedJobs = jobs.filter(
    (job) => !activeMigrations.some((migration) => migration.id === job.id),
  );
  const allMigrations = [...activeMigrations, ...completedJobs]
    .sort((a, b) => {
      const firstJobNumber = Number.parseInt(a.id.replace("J-", ""), 10);
      const secondJobNumber = Number.parseInt(b.id.replace("J-", ""), 10);
      return secondJobNumber - firstJobNumber;
    })
    .slice(0, 5);
  const displayedMigration = allMigrations.find((migration) => migration.id === selectedMigrationId) ?? allMigrations[0] ?? null;
  const displayedMigrationId = displayedMigration?.id ?? null;

  const getMigrationStats = (migration: ScheduledMigration | Job): JobStats => {
    const activeMigration = activeMigrations.find((item) => item.id === migration.id);
    if (activeMigration) {
      return getActiveMigrationStats(activeMigration, elapsedMsMap[activeMigration.id] ?? 0);
    }

    const completedJob = jobs.find((job) => job.id === migration.id);
    return completedJob ? getStaticJobStats(completedJob) : { total: 0, successful: 0, failed: 0, pending: 0, progress: 0 };
  };

  const getMigrationStatus = (migration: ScheduledMigration | Job): JobStatus => {
    const activeMigration = activeMigrations.find((item) => item.id === migration.id);
    return activeMigration ? getActiveMigrationStatus(activeMigration) : (migration as Job).status ?? JobStatusValues.Pending;
  };

  const displayedStats = displayedMigration
    ? getMigrationStats(displayedMigration)
    : { total: 0, successful: 0, failed: 0, pending: 0, progress: 0 };
  const displayedStatus = displayedMigration ? getMigrationStatus(displayedMigration) : JobStatusValues.Pending;
  const selectedActiveMigration = displayedMigrationId
    ? activeMigrations.find((migration) => migration.id === displayedMigrationId)
    : null;

  if (allMigrations.length === 0) {
    return null;
  }

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-5">
      <div className="w-full md:w-80 flex-shrink-0">
        {displayedMigration ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400">Job ID</p>
                <p className="text-sm font-semibold text-gray-800">{displayedMigration.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass[displayedStatus]}`}>
                  {displayedStatus}
                </span>
                {selectedActiveMigration?.phase === "running" && (
                  <button
                    type="button"
                    onClick={() => onRevoke(selectedActiveMigration.id)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center py-2">
              <CircularProgress
                progress={displayedStats.progress}
                successfulFiles={displayedStats.successful}
                pendingFiles={displayedStats.pending}
                failedFiles={displayedStats.failed}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mt-3">
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-semibold text-gray-800">{displayedStats.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Transferred</p>
                <p className="text-sm font-semibold text-emerald-600">{displayedStats.successful}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-sm font-semibold text-amber-600">{displayedStats.pending}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 border-t border-gray-100 pt-4 md:border-t-0 md:border-l md:pl-5 md:pt-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Migrations
        </p>
        <div className="flex flex-col gap-2">
          {allMigrations.map((migration) => {
            const stats = getMigrationStats(migration);
            const status = getMigrationStatus(migration);
            const isSelected = migration.id === displayedMigrationId;

            return (
              <button
                key={migration.id}
                type="button"
                onClick={() => onSelectMigration(migration.id)}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-colors text-left ${
                  isSelected
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <MiniCircularProgress progress={stats.progress} status={status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{migration.id}</p>
                  <p className="text-[11px] text-gray-500 truncate">{migration.study}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
