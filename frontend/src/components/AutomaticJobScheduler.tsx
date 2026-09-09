import { useEffect, useState } from "react";

export type ScheduledMigration = {
  id: string;
  study: string;
  masterFolder: string;
  startedAt: number;
};

const migrationDefaults = {
  totalFiles: 120,
  successfulFiles: 114,
  failedFiles: 6,
  durationMs: 20_000,
};

export type SchedulerPhase = "running" | "complete" | "revoked";

type AutomaticJobSchedulerProps = {
  migration: ScheduledMigration;
  phase: SchedulerPhase;
  onJobComplete: (jobId: string) => void;
  onJobRevoked: (jobId: string) => void;
};

export function AutomaticJobScheduler({
  migration,
  phase,
  onJobComplete,
  onJobRevoked,
}: AutomaticJobSchedulerProps) {
  const [elapsedMs, setElapsedMs] = useState(() =>
    phase === "complete"
      ? migrationDefaults.durationMs
      : Math.min(
          Date.now() - migration.startedAt,
          migrationDefaults.durationMs,
        ),
  );

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(
        Math.min(
          Date.now() - migration.startedAt,
          migrationDefaults.durationMs,
        ),
      );
    }, 250);

    return () => window.clearInterval(timer);
  }, [phase, migration.startedAt]);

  useEffect(() => {
    if (elapsedMs >= migrationDefaults.durationMs && phase === "running") {
      onJobComplete(migration.id);
    }
  }, [elapsedMs, migration.id, onJobComplete, phase]);

  const progress = Math.min(elapsedMs / migrationDefaults.durationMs, 1);
  const processedFiles = Math.floor(migrationDefaults.totalFiles * progress);
  const failedFiles =
    phase === "complete"
      ? migrationDefaults.failedFiles
      : Math.floor(migrationDefaults.failedFiles * progress);
  const successfulFiles = Math.min(
    processedFiles - failedFiles,
    migrationDefaults.successfulFiles,
  );
  const pendingFiles =
    migrationDefaults.totalFiles - successfulFiles - failedFiles;
  const elapsedSeconds = Math.ceil(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, 20 - elapsedSeconds);

  const revokeSchedulerJob = () => {
    if (phase !== "running") {
      return;
    }

    onJobRevoked(migration.id);
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${phase === "running" ? "bg-blue-500 animate-pulse" : phase === "complete" ? "bg-emerald-500" : "bg-gray-400"}`}
            />
            <h2 className="text-lg font-bold text-gray-900">
              Automatic Job Scheduler
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Scheduled migration for {migration.masterFolder}
          </p>
          <p className="text-xs text-gray-400 mt-1">Job ID: {migration.id}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={revokeSchedulerJob}
            disabled={phase !== "running"}
            className="px-3 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Revoke
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="font-semibold text-gray-800">
            {phase === "running"
              ? "Migration in progress"
              : phase === "complete"
                ? "Migration completed: Partial success"
                : "Migration revoked"}
          </p>
          <p className="text-gray-500 whitespace-nowrap">
            {phase === "running"
              ? `${remainingSeconds}s remaining`
              : phase === "complete"
                ? "Final status"
                : "Queued as pending"}
          </p>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-label="Migration progress"
          aria-valuemin={0}
          aria-valuemax={migrationDefaults.totalFiles}
          aria-valuenow={successfulFiles + failedFiles}
          aria-valuetext={`${successfulFiles + failedFiles} of ${migrationDefaults.totalFiles} files processed`}
        >
          <div
            className="h-full bg-blue-600 transition-[width] duration-200 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatusMetric
            label="Total files"
            value={migrationDefaults.totalFiles}
            color="text-gray-900"
          />
          <StatusMetric
            label="Transferred"
            value={successfulFiles}
            color="text-emerald-700"
          />
          <StatusMetric
            label="Pending"
            value={pendingFiles}
            color="text-amber-700"
          />
          <StatusMetric
            label="Failed"
            value={failedFiles}
            color="text-rose-700"
          />
        </div>

        <p
          className={`text-xs font-semibold ${phase === "running" ? "text-blue-700" : phase === "complete" ? "text-amber-700" : "text-gray-600"}`}
        >
          {phase === "running"
            ? `Processing files from the master folder. ${successfulFiles + failedFiles} of ${migrationDefaults.totalFiles} files evaluated.`
            : phase === "complete"
              ? "Final result: 114 files transferred successfully; 6 files failed and are ready for retry or review."
              : "This scheduled migration was stopped before completion and added to Recent Jobs with Pending status."}
        </p>
      </div>
    </section>
  );
}

function StatusMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
