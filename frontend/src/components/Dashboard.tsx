import { useCallback, useEffect, useRef, useState } from "react";
import {
  canAccessPage,
  type AccessControlConfig,
  type AppPage,
  type Role,
} from "../accessControl";
import {
  mockMetrics,
  mockMetricsByYear,
  mockMetricsByMonth,
  mockJobs,
} from "../data/mockData";
import {
  JobStatusValues,
  type AppNotification,
  type Job,
  type NotificationType,
} from "../types/index";
import { useDashboardData } from "../hooks/useDashboardData";
import { MetricsOverview } from "./MetricsOverview";
import { RecentJobsTable } from "./RecentJobsTable";
import {
  MigrationProgressPanel,
  type SchedulerPhase,
  type ScheduledMigration,
} from "./MigrationProgressPanel";
import { UploadPage } from "./UploadPage";
import { MappingPage, type RemapPrefill } from "./MappingPage";
import { ReviewPage } from "./ReviewPage";
import { UnclassifiedDocsPage } from "./UnclassifiedDocsPage";
import { AuditTrailPage } from "./AuditTrailPage";
import { NotificationsPage } from "./NotificationsPage";
import { UserManagementPage } from "./UserManagementPage";
import { SettingsPage } from "./SettingsPage";
import { BellIcon } from "./icons/BellIcon";
import { ProfileMenu } from "./ProfileMenu";
import { useLanguage } from "../i18n/LanguageContext";

const navTranslationKeys: Partial<Record<AppPage, string>> = {
  Dashboard: "nav.dashboard",
  Upload: "nav.upload",
  Mapping: "nav.mapping",
  Review: "nav.review",
  "Unclassified Docs": "nav.unclassifiedDocs",
  "Audit Trail": "nav.auditTrail",
  "User Management": "nav.userManagement",
  Settings: "nav.settings",
};

const menuItems: {
  label: AppPage;
  icon: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    label: "Dashboard",
    icon: "📊",
    activeBg: "bg-blue-600/20",
    activeBorder: "border-blue-500",
  },
  {
    label: "Upload",
    icon: "⬆️",
    activeBg: "bg-emerald-600/20",
    activeBorder: "border-emerald-500",
  },
  {
    label: "Mapping",
    icon: "🗺️",
    activeBg: "bg-purple-600/20",
    activeBorder: "border-purple-500",
  },
  {
    label: "Unclassified Docs",
    icon: "📄",
    activeBg: "bg-orange-600/20",
    activeBorder: "border-orange-500",
  },
  {
    label: "Audit Trail",
    icon: "🔍",
    activeBg: "bg-indigo-600/20",
    activeBorder: "border-indigo-500",
  },
  // { label: "Notifications",     icon: "🔔", activeBg: "bg-pink-600/20",    activeBorder: "border-pink-500" },
  {
    label: "User Management",
    icon: "🧑‍💼",
    activeBg: "bg-cyan-600/20",
    activeBorder: "border-cyan-500",
  },
];

interface DashboardProps {
  currentRole: Role;
  accessConfig: AccessControlConfig;
  onAccessConfigChange: (config: AccessControlConfig) => void;
  onSignOut: () => void;
}

