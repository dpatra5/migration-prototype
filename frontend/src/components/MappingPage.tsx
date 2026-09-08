import { useState } from "react";

type MappingStatus = "mapped" | "unclassified" | "pending";

interface MappingDoc {
  id: string;
  fileName: string;
  study: string;
  country: string;
  site: string;
  docType: string;
  metadataMatch: number;
  status: MappingStatus;
  destination: string;
}

const mockMappings: MappingDoc[] = [
  { id: "D-001", fileName: "protocol_v3.pdf",       study: "STUDY-A", country: "US", site: "Site1", docType: "Protocol",         metadataMatch: 98, status: "mapped",       destination: "VTMF" },
  { id: "D-002", fileName: "consent_form.pdf",      study: "STUDY-A", country: "US", site: "Site1", docType: "Informed Consent", metadataMatch: 95, status: "mapped",       destination: "VTMF" },
  { id: "D-003", fileName: "lab_results_017.xlsx",  study: "STUDY-A", country: "US", site: "Site2", docType: "Lab Report",       metadataMatch: 92, status: "mapped",       destination: "VTMF" },
  { id: "D-004", fileName: "site_list.xlsx",        study: "STUDY-A", country: "CA", site: "SiteA", docType: "Site Management",  metadataMatch: 88, status: "mapped",       destination: "VTMF" },
  { id: "D-005", fileName: "amendment_2.docx",      study: "STUDY-B", country: "UK", site: "Site1", docType: "Regulatory",       metadataMatch: 45, status: "unclassified", destination: "Unclassified" },
  { id: "D-006", fileName: "unknown_scan.pdf",      study: "STUDY-B", country: "UK", site: "Site1", docType: "—",               metadataMatch: 12, status: "unclassified", destination: "Unclassified" },
  { id: "D-007", fileName: "budget_summary.xlsx",   study: "STUDY-C", country: "US", site: "Site1", docType: "Finance",         metadataMatch: 91, status: "mapped",       destination: "VTMF" },
  { id: "D-008", fileName: "randomization.pdf",     study: "STUDY-C", country: "US", site: "Site2", docType: "—",               metadataMatch: 30, status: "unclassified", destination: "Unclassified" },
  { id: "D-009", fileName: "monitoring_report.docx", study: "STUDY-D", country: "CA", site: "SiteA", docType: "Monitoring",     metadataMatch: 85, status: "mapped",       destination: "VTMF" },
  { id: "D-010", fileName: "safety_update.pdf",     study: "STUDY-A", country: "US", site: "Site1", docType: "—",               metadataMatch: 0,  status: "pending",      destination: "—" },
];

const statusStyle: Record<MappingStatus, { dot: string; bg: string; text: string; label: string }> = {
  mapped:       { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Mapped → VTMF" },
  unclassified: { dot: "bg-rose-500",    bg: "bg-rose-50",    text: "text-rose-700",    label: "Unclassified" },
  pending:      { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",   label: "Pending" },
};

const studies = ["All", "STUDY-A", "STUDY-B", "STUDY-C", "STUDY-D"];

export function MappingPage() {
  const [studyFilter, setStudyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<MappingStatus | "all">("all");

  const filtered = mockMappings.filter((d) => {
    if (studyFilter !== "All" && d.study !== studyFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const mappedCount = mockMappings.filter((d) => d.status === "mapped").length;
  const unclassifiedCount = mockMappings.filter((d) => d.status === "unclassified").length;
  const pendingCount = mockMappings.filter((d) => d.status === "pending").length;

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">🗺️ Document Mapping</h2>
        <p className="text-gray-500 text-sm mb-5 text-center">
          Map documents by Study → Country → Site using metadata. Successfully mapped docs go to <strong>VTMF</strong>, others to <strong>Unclassified</strong>.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{mappedCount}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Mapped → VTMF</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-rose-700">{unclassifiedCount}</p>
            <p className="text-xs text-rose-600 font-medium mt-1">Unclassified</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Pending</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            aria-label="Filter by study"
            value={studyFilter}
            onChange={(e) => setStudyFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {studies.map((s) => <option key={s} value={s}>{s === "All" ? "All Studies" : s}</option>)}
          </select>
          <div className="flex gap-1.5">
            {(["all", "mapped", "unclassified", "pending"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s === "all" ? "All" : s === "mapped" ? "Mapped" : s === "unclassified" ? "Unclassified" : "Pending"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Study</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Doc Type</th>
                  <th className="px-4 py-3">Metadata Match</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No documents match the filter</td></tr>
                ) : (
                  filtered.map((doc) => {
                    const s = statusStyle[doc.status];
                    return (
                      <tr key={doc.id} className="text-center hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-left font-medium text-gray-900">{doc.fileName}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.study}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.country}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.site}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.docType}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${doc.metadataMatch >= 80 ? "bg-emerald-500" : doc.metadataMatch >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${doc.metadataMatch}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{doc.metadataMatch}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${doc.destination === "VTMF" ? "text-emerald-700" : doc.destination === "Unclassified" ? "text-rose-600" : "text-gray-400"}`}>
                            {doc.destination}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {filtered.length} of {mockMappings.length} documents
        </div>
      </div>
    </div>
  );
}
