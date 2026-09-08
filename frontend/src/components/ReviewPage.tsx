import { useState } from "react";

type ReviewStatus = "pending" | "approved" | "rejected";

interface ReviewDoc {
  id: string;
  fileName: string;
  study: string;
  country: string;
  site: string;
  docType: string;
  migratedDate: string;
  status: ReviewStatus;
}

const initialDocs: ReviewDoc[] = [
  { id: "R-001", fileName: "protocol_v3.pdf",       study: "STUDY-A", country: "US", site: "Site1", docType: "Protocol",         migratedDate: "17-Aug", status: "pending" },
  { id: "R-002", fileName: "consent_form.pdf",      study: "STUDY-A", country: "US", site: "Site1", docType: "Informed Consent", migratedDate: "17-Aug", status: "approved" },
  { id: "R-003", fileName: "lab_results_017.xlsx",  study: "STUDY-A", country: "US", site: "Site2", docType: "Lab Report",       migratedDate: "17-Aug", status: "approved" },
  { id: "R-004", fileName: "site_list.xlsx",        study: "STUDY-A", country: "CA", site: "SiteA", docType: "Site Management",  migratedDate: "17-Aug", status: "pending" },
  { id: "R-005", fileName: "budget_summary.xlsx",   study: "STUDY-C", country: "US", site: "Site1", docType: "Finance",         migratedDate: "18-Aug", status: "pending" },
  { id: "R-006", fileName: "monitoring_report.docx", study: "STUDY-D", country: "CA", site: "SiteA", docType: "Monitoring",     migratedDate: "18-Aug", status: "rejected" },
  { id: "R-007", fileName: "safety_update.pdf",     study: "STUDY-B", country: "UK", site: "Site1", docType: "Safety",          migratedDate: "18-Aug", status: "pending" },
  { id: "R-008", fileName: "irb_approval.pdf",      study: "STUDY-C", country: "US", site: "Site2", docType: "Regulatory",      migratedDate: "18-Aug", status: "approved" },
];

const statusConfig: Record<ReviewStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending:  { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",   label: "Pending Review" },
  approved: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
  rejected: { dot: "bg-rose-500",    bg: "bg-rose-50",    text: "text-rose-700",    label: "Rejected" },
};

export function ReviewPage() {
  const [docs, setDocs] = useState(initialDocs);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");

  const filtered = docs.filter((d) => filter === "all" || d.status === filter);
  const pendingCount = docs.filter((d) => d.status === "pending").length;
  const approvedCount = docs.filter((d) => d.status === "approved").length;
  const rejectedCount = docs.filter((d) => d.status === "rejected").length;

  const updateStatus = (id: string, status: ReviewStatus) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">👁️ Review Documents</h2>
        <p className="text-gray-500 text-sm mb-5 text-center">Review migrated documents before final approval to VTMF</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Pending Review</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Approved</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-rose-700">{rejectedCount}</p>
            <p className="text-xs text-rose-600 font-medium mt-1">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-4">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === s ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? `All (${docs.length})` : `${statusConfig[s].label} (${s === "pending" ? pendingCount : s === "approved" ? approvedCount : rejectedCount})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Study</th>
                  <th className="px-4 py-3">Country / Site</th>
                  <th className="px-4 py-3">Doc Type</th>
                  <th className="px-4 py-3">Migrated</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No documents match the filter</td></tr>
                ) : (
                  filtered.map((doc) => {
                    const s = statusConfig[doc.status];
                    return (
                      <tr key={doc.id} className="text-center hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-left font-medium text-gray-900">{doc.fileName}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.study}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.country} / {doc.site}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.docType}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.migratedDate}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {doc.status === "pending" ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateStatus(doc.id, "approved")}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => updateStatus(doc.id, "rejected")}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => updateStatus(doc.id, "pending")}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                              ↩ Undo
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
