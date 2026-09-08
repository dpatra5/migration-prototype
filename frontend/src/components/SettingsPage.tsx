import { useState } from "react";

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

export function SettingsPage() {
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

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
