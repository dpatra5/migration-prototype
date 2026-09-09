import { Fragment, useState } from "react";
import type { Job, JobStatus, JobLog } from "../types/index";
import { mockJobLogs } from "../data/mockData";

const logLevelStyle: Record<JobLog["level"], { color: string; label: string }> = {
  info:  { color: "text-blue-600",    label: "INFO" },
  warn:  { color: "text-amber-600",   label: "WARN" },
  error: { color: "text-rose-600",    label: "ERROR" },
};

function statusStyle(s: JobStatus) {
  const map: Record<JobStatus, { dot: string; bg: string; text: string }> = {
    Done:    { dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
    Partial: { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700" },
    Running: { dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700" },
    Pending: { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700" },
    Failed:  { dot: "bg-rose-500",    bg: "bg-rose-50",    text: "text-rose-700" },
    Revoked: { dot: "bg-gray-400",    bg: "bg-gray-100",   text: "text-gray-600" },
  };
  return map[s] ?? { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-600" };
}

function hasLogs(job: Job) {
  return (job.status === "Running" || job.status === "Failed") && mockJobLogs[job.id];
}

export function RecentJobsTable({ jobs, onRevoke }: { jobs: Job[]; onRevoke: (jobId: string) => void }) {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-center">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Job ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Study</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Assigned By</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job, index) => {
              const s = statusStyle(job.status);
              const clickable = hasLogs(job);
              const isExpanded = expandedJob === job.id;
              const toggle = () => clickable && setExpandedJob(isExpanded ? null : job.id);
              return (
                <Fragment key={job.id}>
                  <tr
                    onClick={toggle}
                    onKeyDown={(e) => { if (clickable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } }}
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? "button" : undefined}
                    aria-expanded={clickable ? isExpanded : undefined}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    } text-center transition-all duration-200 ${
                    clickable
                      ? "cursor-pointer hover:bg-blue-50"
                      : "hover:bg-slate-50"
                  } ${isExpanded ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <span className="inline-flex items-center gap-1.5">
                        {clickable && (
                          <svg aria-hidden="true" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-bold text-slate-800">
                          {job.id}
                        </span>
                      </div>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{job.study}</td>
                    <td className="px-4 py-3">
                      <span
  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${s.bg} ${s.text}`}
>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            job.status === "Running"
                              ? `${s.dot} animate-pulse`
                              : s.dot
                          }`}
/>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{job.date}</td>
                    <td className="px-4 py-3 text-gray-700">{job.assignedBy}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRevoke(job.id);
                        }}
                        disabled={job.status === "Revoked"}
                        className="
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-rose-600
                        bg-rose-50
                        hover:bg-rose-100
                        rounded-xl
                        transition-all
                        duration-200
                        shadow-sm
                        "                      >
                        {job.status === "Revoked" ? "Revoked" : "Revoke"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && mockJobLogs[job.id] && (
                    <tr key={`${job.id}-logs`}>
                      <td colSpan={6} className="p-0">
                        <div className="bg-gray-900 text-gray-300 px-5 py-4 mx-3 mb-3 rounded-xl font-mono text-xs leading-relaxed max-h-64 overflow-y-auto">
                          {mockJobLogs[job.id].map((log, i) => {
                            const ls = logLevelStyle[log.level];
                            return (
                              <div key={i} className="flex gap-3 py-0.5">
                                <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                                <span className={`font-bold flex-shrink-0 w-12 ${ls.color}`}>[{ls.label}]</span>
                                <span className={log.level === "error" ? "text-rose-400" : log.level === "warn" ? "text-amber-400" : "text-gray-300"}>
                                  {log.message}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
