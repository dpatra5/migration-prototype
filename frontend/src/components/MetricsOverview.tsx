import type { MigrationMetrics } from "../types/index";

const rows: { key: keyof MigrationMetrics; label: string; icon: string; color: string; bg: string }[] = [
  { key: "total",        label: "Total Documents", icon: "📦", color: "text-blue-700",    bg: "bg-blue-50" },
  { key: "success",      label: "Successful",      icon: "✅", color: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "failed",       label: "Failed",          icon: "❌", color: "text-rose-700",    bg: "bg-rose-50" },
  { key: "unclassified", label: "Unclassified",    icon: "⚠️",  color: "text-amber-700",   bg: "bg-amber-50" },
];

export function MetricsOverview({ metrics }: { metrics: MigrationMetrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {rows.map((r) => (
        <div key={r.key} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4`}>
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${r.bg} text-xl flex-shrink-0`}>
            {r.icon}
          </span>
          <div>
            <p className="text-xs text-gray-500 font-medium">{r.label}</p>
            <p className={`text-2xl font-bold ${r.color}`}>{metrics[r.key].toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
