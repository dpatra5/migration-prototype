import { useState } from "react";
import { canManageRole, roles, type AccessControlConfig, type AppPage, type Role } from "../accessControl";

interface SettingsState {
  emailNotifications: boolean;
  virusScanDefault: boolean;
  autoRetryFailed: boolean;
  maxRetries: string;
  defaultCRO: string;
  vtmfEndpoint: string;
  inboxBasePath: string;
  sessionTimeout: string;
}

interface ManagedUser {
  id: string;
  name: string;
  role: Role;
}

const initialManagedUsers: ManagedUser[] = [
  { id: "u-100", name: "Priya Shah", role: "support" },
  { id: "u-101", name: "Marcus Lee", role: "user" },
  { id: "u-102", name: "Elena Rossi", role: "admin" },
];

interface SettingsPageProps {
  currentRole: Role;
  accessConfig: AccessControlConfig;
  onAccessConfigChange: (config: AccessControlConfig) => void;
}

export function SettingsPage({ currentRole, accessConfig, onAccessConfigChange }: SettingsPageProps) {
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    virusScanDefault: true,
    autoRetryFailed: false,
    maxRetries: "3",
    defaultCRO: "IQVIA",
    vtmfEndpoint: "https://vtmf.example.com/api/v1",
    inboxBasePath: "/inbox/",
    sessionTimeout: "30",
  });
  const [saved, setSaved] = useState(false);
  const [managedUsers, setManagedUsers] = useState(initialManagedUsers);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateManagedUserRole = (userId: string, role: Role) => {
    setManagedUsers((users) => users.map((user) => (
      user.id === userId ? { ...user, role } : user
    )));
  };

  const manageableRoles = roles.filter((role) => canManageRole(accessConfig, currentRole, role));

  const togglePageAccess = (role: Role, page: AppPage) => {
    const currentPages = accessConfig[role].pages;
    const pages = currentPages.includes(page)
      ? currentPages.filter((currentPage) => currentPage !== page)
      : [...currentPages, page];

    onAccessConfigChange({ ...accessConfig, [role]: { ...accessConfig[role], pages } });
  };

  const toggleRoleManagement = (role: Role, managedRole: Role) => {
    const currentManagedRoles = accessConfig[role].canManageRoles;
    const canManageRoles = currentManagedRoles.includes(managedRole)
      ? currentManagedRoles.filter((currentManagedRole) => currentManagedRole !== managedRole)
      : [...currentManagedRoles, managedRole];

    onAccessConfigChange({ ...accessConfig, [role]: { ...accessConfig[role], canManageRoles } });
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">⚙️ Settings</h2>
        <p className="text-gray-500 text-sm mb-6 text-center">Configure application preferences and system defaults</p>

        <div className="space-y-6">
          {/* Migration Defaults */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Migration Defaults</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Default CRO Team</label>
                <select
                  value={settings.defaultCRO}
                  onChange={(e) => update("defaultCRO", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="IQVIA">IQVIA</option>
                  <option value="Covance">Covance</option>
                  <option value="PPD">PPD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Inbox Base Path</label>
                <input
                  type="text"
                  value={settings.inboxBasePath}
                  onChange={(e) => update("inboxBasePath", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">VTMF API Endpoint</label>
                <input
                  type="text"
                  value={settings.vtmfEndpoint}
                  onChange={(e) => update("vtmfEndpoint", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.virusScanDefault}
                  onChange={(e) => update("virusScanDefault", e.target.checked)}
                  className="w-4 h-4 rounded text-slate-600"
                />
                <span className="text-sm text-gray-700">Enable virus scan by default for all uploads</span>
              </label>
            </div>
          </div>

          {/* Retry Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Retry & Recovery</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRetryFailed}
                  onChange={(e) => update("autoRetryFailed", e.target.checked)}
                  className="w-4 h-4 rounded text-slate-600"
                />
                <span className="text-sm text-gray-700">Auto-retry failed migrations</span>
              </label>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Max Retry Attempts</label>
                <select
                  value={settings.maxRetries}
                  onChange={(e) => update("maxRetries", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
          </div>

          {manageableRoles.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Role Management</h3>
              <p className="text-sm text-gray-500 mb-4">Assign roles within your administrative scope.</p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {managedUsers.map((user) => {
                  const canManageUser = canManageRole(accessConfig, currentRole, user.role);
                  const availableRoles = canManageUser ? manageableRoles : [user.role];

                  return (
                    <div key={user.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{accessConfig[user.role].description}</p>
                      </div>
                      <select
                        aria-label={`Role for ${user.name}`}
                        value={user.role}
                        disabled={!canManageUser}
                        onChange={(event) => updateManagedUserRole(user.id, event.target.value as Role)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        {availableRoles.map((role) => <option key={role} value={role}>{accessConfig[role].label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentRole === "superadmin" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Access Policy</h3>
              <p className="text-sm text-gray-500 mb-4">Configure page access and role administration permissions. Changes apply immediately for this session.</p>
              <div className="space-y-5">
                {roles.map((role) => (
                  <div key={role} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800">{accessConfig[role].label}</h4>
                    <fieldset className="mt-3">
                      <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pages</legend>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(["Dashboard", "Upload", "Mapping", "Review", "Unclassified Docs", "Audit Trail", "Notifications", "Settings"] as AppPage[]).map((page) => (
                          <label key={page} className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={accessConfig[role].pages.includes(page)} onChange={() => togglePageAccess(role, page)} className="h-4 w-4 rounded text-slate-700" />
                            {page}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="mt-4">
                      <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">Can manage roles</legend>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                        {roles.filter((managedRole) => managedRole !== role).map((managedRole) => (
                          <label key={managedRole} className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={accessConfig[role].canManageRoles.includes(managedRole)} onChange={() => toggleRoleManagement(role, managedRole)} className="h-4 w-4 rounded text-slate-700" />
                            {accessConfig[managedRole].label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications & Session */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Notifications & Session</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => update("emailNotifications", e.target.checked)}
                  className="w-4 h-4 rounded text-slate-600"
                />
                <span className="text-sm text-gray-700">Send email notifications on job completion</span>
              </label>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => update("sessionTimeout", e.target.value)}
                  min="5"
                  max="120"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 font-medium">✓ Settings saved</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