const initialNotifications: AppNotification[] = [
  {
    id: "N-001",
    type: "success",
    title: "Migration J-101 Completed",
    message: "45 documents migrated successfully to VTMF for STUDY-A.",
    time: "17-Aug 10:20",
    read: false,
    jobId: "J-101",
    migrationStatus: "completed",
  },
  {
    id: "N-002",
    type: "warning",
    title: "Migration J-102 Partial",
    message: "5 documents unclassified for STUDY-B. Manual review required.",
    time: "17-Aug 12:15",
    read: false,
    jobId: "J-102",
    migrationStatus: "partial",
  },
  {
    id: "N-003",
    type: "info",
    title: "New Upload by Rakesh",
    message: "60 documents uploaded for STUDY-C and queued for migration.",
    time: "18-Aug 09:00",
    read: true,
  },
  {
    id: "N-004",
    type: "error",
    title: "Migration J-104 Failed",
    message:
      "3 documents rejected, connection to vault lost. Check audit trail for details.",
    time: "18-Aug 11:00",
    read: false,
    jobId: "J-104",
    migrationStatus: "failed",
  },
  {
    id: "N-005",
    type: "info",
    title: "Review Completed",
    message: "Debabrata reviewed 5 unclassified documents for STUDY-B.",
    time: "18-Aug 14:00",
    read: true,
  },
  {
    id: "N-006",
    type: "success",
    title: "Retry Successful",
    message:
      "2 previously unclassified docs for STUDY-B mapped to VTMF after retry.",
    time: "19-Aug 09:30",
    read: false,
  },
  {
    id: "N-007",
    type: "warning",
    title: "Virus Scan Alert",
    message:
      "File 'report_final_v2.docx' quarantined during STUDY-D migration.",
    time: "18-Aug 10:32",
    read: true,
  },
  {
    id: "N-008",
    type: "info",
    title: "System Maintenance",
    message:
      "Scheduled maintenance on 20-Aug 02:00-04:00 UTC. Migrations paused.",
    time: "19-Aug 16:00",
    read: true,
  },
];

