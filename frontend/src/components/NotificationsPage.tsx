import { useState } from "react";

type NotifType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifs: Notification[] = [
  { id: "N-001", type: "success", title: "Migration J-101 Completed",   message: "45 documents migrated successfully to VTMF for STUDY-A.",                      time: "17-Aug 10:20", read: false },
  { id: "N-002", type: "warning", title: "Migration J-102 Partial",     message: "5 documents unclassified for STUDY-B. Manual review required.",                  time: "17-Aug 12:15", read: false },
  { id: "N-003", type: "info",    title: "New Upload by Rakesh",        message: "60 documents uploaded for STUDY-C and queued for migration.",                     time: "18-Aug 09:00", read: true },
  { id: "N-004", type: "error",   title: "Migration J-104 Failed",      message: "3 documents rejected, connection to vault lost. Check audit trail for details.",  time: "18-Aug 11:00", read: false },
  { id: "N-005", type: "info",    title: "Review Completed",            message: "Debabrata reviewed 5 unclassified documents for STUDY-B.",                        time: "18-Aug 14:00", read: true },
  { id: "N-006", type: "success", title: "Retry Successful",            message: "2 previously unclassified docs for STUDY-B mapped to VTMF after retry.",          time: "19-Aug 09:30", read: false },
  { id: "N-007", type: "warning", title: "Virus Scan Alert",            message: "File 'report_final_v2.docx' quarantined during STUDY-D migration.",              time: "18-Aug 10:32", read: true },
  { id: "N-008", type: "info",    title: "System Maintenance",          message: "Scheduled maintenance on 20-Aug 02:00–04:00 UTC. Migrations paused.",            time: "19-Aug 16:00", read: true },
];

const typeStyle: Record<NotifType, { icon: string; border: string; bg: string; iconBg: string }> = {
  success: { icon: "✅", border: "border-emerald-200", bg: "bg-emerald-50", iconBg: "bg-emerald-100" },
  error:   { icon: "❌", border: "border-rose-200",    bg: "bg-rose-50",    iconBg: "bg-rose-100" },
  warning: { icon: "⚠️",  border: "border-amber-200",   bg: "bg-amber-50",   iconBg: "bg-amber-100" },
  info:    { icon: "ℹ️",  border: "border-blue-200",    bg: "bg-blue-50",    iconBg: "bg-blue-100" },
};

export function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifs.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? notifs.filter((n) => !n.read) : notifs;

  const markRead = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">🔔 Notifications</h2>
        <p className="text-gray-500 text-sm mb-5 text-center">Stay updated on migration events and system alerts</p>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "all" ? "bg-pink-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              All ({notifs.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "unread" ? "bg-pink-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-3">🔔</span>
              <p>No {filter === "unread" ? "unread " : ""}notifications</p>
            </div>
          ) : (
            displayed.map((n) => {
              const s = typeStyle[n.type];
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markRead(n.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); markRead(n.id); } }}
                  aria-label={`${n.read ? "" : "Unread: "}${n.title}`}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    n.read ? "bg-white border-gray-100" : `${s.bg} ${s.border}`
                  }`}
                >
                  <span className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 text-lg ${n.read ? "bg-gray-100" : s.iconBg}`}>
                    {s.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-semibold truncate ${n.read ? "text-gray-600" : "text-gray-900"}`}>
                        {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />}
                        {n.title}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{n.time}</span>
                    </div>
                    <p className={`text-sm mt-0.5 ${n.read ? "text-gray-400" : "text-gray-600"}`}>{n.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
