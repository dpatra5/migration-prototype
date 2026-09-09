import { useCallback, useEffect, useRef, useState } from "react";
import { canAccessPage, type AccessControlConfig, type AppPage, type Role } from "../accessControl";
import { mockMetrics, mockJobs } from "../data/mockData";
import { JobStatusValues, type Job } from "../types/index";
import { MetricsOverview } from "./MetricsOverview";
import { RecentJobsTable } from "./RecentJobsTable";
import { AutomaticJobScheduler, type ScheduledMigration } from "./AutomaticJobScheduler";
import { UploadPage } from "./UploadPage";
import { MappingPage } from "./MappingPage";
import { ReviewPage } from "./ReviewPage";
import { UnclassifiedDocsPage } from "./UnclassifiedDocsPage";
import { AuditTrailPage } from "./AuditTrailPage";
import { NotificationsPage } from "./NotificationsPage";
import { SettingsPage } from "./SettingsPage";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<AppPage>(accessConfig[currentRole].pages[0]);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [activeMigration, setActiveMigration] = useState<ScheduledMigration | null>(null);
  const nextJobNumber = useRef(105);

  const updateJobStatus = useCallback((jobId: string, status: Job["status"]) => {
    setJobs((currentJobs) => currentJobs.map((job) => (
      job.id === jobId ? { ...job, status } : job
    )));
  }, []);

  const startMigration = useCallback((migrationDetails: Omit<ScheduledMigration, "id">) => {
    const jobId = `J-${nextJobNumber.current}`;
    nextJobNumber.current += 1;
    const migration = { id: jobId, ...migrationDetails };

    setJobs((currentJobs) => [
      { id: jobId, study: migration.study, status: JobStatusValues.Running, date: "03-Sep", assignedBy: "Automatic Scheduler" },
      ...currentJobs,
    ]);
    setActiveMigration(migration);
    setActiveItem("Dashboard");
  }, []);

  const revokeJob = useCallback((jobId: string) => {
    if (activeMigration?.id === jobId) {
      updateJobStatus(jobId, JobStatusValues.Pending);
      setActiveMigration(null);
      return;
    }

    updateJobStatus(jobId, JobStatusValues.Revoked);
  }, [activeMigration, updateJobStatus]);

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
                <svg className="w-6 h-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <h1 className="text-base font-bold text-white">Migration Utility</h1>
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
          {activeItem === "Dashboard" && (
            <div className="px-6 py-3 space-y-6">
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Migration Overview</h2>
                <p className="text-gray-500 text-sm mb-4">Real-time migration statistics</p>
                <MetricsOverview metrics={mockMetrics} />
              </section>

              {activeMigration && (
                <AutomaticJobScheduler
                  key={activeMigration.id}
                  migration={activeMigration}
                  onJobComplete={(jobId) => updateJobStatus(jobId, JobStatusValues.Partial)}
                  onJobRevoked={(jobId) => updateJobStatus(jobId, JobStatusValues.Pending)}
                />
              )}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Recent Jobs</h2>
                  <button
                  onClick={() => setActiveItem("Audit Trail")}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    View Full Audit Trail →
                  </button>
                </div>
                <RecentJobsTable jobs={jobs} onRevoke={revokeJob} />
              </section>
            </div>
          )}

          {activeItem === "Upload" && <UploadPage onStartMigration={startMigration} />}

          {activeItem === "Mapping" && <MappingPage />}

          {activeItem === "Review" && <ReviewPage />}

          {activeItem === "Unclassified Docs" && <UnclassifiedDocsPage />}

          {activeItem === "Audit Trail" && <AuditTrailPage />}

          {activeItem === "Notifications" && <NotificationsPage />}

          {activeItem === "Settings" && <SettingsPage currentRole={currentRole} accessConfig={accessConfig} onAccessConfigChange={onAccessConfigChange} />}
        </main>
      </div>
    </div>
  );
}
