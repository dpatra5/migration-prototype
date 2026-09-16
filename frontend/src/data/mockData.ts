import type { Job, MigrationMetrics, JobLog } from "../types/index";
import { JobStatusValues } from "../types/index";

export const mockMetrics: MigrationMetrics = {
  total: 1245,
  success: 1180,
  failed: 95,
  unclassified: 130,
  studies: 18,
  countries: 9,
  sites: 27,
};

const metricsHistoryYears = ["2024", "2025", "2026"];
const metricsHistoryMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function buildMetricsForSeed(seed: number): MigrationMetrics {
  const total = 640 + seed * 31;
  const failed = 18 + (seed % 5) * 14;
  const unclassified = 12 + (seed % 4) * 18;
  const success = total - failed - unclassified;
  const studies = 4 + (seed % 6) * 2;
  const countries = 2 + (seed % 4);
  const sites = 6 + (seed % 5) * 3;
  return { total, success, failed, unclassified, studies, countries, sites };
}

export const mockMetricsByYear: Record<string, MigrationMetrics> = metricsHistoryYears.reduce(
  (acc, year, index) => {
    acc[year] = buildMetricsForSeed(index * 12 + 6);
    return acc;
  },
  {} as Record<string, MigrationMetrics>,
);

export const mockMetricsByMonth: Record<string, Record<string, MigrationMetrics>> = metricsHistoryYears.reduce(
  (acc, year, yearIndex) => {
    acc[year] = metricsHistoryMonths.reduce(
      (monthAcc, month, monthIndex) => {
        monthAcc[month] = buildMetricsForSeed(yearIndex * 12 + monthIndex);
        return monthAcc;
      },
      {} as Record<string, MigrationMetrics>,
    );
    return acc;
  },
  {} as Record<string, Record<string, MigrationMetrics>>,
);

export const mockJobs: Job[] = [
  {
    id: "J-101",
    study: "STUDY-A",
    status: JobStatusValues.Done,
    date: "17-Aug",
    assignedBy: "Abakash",
    totalFiles: 80,
    successfulFiles: 80,
    failedFiles: 0,
  },
  {
    id: "J-102",
    study: "STUDY-B",
    status: JobStatusValues.Partial,
    date: "17-Aug",
    assignedBy: "Ravi",
    totalFiles: 65,
    successfulFiles: 60,
    failedFiles: 5,
  },
  {
    id: "J-103",
    study: "STUDY-C",
    status: JobStatusValues.Running,
    date: "18-Aug",
    assignedBy: "Rakesh",
    totalFiles: 60,
    successfulFiles: 36,
    failedFiles: 3,
  },
  {
    id: "J-104",
    study: "STUDY-D",
    status: JobStatusValues.Failed,
    date: "18-Aug",
    assignedBy: "Sahil",
    totalFiles: 25,
    successfulFiles: 5,
    failedFiles: 20,
  },
  {
    id: "J-105",
    study: "STUDY-A",
    status: JobStatusValues.Running,
    date: "19-Aug",
    assignedBy: "Debabrata",
    totalFiles: 90,
    successfulFiles: 52,
    failedFiles: 2,
  },
  {
    id: "J-106",
    study: "STUDY-E",
    status: JobStatusValues.Done,
    date: "19-Aug",
    assignedBy: "Abakash",
    totalFiles: 40,
    successfulFiles: 40,
    failedFiles: 0,
  },
  {
    id: "J-107",
    study: "STUDY-B",
    status: JobStatusValues.Partial,
    date: "20-Aug",
    assignedBy: "Ravi",
    totalFiles: 72,
    successfulFiles: 65,
    failedFiles: 7,
  },
  {
    id: "J-108",
    study: "STUDY-C",
    status: JobStatusValues.Pending,
    date: "20-Aug",
    assignedBy: "Rakesh",
    totalFiles: 55,
    successfulFiles: 0,
    failedFiles: 0,
  },
  {
    id: "J-109",
    study: "STUDY-F",
    status: JobStatusValues.Revoked,
    date: "21-Aug",
    assignedBy: "Sahil",
    totalFiles: 33,
    successfulFiles: 12,
    failedFiles: 0,
  },
];

export const sidebarItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Upload", icon: "upload", modal: "upload" },
  { label: "Mapping", icon: "mapping", modal: "mapping" },
  { label: "Review", icon: "review", modal: "review" },
  { label: "Unclassified Docs", icon: "docs", modal: "unclassified" },
  { label: "Audit", icon: "audit", modal: "audit" },
  { label: "Trail", icon: "trail" },
  { label: "Notifications", icon: "bell" },
  { label: "Settings", icon: "settings" },
];

