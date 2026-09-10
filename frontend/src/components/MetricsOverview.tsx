import { useEffect, useMemo, useState } from "react";
import type { MigrationMetrics } from "../types/index";

const rows: { key: keyof MigrationMetrics; label: string; barColor: string; textColor: string }[] = [
  { key: "total",        label: "Total Documents", barColor: "bg-gradient-to-t from-blue-600 to-blue-400",       textColor: "text-blue-700" },
  { key: "success",      label: "Successful",      barColor: "bg-gradient-to-t from-emerald-600 to-emerald-400", textColor: "text-emerald-700" },
  { key: "failed",       label: "Failed",          barColor: "bg-gradient-to-t from-rose-600 to-rose-400",       textColor: "text-rose-700" },
  { key: "unclassified", label: "Unclassified",    barColor: "bg-gradient-to-t from-amber-600 to-amber-400",     textColor: "text-amber-700" },
];

const coverageRows: { key: keyof MigrationMetrics; label: string; iconBg: string; iconText: string; valueText: string }[] = [
  { key: "studies",   label: "Total Studies",   iconBg: "bg-indigo-50", iconText: "text-indigo-600", valueText: "text-indigo-700" },
  { key: "countries", label: "Total Countries", iconBg: "bg-cyan-50",   iconText: "text-cyan-600",   valueText: "text-cyan-700" },
  { key: "sites",     label: "Total Sites",     iconBg: "bg-fuchsia-50", iconText: "text-fuchsia-600", valueText: "text-fuchsia-700" },
];

type ViewMode = "overall" | "year" | "month";
const viewModes: ViewMode[] = ["overall", "year", "month"];

type MetricsOverviewProps = {
  metrics: MigrationMetrics;
  metricsByYear: Record<string, MigrationMetrics>;
  metricsByMonth: Record<string, Record<string, MigrationMetrics>>;
};

export function MetricsOverview({ metrics, metricsByYear, metricsByMonth }: MetricsOverviewProps) {
  const years = useMemo(() => Object.keys(metricsByYear).sort(), [metricsByYear]);
  const [viewMode, setViewMode] = useState<ViewMode>("overall");
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] ?? "");

  const months = useMemo(
    () => Object.keys(metricsByMonth[selectedYear] ?? {}),
    [metricsByMonth, selectedYear],
  );
  const [selectedMonth, setSelectedMonth] = useState(months[months.length - 1] ?? "");

  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1]);
    }
  }, [months, selectedMonth]);

  const activeMetrics: MigrationMetrics =
    viewMode === "overall"
      ? metrics
      : viewMode === "year"
        ? (metricsByYear[selectedYear] ?? metrics)
        : (metricsByMonth[selectedYear]?.[selectedMonth] ?? metrics);

  const subtitle =
    viewMode === "overall" ? "All-time" : viewMode === "year" ? selectedYear : `${selectedMonth} ${selectedYear}`;

  const maxValue = Math.max(...rows.map((r) => activeMetrics[r.key]), 1);

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {viewModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                viewMode === mode ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {viewMode !== "overall" && (
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {viewMode === "month" && (
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">{subtitle}</p>

      <div className="flex items-stretch gap-4 mt-2 flex-1">
        <div className="flex flex-col flex-1">
          <div className="flex justify-center gap-3 h-5 flex-shrink-0">
            {rows.map((r) => {
              const value = activeMetrics[r.key];
              return (
                <span
                  key={r.key}
                  className={`flex-1 max-w-[4.5rem] text-center text-xs font-bold whitespace-nowrap overflow-hidden ${r.textColor}`}
                >
                  {value.toLocaleString()}
                </span>
              );
            })}
          </div>

          <div key={`${viewMode}-${selectedYear}-${selectedMonth}`} className="flex items-stretch justify-center gap-3 flex-1 mt-1">
            {rows.map((r, index) => {
              const value = activeMetrics[r.key];
              const heightPct = Math.max((value / maxValue) * 100, 4);
              return (
                <div key={r.key} className="flex flex-col items-center flex-1 max-w-[4.5rem]">
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      className={`w-8 rounded-t-md shadow-sm animate-bar-grow transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${r.barColor}`}
                      style={{ height: `${heightPct}%`, animationDelay: `${index * 80}ms` }}
                      title={`${r.label}: ${value.toLocaleString()}`}
                    />
                  </div>
                  <p className="w-full h-8 flex-shrink-0 text-center text-[11px] leading-tight text-gray-500 font-medium mt-2 line-clamp-2">
                    {r.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-px bg-gray-100" />

        <div className="flex flex-col justify-center gap-3 w-32 flex-shrink-0">
          {coverageRows.map((r, index) => {
            const value = activeMetrics[r.key];
            return (
              <div
                key={r.key}
                className={`rounded-xl border border-gray-100 ${r.iconBg} px-3 py-2 flex flex-col items-center justify-center animate-fade-in-up transition-all duration-300 hover:scale-105 hover:shadow-md`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className={`text-xl font-bold ${r.valueText}`}>{value.toLocaleString()}</p>
                <p className={`text-[11px] font-medium mt-0.5 ${r.iconText}`}>{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
