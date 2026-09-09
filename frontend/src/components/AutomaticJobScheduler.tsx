import { useEffect, useState } from "react";
import CircularProgress from "./CircularProgress";

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
      : Math.min(Date.now() - migration.startedAt, migrationDefaults.durationMs),
  );

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      setElapsedMs(Math.min(Date.now() - migration.startedAt, migrationDefaults.durationMs));
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
    phase === "complete" ? migrationDefaults.failedFiles : Math.floor(migrationDefaults.failedFiles * progress);
  const successfulFiles = Math.min(processedFiles - failedFiles, migrationDefaults.successfulFiles);
  const pendingFiles = migrationDefaults.totalFiles - successfulFiles - failedFiles;
  const elapsedSeconds = Math.ceil(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, 20 - elapsedSeconds);

  const revokeSchedulerJob = () => {
    if (phase !== "running") return;
    onJobRevoked(migration.id);
  };

  return (
    <section
      className={
        "bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
      }
    >
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                phase === "running" ? "bg-blue-500 animate-pulse" : phase === "complete" ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />

            <h2 className="text-xl font-semibold text-slate-900">Automatic Job Scheduler</h2>

            {phase === "running" && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Active</span>
            )}

            {phase === "complete" && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Completed</span>
            )}

            {phase === "revoked" && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Revoked</span>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-1">Scheduled migration for {migration.masterFolder}</p>
          <p className="text-xs text-gray-400 mt-1">Job ID: {migration.id}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={revokeSchedulerJob}
            disabled={phase !== "running"}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all duration-200"
          >
            Revoke
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="font-semibold text-gray-800">
            {phase === "running" ? "Migration in progress" : phase === "complete" ? "Migration completed: Partial success" : "Migration revoked"}
          </p>
          <p className="text-gray-500 whitespace-nowrap">
            {phase === "running" ? `${remainingSeconds}s remaining` : phase === "complete" ? "Final status" : "Queued as pending"}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm font-medium text-blue-700">Files Processing Progress</p>
          <p className="text-xs text-blue-600 mt-1">{successfulFiles + failedFiles} of {migrationDefaults.totalFiles} files evaluated</p>
        </div>

        <div className="flex justify-center items-center py-6">
          <div className="flex justify-center">
            <CircularProgress progress={progress * 100} successfulFiles={successfulFiles} pendingFiles={pendingFiles} failedFiles={failedFiles} />
          </div>

          {/* <div className="grid grid-cols-2 gap-4">
            <StatusMetric label="Total Files" value={migrationDefaults.totalFiles} color="text-slate-900" bg="bg-slate-50" />
            <StatusMetric label="Transferred" value={successfulFiles} color="text-emerald-600" bg="bg-emerald-50" />
            <StatusMetric label="Pending" value={pendingFiles} color="text-amber-600" bg="bg-amber-50" />
            <StatusMetric label="Failed" value={failedFiles} color="text-rose-600" bg="bg-rose-50" />
          </div> */}
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">Migration Status</p>
              <p className="mt-1 text-sm text-slate-600">
                {phase === "running"
                  ? `Processing ${successfulFiles + failedFiles} of ${migrationDefaults.totalFiles} files. Progress updates automatically in real time.`
                  : phase === "complete"
                  ? `Migration completed. ${successfulFiles} files transferred successfully and ${failedFiles} files require review.`
                  : "Migration was revoked before completion."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusMetric({ label, value, color, bg = "" }: { label: string; value: number; color: string; bg?: string }) {
  return (
    <div className={`rounded-xl border border-gray-100 ${bg} px-4 py-4`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
