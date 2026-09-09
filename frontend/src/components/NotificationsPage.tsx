import { useEffect, useMemo, useState } from "react";
import type {
  AppNotification,
  MigrationNotificationStatus,
  NotificationType,
} from "../types";
import { BellIcon } from "./icons/BellIcon";

const typeStyle: Record<
  NotificationType,
  { icon: string; border: string; bg: string; iconBg: string }
> = {
  success: {
    icon: "✅",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
  },
  error: {
    icon: "❌",
    border: "border-rose-200",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
  },
  warning: {
    icon: "⚠️",
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
  },
  info: {
    icon: "ℹ️",
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
  },
};

const migrationStatusStyle: Record<
  MigrationNotificationStatus,
  { label: string; bg: string; text: string }
> = {
  "in-progress": {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  partial: {
    label: "Partial",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-100",
    text: "text-rose-700",
  },
  revoked: {
    label: "Revoked",
    bg: "bg-gray-200",
    text: "text-gray-700",
  },
};

interface NotificationsPageProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
}

export function NotificationsPage({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onDeleteMany,
}: NotificationsPageProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [jobSearch, setJobSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(notifications.map((n) => n.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedByRead =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const normalizedJobSearch = jobSearch.trim().toLowerCase();
  const displayed = useMemo(
    () =>
      normalizedJobSearch
        ? displayedByRead.filter(
            (n) =>
              n.title.toLowerCase().includes(normalizedJobSearch) ||
              n.message.toLowerCase().includes(normalizedJobSearch) ||
              n.id.toLowerCase().includes(normalizedJobSearch) ||
              (n.jobId ?? "").toLowerCase().includes(normalizedJobSearch),
          )
        : displayedByRead,
    [displayedByRead, normalizedJobSearch],
  );

  const allDisplayedSelected =
    displayed.length > 0 && displayed.every((n) => selectedIds.has(n.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allDisplayedSelected) {
        displayed.forEach((n) => next.delete(n.id));
      } else {
        displayed.forEach((n) => next.add(n.id));
      }
      return next;
    });
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) {
      return;
    }

    if (
      window.confirm(
        `Delete ${selectedIds.size} selected notification${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`,
      )
    ) {
      onDeleteMany(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center flex items-center justify-center gap-2">
          <BellIcon className="w-5 h-5 text-pink-600" />
          Notifications
        </h2>
        <p className="text-gray-500 text-sm mb-5 text-center">
          Stay updated on migration events and system alerts
        </p>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "all"
                  ? "bg-pink-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "unread"
                  ? "bg-pink-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Unread ({unreadCount})
            </button>
            {displayed.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  allDisplayedSelected
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {allDisplayedSelected ? "Deselect All" : "Select All"}
              </button>
            )}
            <button
              onClick={removeSelected}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              🗑️ Remove Selected
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={jobSearch}
            onChange={(event) => setJobSearch(event.target.value)}
            placeholder="Search notifications by Job ID (e.g., J-101)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BellIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
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
                  onClick={() => onMarkRead(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onMarkRead(n.id);
                    }
                  }}
                  aria-label={`${n.read ? "" : "Unread: "}${n.title}`}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    n.read ? "bg-white border-gray-100" : `${s.bg} ${s.border}`
                  } ${selectedIds.has(n.id) ? "ring-2 ring-blue-400" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(n.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelected(n.id)}
                    aria-label={`Select notification: ${n.title}`}
                    className="mt-1 w-4 h-4 rounded text-blue-600 flex-shrink-0"
                  />
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 text-lg ${n.read ? "bg-gray-100" : s.iconBg}`}
                  >
                    {s.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-semibold truncate ${n.read ? "text-gray-600" : "text-gray-900"}`}
                      >
                        {!n.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                        )}
                        {n.title}
                      </h3>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{n.time}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(n.id);
                          }}
                          aria-label={`Delete notification: ${n.title}`}
                          title="Delete notification"
                          className="text-gray-400 hover:text-rose-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </span>
                    </div>
                    {n.migrationStatus && (
                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${migrationStatusStyle[n.migrationStatus].bg} ${migrationStatusStyle[n.migrationStatus].text}`}
                        >
                          {migrationStatusStyle[n.migrationStatus].label}
                        </span>
                      </div>
                    )}
                    <p
                      className={`text-sm mt-0.5 ${n.read ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {n.message}
                    </p>
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
