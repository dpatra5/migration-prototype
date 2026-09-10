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
};