export const mockJobLogs: Record<string, JobLog[]> = {
  "J-101": [
    { timestamp: "2026-08-17 10:00:03", level: "info",  message: "Migration job J-101 initiated by Abakash" },
    { timestamp: "2026-08-17 10:00:08", level: "info",  message: "Connecting to source: /inbox/STUDY-A/2026/" },
    { timestamp: "2026-08-17 10:00:11", level: "info",  message: "Found 80 documents in source folder" },
    { timestamp: "2026-08-17 10:01:00", level: "info",  message: "Virus scan started on 80 files..." },
    { timestamp: "2026-08-17 10:04:20", level: "info",  message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-17 10:04:35", level: "info",  message: "Document classification in progress..." },
    { timestamp: "2026-08-17 10:08:10", level: "info",  message: "All 80 documents classified successfully" },
    { timestamp: "2026-08-17 10:08:25", level: "info",  message: "Uploading 80 documents to target vault..." },
    { timestamp: "2026-08-17 10:16:40", level: "info",  message: "80 of 80 documents uploaded successfully" },
    { timestamp: "2026-08-17 10:17:00", level: "info",  message: "Migration job J-101 COMPLETED — 80 migrated, 0 failed" },
  ],
  "J-102": [
    { timestamp: "2026-08-17 12:00:04", level: "info",  message: "Migration job J-102 initiated by Ravi" },
    { timestamp: "2026-08-17 12:00:09", level: "info",  message: "Connecting to source: /inbox/STUDY-B/2026/" },
    { timestamp: "2026-08-17 12:00:12", level: "info",  message: "Found 65 documents in source folder" },
    { timestamp: "2026-08-17 12:01:05", level: "info",  message: "Virus scan started on 65 files..." },
    { timestamp: "2026-08-17 12:03:50", level: "info",  message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-17 12:04:10", level: "info",  message: "Document classification in progress..." },
    { timestamp: "2026-08-17 12:07:15", level: "warn",  message: "5 documents could not be auto-classified — missing study metadata" },
    { timestamp: "2026-08-17 12:07:30", level: "warn",  message: "Unclassified documents routed to /local_unclassified/STUDY-B/" },
    { timestamp: "2026-08-17 12:07:45", level: "info",  message: "Uploading 60 classified documents to target vault..." },
    { timestamp: "2026-08-17 12:13:20", level: "info",  message: "60 of 60 documents uploaded successfully" },
    { timestamp: "2026-08-17 12:13:35", level: "warn",  message: "Migration job J-102 completed with PARTIAL success — 60 migrated, 5 need manual review" },
  ],
  "J-103": [
    { timestamp: "2026-08-18 09:00:12", level: "info",  message: "Migration job J-103 initiated by Rakesh" },
    { timestamp: "2026-08-18 09:00:15", level: "info",  message: "Connecting to source: /inbox/STUDY-C/2026/" },
    { timestamp: "2026-08-18 09:00:18", level: "info",  message: "Found 60 documents in source folder" },
    { timestamp: "2026-08-18 09:01:02", level: "info",  message: "Virus scan started on 60 files..." },
    { timestamp: "2026-08-18 09:03:45", level: "info",  message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-18 09:04:00", level: "info",  message: "Document classification in progress..." },
    { timestamp: "2026-08-18 09:06:30", level: "warn",  message: "2 documents could not be auto-classified, queued for manual review" },
    { timestamp: "2026-08-18 09:07:00", level: "info",  message: "Uploading 58 classified documents to target vault..." },
    { timestamp: "2026-08-18 09:10:15", level: "info",  message: "38 of 58 documents uploaded successfully" },
    { timestamp: "2026-08-18 09:12:00", level: "info",  message: "Migration in progress — 65% complete" },
  ],
  "J-104": [
    { timestamp: "2026-08-18 10:00:05", level: "info",  message: "Migration job J-104 initiated by Sahil" },
    { timestamp: "2026-08-18 10:00:10", level: "info",  message: "Connecting to source: /inbox/STUDY-D/2026/" },
    { timestamp: "2026-08-18 10:00:12", level: "info",  message: "Found 25 documents in source folder" },
    { timestamp: "2026-08-18 10:01:00", level: "info",  message: "Virus scan started on 25 files..." },
    { timestamp: "2026-08-18 10:02:30", level: "warn",  message: "File 'report_final_v2.docx' flagged by virus scanner — quarantined" },
    { timestamp: "2026-08-18 10:02:45", level: "info",  message: "Virus scan completed — 1 file quarantined, 24 clean" },
    { timestamp: "2026-08-18 10:03:00", level: "info",  message: "Document classification in progress..." },
    { timestamp: "2026-08-18 10:04:15", level: "error", message: "Classification engine returned error: Timeout after 60s for 3 documents" },
    { timestamp: "2026-08-18 10:04:20", level: "error", message: "Documents rejected: consent_form.pdf, lab_results_017.xlsx, amendment_3.docx" },
    { timestamp: "2026-08-18 10:04:25", level: "info",  message: "Uploading 21 remaining documents to target vault..." },
    { timestamp: "2026-08-18 10:06:00", level: "error", message: "Connection to target vault lost — retry 1/3" },
    { timestamp: "2026-08-18 10:06:30", level: "error", message: "Connection to target vault lost — retry 2/3" },
    { timestamp: "2026-08-18 10:07:00", level: "error", message: "Connection to target vault lost — retry 3/3 FAILED" },
    { timestamp: "2026-08-18 10:07:05", level: "error", message: "Migration job J-104 FAILED — 3 docs rejected, 21 docs not uploaded due to connection failure" },
  ],
  "J-105": [
    { timestamp: "2026-08-19 08:30:02", level: "info", message: "Migration job J-105 initiated by Debabrata" },
    { timestamp: "2026-08-19 08:30:07", level: "info", message: "Connecting to source: /inbox/STUDY-A/2026/" },
    { timestamp: "2026-08-19 08:30:11", level: "info", message: "Found 90 documents in source folder" },
    { timestamp: "2026-08-19 08:31:20", level: "info", message: "Virus scan started on 90 files..." },
    { timestamp: "2026-08-19 08:34:55", level: "info", message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-19 08:35:10", level: "info", message: "Document classification in progress..." },
    { timestamp: "2026-08-19 08:38:40", level: "warn", message: "2 documents rejected — unsupported file format" },
    { timestamp: "2026-08-19 08:39:00", level: "info", message: "Uploading 88 classified documents to target vault..." },
    { timestamp: "2026-08-19 08:44:15", level: "info", message: "52 of 88 documents uploaded successfully" },
    { timestamp: "2026-08-19 08:45:00", level: "info", message: "Migration in progress — 60% complete" },
  ],
  "J-106": [
    { timestamp: "2026-08-19 14:00:05", level: "info", message: "Migration job J-106 initiated by Abakash" },
    { timestamp: "2026-08-19 14:00:09", level: "info", message: "Connecting to source: /inbox/STUDY-E/2026/" },
    { timestamp: "2026-08-19 14:00:12", level: "info", message: "Found 40 documents in source folder" },
    { timestamp: "2026-08-19 14:00:50", level: "info", message: "Virus scan started on 40 files..." },
    { timestamp: "2026-08-19 14:02:30", level: "info", message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-19 14:02:45", level: "info", message: "All 40 documents classified successfully" },
    { timestamp: "2026-08-19 14:03:00", level: "info", message: "Uploading 40 documents to target vault..." },
    { timestamp: "2026-08-19 14:07:20", level: "info", message: "Migration job J-106 COMPLETED — 40 migrated, 0 failed" },
  ],
  "J-107": [
    { timestamp: "2026-08-20 09:15:03", level: "info", message: "Migration job J-107 initiated by Ravi" },
    { timestamp: "2026-08-20 09:15:08", level: "info", message: "Connecting to source: /inbox/STUDY-B/2026/" },
    { timestamp: "2026-08-20 09:15:12", level: "info", message: "Found 72 documents in source folder" },
    { timestamp: "2026-08-20 09:16:10", level: "info", message: "Virus scan started on 72 files..." },
    { timestamp: "2026-08-20 09:19:05", level: "info", message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-20 09:19:30", level: "info", message: "Document classification in progress..." },
    { timestamp: "2026-08-20 09:22:40", level: "warn", message: "7 documents could not be auto-classified — missing site metadata" },
    { timestamp: "2026-08-20 09:23:00", level: "warn", message: "Unclassified documents routed to /local_unclassified/STUDY-B/" },
    { timestamp: "2026-08-20 09:23:20", level: "info", message: "Uploading 65 classified documents to target vault..." },
    { timestamp: "2026-08-20 09:29:45", level: "warn", message: "Migration job J-107 completed with PARTIAL success — 65 migrated, 7 need review" },
  ],
  "J-108": [
    { timestamp: "2026-08-20 16:45:01", level: "info", message: "Migration job J-108 created by Rakesh" },
    { timestamp: "2026-08-20 16:45:04", level: "info", message: "Source folder validated: /inbox/STUDY-C/2026/" },
    { timestamp: "2026-08-20 16:45:07", level: "info", message: "Found 55 documents queued for migration" },
    { timestamp: "2026-08-20 16:45:10", level: "info", message: "Job added to scheduler queue — awaiting available worker" },
    { timestamp: "2026-08-20 16:45:12", level: "info", message: "Migration job J-108 is PENDING execution" },
  ],
  "J-109": [
    { timestamp: "2026-08-21 11:05:02", level: "info", message: "Migration job J-109 initiated by Sahil" },
    { timestamp: "2026-08-21 11:05:06", level: "info", message: "Connecting to source: /inbox/STUDY-F/2026/" },
    { timestamp: "2026-08-21 11:05:10", level: "info", message: "Found 33 documents in source folder" },
    { timestamp: "2026-08-21 11:06:00", level: "info", message: "Virus scan completed — all files clean" },
    { timestamp: "2026-08-21 11:07:15", level: "info", message: "Uploading 33 documents to target vault..." },
    { timestamp: "2026-08-21 11:09:40", level: "info", message: "12 of 33 documents uploaded successfully" },
    { timestamp: "2026-08-21 11:10:05", level: "warn", message: "Revoke requested by operator Sahil" },
    { timestamp: "2026-08-21 11:10:12", level: "warn", message: "Migration job J-109 REVOKED — 12 migrated, 21 rolled back to source" },
  ],
};

// Jobs triggered at runtime have no predefined logs, so a status-aware log set is generated for them.
export function getJobLogs(job: Job): JobLog[] {
  const existing = mockJobLogs[job.id];
  if (existing) {
    return existing;
  }

  const total = job.totalFiles ?? 120;
  const successful = job.successfulFiles ?? Math.max(total - 6, 0);
  const failed = job.failedFiles ?? Math.max(total - successful, 0);
  const stamp = (seconds: number) => {
    const base = new Date(2026, 8, 3, 9, 0, 0);
    base.setSeconds(base.getSeconds() + seconds);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(base.getHours())}:${pad(base.getMinutes())}:${pad(base.getSeconds())}`;
  };

  const logs: JobLog[] = [
    { timestamp: stamp(0),   level: "info", message: `Migration job ${job.id} initiated by ${job.assignedBy}` },
    { timestamp: stamp(5),   level: "info", message: `Connecting to source for ${job.study}` },
    { timestamp: stamp(9),   level: "info", message: `Found ${total} documents in source folder` },
    { timestamp: stamp(45),  level: "info", message: `Virus scan started on ${total} files...` },
    { timestamp: stamp(180), level: "info", message: "Virus scan completed — all files clean" },
    { timestamp: stamp(200), level: "info", message: "Document classification in progress..." },
  ];

  switch (job.status) {
    case JobStatusValues.Running:
      logs.push(
        { timestamp: stamp(320), level: "info", message: `Uploading ${successful} classified documents to target vault...` },
        { timestamp: stamp(420), level: "info", message: `${successful} of ${total} documents uploaded successfully` },
        { timestamp: stamp(480), level: "info", message: "Migration in progress..." },
      );
      break;
    case JobStatusValues.Done:
      logs.push(
        { timestamp: stamp(320), level: "info", message: `Uploading ${total} documents to target vault...` },
        { timestamp: stamp(600), level: "info", message: `Migration job ${job.id} COMPLETED — ${total} migrated, 0 failed` },
      );
      break;
    case JobStatusValues.Partial:
      logs.push(
        { timestamp: stamp(300), level: "warn", message: `${failed} documents could not be auto-classified, queued for manual review` },
        { timestamp: stamp(320), level: "info", message: `Uploading ${successful} classified documents to target vault...` },
        { timestamp: stamp(600), level: "warn", message: `Migration job ${job.id} completed with PARTIAL success — ${successful} migrated, ${failed} need review` },
      );
      break;
    case JobStatusValues.Failed:
      logs.push(
        { timestamp: stamp(300), level: "error", message: `Classification engine returned error for ${failed} documents` },
        { timestamp: stamp(420), level: "error", message: "Connection to target vault lost — retries exhausted" },
        { timestamp: stamp(430), level: "error", message: `Migration job ${job.id} FAILED — ${failed} documents not migrated` },
      );
      break;
    case JobStatusValues.Revoked:
      logs.push({ timestamp: stamp(260), level: "warn", message: `Migration job ${job.id} was REVOKED by an operator` });
      break;
    default:
      logs.push({ timestamp: stamp(260), level: "info", message: `Migration job ${job.id} is queued and awaiting execution` });
      break;
  }

  return logs;
}
