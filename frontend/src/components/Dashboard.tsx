import { useCallback, useEffect, useRef, useState } from "react";
import { canAccessPage, type AccessControlConfig, type AppPage, type Role } from "../accessControl";
import { mockMetrics, mockJobs } from "../data/mockData";
import {
  JobStatusValues,
  type AppNotification,
  type Job,
  type NotificationType,
} from "../types/index";
import { MetricsOverview } from "./MetricsOverview";
import { RecentJobsTable } from "./RecentJobsTable";
import {
  AutomaticJobScheduler,
  type SchedulerPhase,
  type ScheduledMigration,
} from "./AutomaticJobScheduler";
import { UploadPage } from "./UploadPage";
import { MappingPage } from "./MappingPage";
import { ReviewPage } from "./ReviewPage";
import { UnclassifiedDocsPage } from "./UnclassifiedDocsPage";
import { AuditTrailPage } from "./AuditTrailPage";
import { NotificationsPage } from "./NotificationsPage";
import { SettingsPage } from "./SettingsPage";
import { BellIcon } from "./icons/BellIcon";

const menuItems: { label: AppPage; icon: string; activeBg: string; activeBorder: string }[] = [
  { label: "Dashboard",         icon: "📊", activeBg: "bg-blue-600/20",    activeBorder: "border-blue-500" },
  { label: "Upload",            icon: "⬆️",  activeBg: "bg-emerald-600/20", activeBorder: "border-emerald-500" },
  { label: "Mapping",           icon: "🗺️", activeBg: "bg-purple-600/20",  activeBorder: "border-purple-500" },
  { label: "Review",            icon: "👁️",  activeBg: "bg-amber-600/20",   activeBorder: "border-amber-500" },
  { label: "Unclassified Docs", icon: "📄", activeBg: "bg-orange-600/20",  activeBorder: "border-orange-500" },
  { label: "Audit Trail",       icon: "🔍", activeBg: "bg-indigo-600/20",  activeBorder: "border-indigo-500" },
  { label: "Notifications",     icon: "🔔", activeBg: "bg-pink-600/20",    activeBorder: "border-pink-500" },
  { label: "Settings",          icon: "⚙️",  activeBg: "bg-slate-600/20",   activeBorder: "border-slate-500" },
];

interface DashboardProps {
  currentRole: Role;
  accessConfig: AccessControlConfig;
  onAccessConfigChange: (config: AccessControlConfig) => void;
  onSignOut: () => void;
}

export function Dashboard({ currentRole, accessConfig, onAccessConfigChange, onSignOut }: DashboardProps) {

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

export function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<AppPage>(accessConfig[currentRole].pages[0]);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] =
    useState<AppNotification[]>(initialNotifications);
  const [toastNotification, setToastNotification] =
    useState<AppNotification | null>(null);
  const [activeMigration, setActiveMigration] =
    useState<ScheduledMigration | null>(null);
  const [migrationPhase, setMigrationPhase] =
    useState<SchedulerPhase>("running");
  const nextJobNumber = useRef(105);

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const bellBadgeCount = formatBellBadgeCount(unreadNotificationCount);
  const filteredJobs = normalizedSearch
    ? jobs.filter(
        (job) =>
          job.id.toLowerCase().includes(normalizedSearch) ||
          job.study.toLowerCase().includes(normalizedSearch),
      )
    : jobs;

  const updateJobStatus = useCallback(
    (jobId: string, status: Job["status"]) => {
      setJobs((currentJobs) =>
        currentJobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
      );
    },
    [],
  );

  const startMigration = useCallback(
    (migrationDetails: Omit<ScheduledMigration, "id">) => {
      const now = new Date();
      const jobId = `J-${nextJobNumber.current}`;
      nextJobNumber.current += 1;
      const migration = {
        id: jobId,
        startedAt: now.getTime(),
        ...migrationDetails,
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
          assignedBy: "Automatic Scheduler",
        },
        ...currentJobs,
      ]);
      setNotifications((currentNotifications) => [
        startedNotification,
        ...currentNotifications,
      ]);
      setToastNotification(startedNotification);
      setActiveMigration(migration);
      setMigrationPhase("running");
      setActiveItem("Dashboard");
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

  const revokeJob = useCallback(
    (jobId: string) => {
      if (activeMigration?.id === jobId) {
        updateJobStatus(jobId, JobStatusValues.Pending);
        updateMigrationNotification(
          jobId,
          "revoked",
          "warning",
          `Migration ${jobId} Revoked`,
          `Migration ${jobId} was revoked and moved to pending state.`,
        );
        setMigrationPhase("revoked");
        setActiveMigration(null);
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
    [activeMigration, updateJobStatus, updateMigrationNotification],
  );

  const availableMenuItems = menuItems.filter((item) => canAccessPage(accessConfig, currentRole, item.label));

  useEffect(() => {
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
            <h1 className="text-base font-bold text-white">
              Migration Utility
            </h1>
          </div>
          <div className="flex items-center gap-4">
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
            <p className="text-sm text-gray-300">
              Welcome back,{" "}
              <span className="font-semibold text-white">Rakesh bishoyi</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">{accessConfig[currentRole].label}</span>
            <button type="button" onClick={onSignOut} className="rounded-md border border-gray-700 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-800">Sign out</button>
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
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
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
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Migration Overview
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Real-time migration statistics
                </p>
                <MetricsOverview metrics={mockMetrics} />
              </section>

              {activeMigration && (
                <AutomaticJobScheduler
                  key={activeMigration.id}
                  migration={activeMigration}
                  phase={migrationPhase}
                  onJobComplete={(jobId) => {
                    setMigrationPhase("complete");
                    updateJobStatus(jobId, JobStatusValues.Partial);
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
                  }}
                  onJobRevoked={(jobId) => {
                    setMigrationPhase("revoked");
                    updateJobStatus(jobId, JobStatusValues.Pending);
                    updateMigrationNotification(
                      jobId,
                      "revoked",
                      "warning",
                      `Migration ${jobId} Revoked`,
                      `Migration ${jobId} was revoked and moved to pending state.`,
                    );
                  }}
                />
              )}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    Recent Jobs
                  </h2>
                  <div className="w-full max-w-xs mx-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by Job ID or Study name"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setActiveItem("Audit Trail")}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    View Full Audit Trail →
                  </button>
                </div>
                <RecentJobsTable jobs={filteredJobs} onRevoke={revokeJob} />
              </section>
            </div>
          )}

          {activeItem === "Upload" && (
            <UploadPage onStartMigration={startMigration} />
          )}

          {activeItem === "Mapping" && <MappingPage />}

          {activeItem === "Review" && <ReviewPage />}

          {activeItem === "Unclassified Docs" && <UnclassifiedDocsPage />}

          {activeItem === "Audit Trail" && <AuditTrailPage />}

          {activeItem === "Notifications" && (
            <NotificationsPage
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onDelete={deleteNotification}
              onDeleteMany={deleteNotifications}
            />
          )}

          {activeItem === "Settings" && <SettingsPage currentRole={currentRole} accessConfig={accessConfig} onAccessConfigChange={onAccessConfigChange} />}
        </main>
      </div>
    </div>
  );
}