function formatNotificationTime(value: Date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(value.getDate()).padStart(2, "0");
  const month = months[value.getMonth()];
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${day}-${month} ${hours}:${minutes}`;
}

function formatBellBadgeCount(count: number) {
  if (count <= 0) {
    return "";
  }

  return `${count}`;
}

const toastStyle: Record<
  NotificationType,
  { border: string; bg: string; title: string; body: string }
> = {
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    title: "text-emerald-900",
    body: "text-emerald-800",
  },
  error: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    title: "text-rose-900",
    body: "text-rose-800",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    title: "text-amber-900",
    body: "text-amber-800",
  },
  info: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    title: "text-blue-900",
    body: "text-blue-800",
  },
};

export function Dashboard({
  currentRole,
  accessConfig,
  onAccessConfigChange,
  onSignOut,
}: DashboardProps) {
  const { t } = useLanguage();
  const live = useDashboardData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<AppPage>(
    accessConfig[currentRole].pages[0],
  );
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] =
    useState<AppNotification[]>(initialNotifications);
  const [toastNotification, setToastNotification] =
    useState<AppNotification | null>(null);
  const [activeMigrations, setActiveMigrations] = useState<
    (ScheduledMigration & { phase: SchedulerPhase })[]
  >([]);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(
    null,
  );
  const [mappingFocusFile, setMappingFocusFile] = useState<string | null>(null);
  const [uploadPrefill, setUploadPrefill] = useState<RemapPrefill | null>(null);
  const nextJobNumber = useRef(110);
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeItem]);

  // Merge backend jobs into local state so runtime-added migrations survive.
  useEffect(() => {
    if (!live.online) return;
    setJobs((current) => {
      const localOnly = current.filter(
        (job) =>
          !live.jobs.some((liveJob) => liveJob.id === job.id) &&
          job.id.startsWith("J-1"),
      );
      const merged = [...live.jobs, ...localOnly];
      // Sort by date desc; use the full timestamp when available, fall back to id order.
      const tsOf = (job: Job) => {
        const raw = job.sortAt ?? job.date ?? "";
        const t = Date.parse(raw);
        return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
      };
      merged.sort((a, b) => {
        const diff = tsOf(b) - tsOf(a);
        return diff !== 0 ? diff : b.id.localeCompare(a.id);
      });
      return merged;
    });
  }, [live.online, live.jobs]);

  const dashboardMetrics =
    live.online && live.metrics ? live.metrics : mockMetrics;

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const bellBadgeCount = formatBellBadgeCount(unreadNotificationCount);
  // A job currently shown in the "Mapping in progress" banner (and the
  // Recent Migrations panel) should not also appear as a separate row in the
  // Recent Jobs table, otherwise the same J-ID looks duplicated.
  const activeLiveJobIds = new Set(live.active.map((job) => job.id));
  const recentJobs = jobs
    .filter((job) => !activeLiveJobIds.has(job.id))
    .slice(0, 10);
  const filteredJobs = normalizedSearch
    ? recentJobs.filter(
        (job) =>
          job.id.toLowerCase().includes(normalizedSearch) ||
          job.study.toLowerCase().includes(normalizedSearch),
      )
    : recentJobs;

  const updateJobStatus = useCallback(
    (jobId: string, status: Job["status"]) => {
      setJobs((currentJobs) =>
        currentJobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
      );
    },
    [],
  );

  const updateJobWithFinalStats = useCallback(
    (jobId: string, status: Job["status"]) => {
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === jobId
            ? { ...job, status, successfulFiles: 114, failedFiles: 6 }
            : job,
        ),
      );
    },
    [],
  );

  const startMigration = useCallback(
    (migrationDetails: Omit<ScheduledMigration, "id" | "startedAt">) => {
      const now = new Date();
      const jobId = `J-${nextJobNumber.current}`;
      nextJobNumber.current += 1;
      const migration = {
        id: jobId,
        ...migrationDetails,
        startedAt: now.getTime(),
      };
      const notificationId = `N-${Date.now()}`;
      const startedNotification: AppNotification = {
        id: notificationId,
        type: "info",
        title: `Migration ${jobId} Started`,
        message: `Migration started for ${migration.study}. Job ${jobId} is in progress.`,
        time: formatNotificationTime(now),
        read: false,
        jobId,
        migrationStatus: "in-progress",
      };

      setJobs((currentJobs) => [
        {
          id: jobId,
          study: migration.study,
          status: JobStatusValues.Running,
          date: "03-Sep",
          sortAt: now.toISOString(),
          assignedBy: "Automatic Scheduler",
          totalFiles: 120,
          successfulFiles: 0,
          failedFiles: 0,
        },
        ...currentJobs,
      ]);
      setNotifications((currentNotifications) => [
        startedNotification,
        ...currentNotifications,
      ]);
      setToastNotification(startedNotification);
      setActiveMigrations((currentMigrations) => [
        ...currentMigrations,
        { ...migration, phase: "running" },
      ]);
      setSelectedMigrationId(jobId);
      setActiveItem("Dashboard");
    },
    [],
  );

  const updateMigrationPhase = useCallback(
    (jobId: string, phase: SchedulerPhase) => {
      setActiveMigrations((currentMigrations) =>
        currentMigrations.map((migration) =>
          migration.id === jobId ? { ...migration, phase } : migration,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (!toastNotification) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastNotification(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [toastNotification]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  }, []);

  const deleteNotifications = useCallback((notificationIds: string[]) => {
    const idsToRemove = new Set(notificationIds);
    setNotifications((currentNotifications) =>
      currentNotifications.filter(
        (notification) => !idsToRemove.has(notification.id),
      ),
    );
  }, []);

  const updateMigrationNotification = useCallback(
    (
      jobId: string,
      status: AppNotification["migrationStatus"],
      type: AppNotification["type"],
      title: string,
      message: string,
    ) => {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.jobId === jobId
            ? {
                ...notification,
                type,
                title,
                message,
                migrationStatus: status,
                time: formatNotificationTime(new Date()),
                read: false,
              }
            : notification,
        ),
      );
    },
    [],
  );

  const handleMigrationComplete = useCallback(
    (jobId: string) => {
      updateMigrationPhase(jobId, "complete");
      updateJobWithFinalStats(jobId, JobStatusValues.Partial);
      updateMigrationNotification(
        jobId,
        "partial",
        "warning",
        `Migration ${jobId} Partial`,
        `Migration ${jobId} completed with partial success. Some files require review.`,
      );
      setToastNotification({
        id: `N-${Date.now()}`,
        type: "success",
        title: `Migration ${jobId} Completed`,
        message: `Migration ${jobId} finished successfully. 114 of 120 files migrated; 6 files need review.`,
        time: formatNotificationTime(new Date()),
        read: false,
        jobId,
        migrationStatus: "partial",
      });
    },
    [
      updateMigrationPhase,
      updateJobWithFinalStats,
      updateMigrationNotification,
    ],
  );

  const revokeJob = useCallback(
    (jobId: string) => {
      const isActive = activeMigrations.some(
        (migration) => migration.id === jobId,
      );

      if (isActive) {
        updateJobStatus(jobId, JobStatusValues.Pending);
        updateMigrationNotification(
          jobId,
          "revoked",
          "warning",
          `Migration ${jobId} Revoked`,
          `Migration ${jobId} was revoked and moved to pending state.`,
        );
        setActiveMigrations((currentMigrations) =>
          currentMigrations.filter((migration) => migration.id !== jobId),
        );
        setSelectedMigrationId((currentSelectedId) => {
          if (currentSelectedId !== jobId) {
            return currentSelectedId;
          }
          const remaining = activeMigrations.filter(
            (migration) => migration.id !== jobId,
          );
          return remaining[0]?.id ?? null;
        });
        return;
      }

      updateJobStatus(jobId, JobStatusValues.Revoked);
      updateMigrationNotification(
        jobId,
        "revoked",
        "warning",
        `Migration ${jobId} Revoked`,
        `Migration ${jobId} was revoked manually.`,
      );
    },
    [activeMigrations, updateJobStatus, updateMigrationNotification],
  );

  const retryJob = useCallback(
    (job: Job) => {
      if (job.status === JobStatusValues.Pending) {
        const now = new Date();
        updateJobStatus(job.id, JobStatusValues.Running);
        setActiveMigrations((currentMigrations) => {
          if (currentMigrations.some((migration) => migration.id === job.id)) {
            return currentMigrations;
          }

          return [
            ...currentMigrations,
            {
              id: job.id,
              study: job.study,
              masterFolder: job.study,
              startedAt: now.getTime(),
              phase: "running",
            },
          ];
        });
        setSelectedMigrationId(job.id);
        updateMigrationNotification(
          job.id,
          "in-progress",
          "info",
          `Migration ${job.id} Retried`,
          `Migration ${job.id} has been retried and is now in progress.`,
        );
        mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // For Partial status jobs, start new migration with circular progress
      if (job.status === JobStatusValues.Partial) {
        // Start the migration process with circular progress
        startMigration({
          study: job.study,
          masterFolder: job.study,
        });
        // Scroll to top of dashboard
        mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // For other retryable statuses (Failed), update status and retry
      updateJobStatus(job.id, JobStatusValues.Running);
      updateMigrationNotification(
        job.id,
        "in-progress",
        "info",
        `Migration ${job.id} Retried`,
        `Migration ${job.id} has been retried and is now in progress.`,
      );
    },
    [updateJobStatus, updateMigrationNotification, startMigration],
  );

  const availableMenuItems = menuItems.filter((item) =>
    canAccessPage(accessConfig, currentRole, item.label),
  );

  useEffect(() => {
    // "Notifications" is opened via the header bell icon rather than the sidebar menu,
    // so it should stay open for any role even if it isn't in that role's RBAC page list.
    if (activeItem === "Notifications") {
      return;
    }

    if (!canAccessPage(accessConfig, currentRole, activeItem)) {
      setActiveItem(accessConfig[currentRole].pages[0]);
    }
  }, [accessConfig, activeItem, currentRole]);

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="z-20 bg-gray-900 shadow-lg flex-shrink-0">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
            >
              {menuOpen ? (
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            <h1 className="text-base font-bold text-white">{t("appTitle")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveItem("Notifications");
                setMenuOpen(false);
              }}
              aria-label="Open notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors text-yellow-400 hover:text-yellow-300"
            >
              <BellIcon className="w-6 h-6" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-[1.1rem] text-center">
                  {bellBadgeCount}
                </span>
              )}
            </button>
            <ProfileMenu
              name="Sahil Dey"
              role={accessConfig[currentRole].label}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
            menuOpen ? "w-52" : "w-0"
          }`}
        >
          <nav className="flex flex-col py-2 w-52">
            {availableMenuItems.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveItem(item.label);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors border-l-[3px] ${
                    isActive
                      ? `${item.activeBg} ${item.activeBorder} text-white font-semibold`
                      : "border-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  <span>{t(navTranslationKeys[item.label] ?? item.label)}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto">
          {toastNotification && (
            <div
              className={`fixed right-5 top-16 z-30 rounded-xl border px-4 py-3 shadow-lg ${toastStyle[toastNotification.type].border} ${toastStyle[toastNotification.type].bg}`}
            >
              <p
                className={`text-sm font-semibold ${toastStyle[toastNotification.type].title}`}
              >
                {toastNotification.title}
              </p>
              <p
                className={`text-xs mt-1 ${toastStyle[toastNotification.type].body}`}
              >
                {toastNotification.message}
              </p>
            </div>
          )}

          {activeItem === "Dashboard" && (
            <div className="px-6 py-3 space-y-6">
              {live.mapping &&
                (() => {
                  const active = live.active[0];
                  const total = active?.totalFiles ?? 0;
                  const mapped =
                    active?.mappedFiles ?? active?.successfulFiles ?? 0;
                  const unclassified = active?.unclassifiedFiles ?? 0;
                  const transferred =
                    active?.destinationFiles ?? mapped + unclassified;
                  const pct =
                    total > 0
                      ? Math.min(100, Math.round((transferred / total) * 100))
                      : 0;
                  return (
                    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="relative inline-flex h-10 w-10 items-center justify-center">
                          <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/40" />
                          <svg
                            className="relative h-6 w-6 animate-spin text-blue-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-900">
                            Mapping in progress…
                          </p>
                          <p
                            className="text-xs text-blue-800/80 truncate"
                            title={live.mappingLabel ?? ""}
                          >
                            {live.active.length} active{" "}
                            {live.active.length === 1 ? "job" : "jobs"}
                            {live.mappingLabel
                              ? ` · currently processing ${live.mappingLabel}`
                              : ""}
                          </p>
                        </div>
                        <div className="hidden md:grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-blue-500">
                              Total
                            </p>
                            <p className="text-sm font-semibold text-blue-900">
                              {total}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-emerald-500">
                              Mapped
                            </p>
                            <p className="text-sm font-semibold text-emerald-700">
                              {mapped}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-orange-500">
                              Unclassified
                            </p>
                            <p className="text-sm font-semibold text-orange-700">
                              {unclassified}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-indigo-500">
                              Progress
                            </p>
                            <p className="text-sm font-semibold text-indigo-700">
                              {pct}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              <section>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("dashboard.migrationOverview")}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      live.online
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                    title={
                      live.online
                        ? `Live · updated ${live.lastUpdated?.toLocaleTimeString() ?? ""}`
                        : (live.error ??
                          "Backend offline — showing sample data")
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        live.online
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    {live.online ? "Live" : "Offline"}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {t("dashboard.realTimeStats")}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                  <MetricsOverview
                    metrics={dashboardMetrics}
                    metricsByYear={mockMetricsByYear}
                    metricsByMonth={mockMetricsByMonth}
                  />
                  <MigrationProgressPanel
                    jobs={jobs}
                    activeMigrations={activeMigrations}
                    selectedMigrationId={selectedMigrationId}
                    onSelectMigration={setSelectedMigrationId}
                    onJobComplete={handleMigrationComplete}
                    onRevoke={revokeJob}
                  />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("dashboard.recentJobs")}
                  </h2>
                  <div className="w-full max-w-xs mx-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={t("dashboard.searchPlaceholder")}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setActiveItem("Audit Trail")}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    {t("dashboard.viewFullAuditTrail")} →
                  </button>
                </div>
                <RecentJobsTable
                  jobs={filteredJobs}
                  onRevoke={revokeJob}
                  onRetry={retryJob}
                />
              </section>

              {(() => {
                const unclassifiedTotal = live.metrics?.unclassified ?? 0;
                const unclassifiedByStudy = (live.report?.jobs ?? [])
                  .filter((row) => row.unclassifiedDocs > 0)
                  .map((row) => ({
                    jobId: row.jobId,
                    study: row.study || row.sourceName,
                    unclassified: row.unclassifiedDocs,
                    sourceDocs: row.sourceDocs,
                  }))
                  .sort((a, b) => b.unclassified - a.unclassified)
                  .slice(0, 8);
                return (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">
                          Unclassified Documents
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                          {unclassifiedTotal} pending review
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveItem("Unclassified Docs")}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        Open Unclassified Docs →
                      </button>
                    </div>
                    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                      {unclassifiedByStudy.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-500">
                          No unclassified documents. Every mapped file landed in
                          a TMF zone.
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Job
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Study
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                Unclassified
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                Source Docs
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                Share
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {unclassifiedByStudy.map((row) => {
                              const share =
                                row.sourceDocs > 0
                                  ? Math.round(
                                      (row.unclassified / row.sourceDocs) * 100,
                                    )
                                  : 0;
                              return (
                                <tr
                                  key={row.jobId}
                                  className="hover:bg-orange-50/40"
                                >
                                  <td className="px-6 py-3 font-semibold text-gray-900">
                                    {row.jobId}
                                  </td>
                                  <td className="px-6 py-3 text-gray-700">
                                    <span
                                      className="block truncate max-w-[360px]"
                                      title={row.study}
                                    >
                                      {row.study}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right font-semibold text-orange-700">
                                    {row.unclassified}
                                  </td>
                                  <td className="px-6 py-3 text-right text-gray-700">
                                    {row.sourceDocs}
                                  </td>
                                  <td className="px-6 py-3 text-right text-gray-700">
                                    {share}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>
                );
              })()}
            </div>
          )}

          {activeItem === "Upload" && (
            <UploadPage
              onStartMigration={startMigration}
              prefill={uploadPrefill}
            />
          )}

          {activeItem === "Mapping" && (
            <MappingPage
              focusedFileName={mappingFocusFile}
              onClearFocus={() => setMappingFocusFile(null)}
              onRemap={(prefill) => {
                setUploadPrefill(prefill);
                setActiveItem("Upload");
              }}
              onRetryMigration={(details) => {
                startMigration({
                  study: details.study,
                  masterFolder: `${details.fileName} to ${details.site} / ${details.subsite}`,
                });
              }}
            />
          )}

          {activeItem === "Review" && <ReviewPage />}

          {activeItem === "Unclassified Docs" && (
            <UnclassifiedDocsPage
              onUpdateMetadata={(fileName) => {
                setMappingFocusFile(fileName);
                setActiveItem("Mapping");
              }}
            />
          )}

          {activeItem === "Audit Trail" && <AuditTrailPage />}

          {activeItem === "User Management" && (
            <UserManagementPage
              currentRole={currentRole}
              accessConfig={accessConfig}
            />
          )}

          {activeItem === "Notifications" && (
            <NotificationsPage
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onDelete={deleteNotification}
              onDeleteMany={deleteNotifications}
            />
          )}

          {/* {activeItem === "Settings" && (
            <SettingsPage
              currentRole={currentRole}
              accessConfig={accessConfig}
              onAccessConfigChange={onAccessConfigChange}
            />
          )} */}
        </main>
      </div>
    </div>
  );
}
