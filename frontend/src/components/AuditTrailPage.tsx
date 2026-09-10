import { Fragment, useState } from "react";
import type { JobLog } from "../types/index";

type Severity = "info" | "success" | "warning" | "error";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  severity: Severity;
  logs?: JobLog[];
}

const mockAuditData: AuditEntry[] = [
  { id: "A-001", timestamp: "2026-08-17 09:15", user: "Abakash",  action: "Uploaded 45 documents",        target: "STUDY-A", severity: "info", logs: [
    { timestamp: "2026-08-17 09:15:01", level: "info",  message: "Upload session started by Abakash" },
    { timestamp: "2026-08-17 09:15:05", level: "info",  message: "Source: /inbox/STUDY-A/2026/" },
    { timestamp: "2026-08-17 09:15:10", level: "info",  message: "Detected 45 files (PDF: 28, DOCX: 12, XLSX: 5)" },
    { timestamp: "2026-08-17 09:15:30", level: "info",  message: "Validating file formats and sizes..." },
    { timestamp: "2026-08-17 09:15:45", level: "info",  message: "All 45 files passed validation" },
    { timestamp: "2026-08-17 09:15:50", level: "info",  message: "Upload completed — 45 documents queued for migration" },
  ]},
  { id: "A-002", timestamp: "2026-08-17 09:45", user: "Abakash",  action: "Migration J-101 started",      target: "STUDY-A", severity: "info", logs: [
    { timestamp: "2026-08-17 09:45:02", level: "info",  message: "Migration job J-101 initiated by Abakash" },
    { timestamp: "2026-08-17 09:45:10", level: "info",  message: "Connecting to source: /inbox/STUDY-A/2026/" },
    { timestamp: "2026-08-17 09:45:15", level: "info",  message: "Found 45 documents in source folder" },
    { timestamp: "2026-08-17 09:46:00", level: "info",  message: "Virus scan started on 45 files..." },
    { timestamp: "2026-08-17 09:48:30", level: "info",  message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-17 09:49:00", level: "info",  message: "Document classification in progress..." },
  ]},
  { id: "A-003", timestamp: "2026-08-17 10:20", user: "Abakash",  action: "Migration J-101 completed",    target: "STUDY-A", severity: "success", logs: [
    { timestamp: "2026-08-17 10:15:00", level: "info",  message: "All 45 documents classified successfully" },
    { timestamp: "2026-08-17 10:16:00", level: "info",  message: "Uploading to target vault..." },
    { timestamp: "2026-08-17 10:19:45", level: "info",  message: "45 of 45 documents uploaded to target vault" },
    { timestamp: "2026-08-17 10:20:00", level: "info",  message: "Migration job J-101 completed successfully" },
  ]},
  { id: "A-004", timestamp: "2026-08-17 11:00", user: "Ravi",     action: "Uploaded 30 documents",        target: "STUDY-B", severity: "info", logs: [
    { timestamp: "2026-08-17 11:00:01", level: "info",  message: "Upload session started by Ravi" },
    { timestamp: "2026-08-17 11:00:05", level: "info",  message: "Source: /inbox/STUDY-B/2026/" },
    { timestamp: "2026-08-17 11:00:10", level: "info",  message: "Detected 30 files (PDF: 18, DOCX: 8, XLSX: 4)" },
    { timestamp: "2026-08-17 11:00:25", level: "info",  message: "Validating file formats and sizes..." },
    { timestamp: "2026-08-17 11:00:40", level: "info",  message: "All 30 files passed validation" },
    { timestamp: "2026-08-17 11:00:45", level: "info",  message: "Upload completed — 30 documents queued for migration" },
  ]},
  { id: "A-005", timestamp: "2026-08-17 11:30", user: "Ravi",     action: "Migration J-102 started",      target: "STUDY-B", severity: "info", logs: [
    { timestamp: "2026-08-17 11:30:05", level: "info",  message: "Migration job J-102 initiated by Ravi" },
    { timestamp: "2026-08-17 11:30:12", level: "info",  message: "Found 30 documents in source folder" },
    { timestamp: "2026-08-17 11:31:00", level: "info",  message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-17 11:32:00", level: "info",  message: "Document classification in progress..." },
  ]},
  { id: "A-006", timestamp: "2026-08-17 12:15", user: "Ravi",     action: "Migration J-102 partial — 5 docs unclassified", target: "STUDY-B", severity: "warning", logs: [
    { timestamp: "2026-08-17 12:00:00", level: "info",  message: "25 of 30 documents classified successfully" },
    { timestamp: "2026-08-17 12:01:00", level: "warn",  message: "5 documents could not be auto-classified" },
    { timestamp: "2026-08-17 12:02:00", level: "warn",  message: "Unclassified: protocol_v3.pdf, site_list.xlsx, amendment_2.docx, consent_es.pdf, lab_cert.pdf" },
    { timestamp: "2026-08-17 12:05:00", level: "info",  message: "Uploading 25 classified documents..." },
    { timestamp: "2026-08-17 12:14:00", level: "info",  message: "25 documents uploaded successfully" },
    { timestamp: "2026-08-17 12:15:00", level: "warn",  message: "Migration J-102 completed partially — 5 docs require manual classification" },
  ]},
  { id: "A-007", timestamp: "2026-08-18 09:00", user: "Rakesh",   action: "Uploaded 60 documents",        target: "STUDY-C", severity: "info", logs: [
    { timestamp: "2026-08-18 09:00:01", level: "info",  message: "Upload session started by Rakesh" },
    { timestamp: "2026-08-18 09:00:05", level: "info",  message: "Source: Manual upload — STUDY-C_batch.zip" },
    { timestamp: "2026-08-18 09:00:15", level: "info",  message: "Extracting ZIP archive... 60 files found" },
    { timestamp: "2026-08-18 09:00:30", level: "info",  message: "Detected 60 files (PDF: 35, DOCX: 15, XLSX: 10)" },
    { timestamp: "2026-08-18 09:00:50", level: "info",  message: "All 60 files passed validation" },
    { timestamp: "2026-08-18 09:00:55", level: "info",  message: "Upload completed — 60 documents queued for migration" },
  ]},
  { id: "A-008", timestamp: "2026-08-18 09:30", user: "Rakesh",   action: "Migration J-103 started",      target: "STUDY-C", severity: "info", logs: [
    { timestamp: "2026-08-18 09:30:00", level: "info",  message: "Migration job J-103 initiated by Rakesh" },
    { timestamp: "2026-08-18 09:30:10", level: "info",  message: "Found 60 documents in source folder" },
    { timestamp: "2026-08-18 09:31:00", level: "info",  message: "Virus scan started on 60 files..." },
    { timestamp: "2026-08-18 09:34:00", level: "info",  message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-18 09:35:00", level: "info",  message: "Document classification in progress..." },
    { timestamp: "2026-08-18 09:38:00", level: "warn",  message: "2 documents could not be auto-classified" },
    { timestamp: "2026-08-18 09:39:00", level: "info",  message: "Uploading 58 classified documents..." },
    { timestamp: "2026-08-18 09:45:00", level: "info",  message: "Migration in progress — 65% complete" },
  ]},
  { id: "A-009", timestamp: "2026-08-18 10:00", user: "Sahil",    action: "Uploaded 25 documents",        target: "STUDY-D", severity: "info", logs: [
    { timestamp: "2026-08-18 10:00:01", level: "info",  message: "Upload session started by Sahil" },
    { timestamp: "2026-08-18 10:00:05", level: "info",  message: "Source: /inbox/STUDY-D/2026/" },
    { timestamp: "2026-08-18 10:00:10", level: "info",  message: "Detected 25 files (PDF: 15, DOCX: 7, XLSX: 3)" },
    { timestamp: "2026-08-18 10:00:20", level: "info",  message: "Validating file formats and sizes..." },
    { timestamp: "2026-08-18 10:00:35", level: "info",  message: "All 25 files passed validation" },
    { timestamp: "2026-08-18 10:00:40", level: "info",  message: "Upload completed — 25 documents queued for migration" },
  ]},
  { id: "A-010", timestamp: "2026-08-18 10:30", user: "Sahil",    action: "Migration J-104 started",      target: "STUDY-D", severity: "info", logs: [
    { timestamp: "2026-08-18 10:30:05", level: "info",  message: "Migration job J-104 initiated by Sahil" },
    { timestamp: "2026-08-18 10:30:12", level: "info",  message: "Found 25 documents in source folder" },
    { timestamp: "2026-08-18 10:31:00", level: "info",  message: "Virus scan started on 25 files..." },
    { timestamp: "2026-08-18 10:32:30", level: "warn",  message: "File 'report_final_v2.docx' flagged — quarantined" },
  ]},
  { id: "A-011", timestamp: "2026-08-18 11:00", user: "Sahil",    action: "Migration J-104 failed — 3 docs rejected", target: "STUDY-D", severity: "error", logs: [
    { timestamp: "2026-08-18 10:33:00", level: "info",  message: "Document classification in progress..." },
    { timestamp: "2026-08-18 10:34:15", level: "error", message: "Classification engine timeout after 60s for 3 documents" },
    { timestamp: "2026-08-18 10:34:20", level: "error", message: "Rejected: consent_form.pdf, lab_results_017.xlsx, amendment_3.docx" },
    { timestamp: "2026-08-18 10:35:00", level: "info",  message: "Uploading 21 remaining documents..." },
    { timestamp: "2026-08-18 10:36:00", level: "error", message: "Connection to target vault lost — retry 1/3" },
    { timestamp: "2026-08-18 10:36:30", level: "error", message: "Connection to target vault lost — retry 2/3" },
    { timestamp: "2026-08-18 10:37:00", level: "error", message: "Connection to target vault lost — retry 3/3 FAILED" },
    { timestamp: "2026-08-18 10:37:05", level: "error", message: "Migration job J-104 FAILED — 3 docs rejected, 21 docs not uploaded" },
  ]},
  { id: "A-012", timestamp: "2026-08-18 14:00", user: "Debabrata", action: "Reviewed unclassified docs",  target: "STUDY-B", severity: "info", logs: [
    { timestamp: "2026-08-18 14:00:01", level: "info",  message: "Manual review session started by Debabrata" },
    { timestamp: "2026-08-18 14:05:00", level: "info",  message: "Reviewing 5 unclassified documents from STUDY-B" },
    { timestamp: "2026-08-18 14:10:00", level: "info",  message: "Classified protocol_v3.pdf → Protocol" },
    { timestamp: "2026-08-18 14:12:00", level: "info",  message: "Classified site_list.xlsx → Site Management" },
    { timestamp: "2026-08-18 14:15:00", level: "info",  message: "Classified amendment_2.docx → Regulatory" },
    { timestamp: "2026-08-18 14:18:00", level: "info",  message: "Classified consent_es.pdf → Informed Consent" },
    { timestamp: "2026-08-18 14:20:00", level: "info",  message: "Classified lab_cert.pdf → Lab Documents" },
    { timestamp: "2026-08-18 14:20:30", level: "info",  message: "All 5 documents classified — queued for re-migration" },
  ]},
];

const severityStyle: Record<Severity, { dot: string; bg: string; text: string; label: string }> = {
  info:    { dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",    label: "Info" },
  success: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Success" },
  warning: { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",   label: "Warning" },
  error:   { dot: "bg-rose-500",    bg: "bg-rose-50",    text: "text-rose-700",    label: "Error" },
};

const logLevelStyle: Record<JobLog["level"], { color: string; label: string }> = {
  info:  { color: "text-blue-400",  label: "INFO" },
  warn:  { color: "text-amber-400", label: "WARN" },
  error: { color: "text-rose-400",  label: "ERROR" },
};

export function AuditTrailPage() {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockAuditData.filter((e) => {
    if (filter !== "all" && e.severity !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.user.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: mockAuditData.length,
    info: mockAuditData.filter((e) => e.severity === "info").length,
    success: mockAuditData.filter((e) => e.severity === "success").length,
    warning: mockAuditData.filter((e) => e.severity === "warning").length,
    error: mockAuditData.filter((e) => e.severity === "error").length,
  };

  const filterButtons: { key: Severity | "all"; label: string; color: string; activeColor: string }[] = [
    { key: "all",     label: "All",     color: "text-gray-600",   activeColor: "bg-gray-900 text-white" },
    { key: "info",    label: "Info",    color: "text-blue-600",   activeColor: "bg-blue-600 text-white" },
    { key: "success", label: "Success", color: "text-emerald-600", activeColor: "bg-emerald-600 text-white" },
    { key: "warning", label: "Warning", color: "text-amber-600",  activeColor: "bg-amber-500 text-white" },
    { key: "error",   label: "Error",   color: "text-rose-600",   activeColor: "bg-rose-600 text-white" },
  ];

  const exportLogs = (entry: AuditEntry) => {
    if (!entry.logs || entry.logs.length === 0) return;
    const header = `Audit Log Export - ${entry.id}\nAction: ${entry.action}\nUser: ${entry.user}\nStudy: ${entry.target}\nTimestamp: ${entry.timestamp}\n${"=".repeat(50)}\n`;
    const lines = entry.logs.map((log) => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`);
    const blob = new Blob([header + lines.join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entry.id}-audit-logs.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">🔍 Audit Trail</h2>
        <p className="text-gray-500 text-sm mb-5 text-center">Complete history of all migration actions and system events</p>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === btn.key ? btn.activeColor : `bg-white border border-gray-200 ${btn.color} hover:bg-gray-50`
                }`}
              >
                {btn.label} ({counts[btn.key]})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by user, action, study..."
            aria-label="Search audit entries"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[34%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Study</th>
                  <th className="px-4 py-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No matching audit entries</td>
                  </tr>
                ) : (
                  filtered.map((entry) => {
                    const s = severityStyle[entry.severity];
                    const hasLogs = entry.logs && entry.logs.length > 0;
                    const isExpanded = expandedId === entry.id;
                    const toggle = () => hasLogs && setExpandedId(isExpanded ? null : entry.id);
                    return (
                      <Fragment key={entry.id}>
                        <tr
                          onClick={toggle}
                          onKeyDown={(e) => { if (hasLogs && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } }}
                          tabIndex={hasLogs ? 0 : undefined}
                          role={hasLogs ? "button" : undefined}
                          aria-expanded={hasLogs ? isExpanded : undefined}
                          className={`text-center transition-colors ${
                            hasLogs ? "cursor-pointer hover:bg-gray-100" : "hover:bg-gray-50/50"
                          } ${isExpanded ? "bg-gray-50" : ""}`}
                        >
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            <span className="inline-flex items-center gap-1.5">
                              {hasLogs && (
                                <svg aria-hidden="true" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                              {entry.id}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{entry.timestamp}</td>
                          <td className="px-4 py-3 text-gray-700">{entry.user}</td>
                          <td className="px-4 py-3 text-gray-700 text-left">{entry.action}</td>
                          <td className="px-4 py-3 text-gray-700">{entry.target}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && entry.logs && (
                          <tr key={`${entry.id}-logs`}>
                            <td colSpan={6} className="p-0">
                              <div className="bg-gray-900 text-gray-300 px-5 py-4 mx-3 mb-3 rounded-xl font-mono text-xs leading-relaxed max-h-64 overflow-y-auto">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                                  <span className="text-gray-400 font-sans text-xs font-semibold uppercase tracking-wider">Detailed Logs — {entry.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => exportLogs(entry)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 font-sans text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                                  >
                                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                    </svg>
                                    Export
                                  </button>
                                </div>
                                {entry.logs.map((log, i) => {
                                  const ls = logLevelStyle[log.level];
                                  return (
                                    <div key={i} className="flex gap-3 py-0.5">
                                      <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                                      <span className={`font-bold flex-shrink-0 w-14 ${ls.color}`}>[{ls.label}]</span>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <p>Showing {filtered.length} of {mockAuditData.length} entries</p>
          <p>Last updated: 2026-08-18 14:00</p>
        </div>
      </div>
    </div>
  );
}
