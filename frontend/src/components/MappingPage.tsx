import { Fragment, useEffect, useMemo, useState } from "react";
import {
  findMappingForStudy,
  getMappingHistory,
  recordMapping,
  type MappingHistoryEntry,
} from "../data/mappingHistory";

export type RemapPrefill = {
  study: string;
  country: string;
  site: string;
  subsite: string;
  docType: string;
};

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
  {
    id: "D-001",
    fileName: "protocol_v3.pdf",
    study: "STUDY-A",
    country: "US",
    site: "Site1",
    docType: "Protocol",
    metadataMatch: 98,
    status: "mapped",
    destination: "VTMF",
  },
  {
    id: "D-002",
    fileName: "consent_form.pdf",
    study: "STUDY-A",
    country: "US",
    site: "Site1",
    docType: "Informed Consent",
    metadataMatch: 95,
    status: "mapped",
    destination: "VTMF",
  },
  {
    id: "D-003",
    fileName: "lab_results_017.xlsx",
    study: "STUDY-A",
    country: "US",
    site: "Site2",
    docType: "Lab Report",
    metadataMatch: 92,
    status: "mapped",
    destination: "VTMF",
  },
  {
    id: "D-004",
    fileName: "site_list.xlsx",
    study: "STUDY-A",
    country: "CA",
    site: "SiteA",
    docType: "Site Management",
    metadataMatch: 88,
    status: "mapped",
    destination: "VTMF",
  },
  {
    id: "D-005",
    fileName: "amendment_2.docx",
    study: "STUDY-B",
    country: "UK",
    site: "Site1",
    docType: "Regulatory",
    metadataMatch: 45,
    status: "unclassified",
    destination: "Unclassified",
  },
  {
    id: "D-006",
    fileName: "unknown_scan.pdf",
    study: "STUDY-B",
    country: "UK",
    site: "Site1",
    docType: "—",
    metadataMatch: 12,
    status: "unclassified",
    destination: "Unclassified",
  },
  {
    id: "D-007",
    fileName: "budget_summary.xlsx",
    study: "STUDY-C",
    country: "US",
    site: "Site1",
    docType: "Finance",
    metadataMatch: 91,
    status: "mapped",
    destination: "VTMF",
  },
  {
    id: "D-008",
    fileName: "randomization.pdf",
    study: "STUDY-C",
    country: "US",
    site: "Site2",
    docType: "—",
    metadataMatch: 30,
    status: "unclassified",
    destination: "Unclassified",
  },
  {
    id: "D-009",
    fileName: "monitoring_report.docx",
    study: "STUDY-D",
    country: "CA",
    site: "SiteA",
    docType: "Monitoring",
    metadataMatch: 85,
    status: "mapped",
    destination: "VTMF",
  },
  {
    id: "D-010",
    fileName: "safety_update.pdf",
    study: "STUDY-A",
    country: "US",
    site: "Site1",
    docType: "—",
    metadataMatch: 0,
    status: "pending",
    destination: "—",
  },
];

const statusStyle: Record<
  MappingStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  mapped: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Mapped → VTMF",
  },
  unclassified: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    label: "Unclassified",
  },
  pending: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Pending",
  },
};

const studies = ["All", "STUDY-A", "STUDY-B", "STUDY-C", "STUDY-D"];

const studyOptions = ["STUDY-A", "STUDY-B", "STUDY-C", "STUDY-D"];
const countryOptions = ["US", "UK", "CA", "IN"];
const siteOptions = ["Site1", "Site2", "SiteA"];
const docTypeOptions = ["Protocol", "Informed Consent", "Lab Report", "Regulatory", "Monitoring", "Finance", "Site Management", "Safety"];

function formatMatchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month} ${hours}:${minutes}`;
}

type MappingPageProps = {
  focusedFileName?: string | null;
  onClearFocus?: () => void;
  onRemap?: (prefill: RemapPrefill) => void;
  onRetryMigration?: (prefill: RemapPrefill & { fileName: string }) => void;
};

export function MappingPage({ focusedFileName, onClearFocus, onRemap, onRetryMigration }: MappingPageProps) {
  const [activeTab, setActiveTab] = useState<"documents" | "history">(
    "documents",
  );
  const [studyFilter, setStudyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<MappingStatus | "all">(
    "all",
  );
  const [historyStudyFilter, setHistoryStudyFilter] = useState("All");
  const [historyCountryFilter, setHistoryCountryFilter] = useState("All");
  const [mappings, setMappings] = useState<MappingDoc[]>(mockMappings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MappingDoc | null>(null);
  const [editorPlacement, setEditorPlacement] = useState<"top" | "inline">("inline");
  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [retrievedDocId, setRetrievedDocId] = useState<string | null>(null);

  const toggleHistory = (docId: string) => {
    setHistoryDocId((current) => (current === docId ? null : docId));
    setRetrievedDocId(null);
  };

  // Falls back to the document's current mapping when no stored history exists.
  const lastMappingFor = (doc: MappingDoc): MappingHistoryEntry => {
    const stored = findMappingForStudy(doc.study, doc.country);
    return (
      stored ?? {
        study: doc.study,
        country: doc.country,
        site: doc.site,
        subsite: doc.destination === "VTMF" ? doc.docType : "—",
        docType: doc.docType,
        matchedAt: "",
      }
    );
  };

  const mappingHistory = useMemo<MappingHistoryEntry[]>(
    () => (activeTab === "history" ? getMappingHistory() : []),
    [activeTab],
  );

  const historyCountries = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(mappingHistory.map((entry) => entry.country)),
      ).sort(),
    ],
    [mappingHistory],
  );

  const filteredHistory = mappingHistory.filter((entry) => {
    if (historyStudyFilter !== "All" && entry.study !== historyStudyFilter)
      return false;
    if (
      historyCountryFilter !== "All" &&
      entry.country !== historyCountryFilter
    )
      return false;
    return true;
  });

  useEffect(() => {
    if (!focusedFileName) {
      return;
    }

    const match = mappings.find((doc) => doc.fileName === focusedFileName);
    if (match) {
      setActiveTab("documents");
      setStudyFilter("All");
      setStatusFilter("all");
      setEditingId(match.id);
      setDraft(match);
      setEditorPlacement("top");
    }
  }, [focusedFileName, mappings]);

  const startEditing = (doc: MappingDoc) => {
    setEditingId(doc.id);
    setDraft(doc);
    setEditorPlacement("inline");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
    onClearFocus?.();
  };

  const saveDraft = () => {
    if (!draft) {
      return;
    }

    setMappings((current) => current.map((doc) => (doc.id === draft.id ? draft : doc)));
    cancelEditing();
  };

  const updateDraft = (field: keyof MappingDoc, value: string | number) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const retryWithDraft = () => {
    if (!draft) {
      return;
    }

    const remapped: MappingDoc = {
      ...draft,
      status: "mapped",
      destination: "VTMF",
    };

    setMappings((current) =>
      current.map((doc) => (doc.id === remapped.id ? remapped : doc)),
    );
    recordMapping({
      study: remapped.study,
      country: remapped.country,
      site: remapped.site,
      subsite: remapped.docType,
      docType: remapped.docType,
    });
    cancelEditing();
    onRetryMigration?.({
      fileName: remapped.fileName,
      study: remapped.study,
      country: remapped.country,
      site: remapped.site,
      subsite: remapped.docType,
      docType: remapped.docType,
    });
  };

  const filtered = mappings.filter((d) => {
    if (studyFilter !== "All" && d.study !== studyFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const mappedCount = mappings.filter((d) => d.status === "mapped").length;
  const unclassifiedCount = mappings.filter((d) => d.status === "unclassified").length;
  const pendingCount = mappings.filter((d) => d.status === "pending").length;

  const editorPanel = draft && editingId ? (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-purple-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Detailed Mapping — {draft.fileName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Document ID {draft.id} · Edit the metadata below and save to remap this document.
          </p>
        </div>
        <button
          onClick={cancelEditing}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="mapping-file-name" className="block text-xs font-semibold text-gray-600 mb-1">File Name</label>
          <input
            id="mapping-file-name"
            type="text"
            value={draft.fileName}
            onChange={(e) => updateDraft("fileName", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label htmlFor="mapping-study" className="block text-xs font-semibold text-gray-600 mb-1">Study</label>
          <select
            id="mapping-study"
            value={draft.study}
            onChange={(e) => updateDraft("study", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {studyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mapping-country" className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
          <select
            id="mapping-country"
            value={draft.country}
            onChange={(e) => updateDraft("country", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {countryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mapping-site" className="block text-xs font-semibold text-gray-600 mb-1">Site</label>
          <select
            id="mapping-site"
            value={draft.site}
            onChange={(e) => updateDraft("site", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {siteOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mapping-doc-type" className="block text-xs font-semibold text-gray-600 mb-1">Document Type</label>
          <select
            id="mapping-doc-type"
            value={draft.docType}
            onChange={(e) => updateDraft("docType", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="—">— Not set —</option>
            {docTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mapping-status" className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select
            id="mapping-status"
            value={draft.status}
            onChange={(e) => updateDraft("status", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="mapped">Mapped</option>
            <option value="unclassified">Unclassified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label htmlFor="mapping-match" className="block text-xs font-semibold text-gray-600 mb-1">Metadata Match (%)</label>
          <input
            id="mapping-match"
            type="number"
            min={0}
            max={100}
            value={draft.metadataMatch}
            onChange={(e) => updateDraft("metadataMatch", Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="mapping-destination" className="block text-xs font-semibold text-gray-600 mb-1">Destination</label>
          <input
            id="mapping-destination"
            type="text"
            value={draft.destination}
            onChange={(e) => updateDraft("destination", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={cancelEditing}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveDraft}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          Save Mapping
        </button>
        {editorPlacement === "top" && (
          <button
            onClick={retryWithDraft}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            🔄 Retry Migration
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">
          🗺️ Document Mapping
        </h2>
        <p className="text-gray-500 text-sm mb-5 text-center">
          Map documents by Study → Country → Site using metadata. Successfully
          mapped docs go to <strong>VTMF</strong>, others to{" "}
          <strong>Unclassified</strong>.
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5 border-b border-gray-200">
          {(["documents", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "documents" ? "Document Mapping" : "Mapping History"}
            </button>
          ))}
        </div>

        {activeTab === "history" ? (
          <>
            <p className="text-gray-500 text-sm mb-4 -mt-2">
              Study → Country combinations that were previously mapped to a
              Vault Site/Subsite. When starting a new migration for the same
              Study and Country, the mapping is applied automatically so it
              doesn't need to be selected again.
            </p>

            {/* History Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <select
                aria-label="Filter history by study"
                value={historyStudyFilter}
                onChange={(e) => setHistoryStudyFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {studies.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Studies" : s}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter history by country"
                value={historyCountryFilter}
                onChange={(e) => setHistoryCountryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {historyCountries.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Countries" : c}
                  </option>
                ))}
              </select>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-4 py-3">Study</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Vault Site</th>
                      <th className="px-4 py-3">Vault Subsite</th>
                      <th className="px-4 py-3">Document Type</th>
                      <th className="px-4 py-3">Last Matched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No saved mappings yet. Mappings are recorded
                          automatically the first time a migration is started
                          for a Study + Country pair.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((entry) => (
                        <tr
                          key={`${entry.study}-${entry.country}`}
                          className="text-center hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {entry.study}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {entry.country}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {entry.site}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {entry.subsite}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {entry.docType}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {formatMatchedAt(entry.matchedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Showing {filteredHistory.length} of {mappingHistory.length} saved
              mappings
            </div>
          </>
        ) : (
          <>
            {editorPlacement === "top" && editorPanel && (
              <div className="mb-5">{editorPanel}</div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {mappedCount}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  Mapped → VTMF
                </p>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-rose-700">
                  {unclassifiedCount}
                </p>
                <p className="text-xs text-rose-600 font-medium mt-1">
                  Unclassified
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {pendingCount}
                </p>
                <p className="text-xs text-amber-600 font-medium mt-1">
                  Pending
                </p>
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
                {studies.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Studies" : s}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                {(["all", "mapped", "unclassified", "pending"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        statusFilter === s
                          ? "bg-purple-600 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {s === "all"
                        ? "All"
                        : s === "mapped"
                          ? "Mapped"
                          : s === "unclassified"
                            ? "Unclassified"
                            : "Pending"}
                    </button>
                  ),
                )}
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
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No documents match the filter
                        </td>
                      </tr>
                    ) : (
                      filtered.map((doc) => {
                        const s = statusStyle[doc.status];
                        return (
                          <Fragment key={doc.id}>
                          <tr
                            className={`text-center transition-colors ${editingId === doc.id ? "bg-purple-50" : "hover:bg-gray-50/50"}`}
                          >
                            <td className="px-4 py-3 text-left font-medium text-gray-900">
                              {doc.fileName}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {doc.study}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {doc.country}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {doc.site}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {doc.docType}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${doc.metadataMatch >= 80 ? "bg-emerald-500" : doc.metadataMatch >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                    style={{ width: `${doc.metadataMatch}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {doc.metadataMatch}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${s.dot}`}
                                />
                                {s.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-semibold ${doc.destination === "VTMF" ? "text-emerald-700" : doc.destination === "Unclassified" ? "text-rose-600" : "text-gray-400"}`}
                              >
                                {doc.destination}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleHistory(doc.id)}
                                aria-expanded={historyDocId === doc.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                              >
                                🕘 History
                              </button>
                            </td>
                          </tr>
                          {historyDocId === doc.id && (
                            <tr>
                              <td colSpan={9} className="px-4 py-4 bg-purple-50/40 text-left">
                                {retrievedDocId === doc.id ? (
                                  <div className="bg-white rounded-2xl border-2 border-purple-200 p-5">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div>
                                        <h3 className="text-base font-bold text-gray-900">
                                          Mapping Details — {doc.fileName}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          Document ID {doc.id}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const entry = lastMappingFor(doc);
                                          onRemap?.({
                                            study: doc.study,
                                            country: doc.country,
                                            site: entry.site,
                                            subsite: entry.subsite,
                                            docType: doc.docType,
                                          });
                                        }}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                      >
                                        🔁 Remap
                                      </button>
                                    </div>

                                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-xs">
                                      <div>
                                        <dt className="text-gray-500">Study</dt>
                                        <dd className="font-semibold text-gray-900">{doc.study}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Country</dt>
                                        <dd className="font-semibold text-gray-900">{doc.country}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Site</dt>
                                        <dd className="font-semibold text-gray-900">{doc.site}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Document Type</dt>
                                        <dd className="font-semibold text-gray-900">{doc.docType}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Metadata Match</dt>
                                        <dd className="font-semibold text-gray-900">{doc.metadataMatch}%</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Status</dt>
                                        <dd className="font-semibold text-gray-900">{s.label}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Destination</dt>
                                        <dd className="font-semibold text-gray-900">{doc.destination}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-gray-500">Vault Subsite</dt>
                                        <dd className="font-semibold text-gray-900">{lastMappingFor(doc).subsite}</dd>
                                      </div>
                                    </dl>

                                    <div className="flex justify-end mt-4">
                                      <button
                                        onClick={() => setRetrievedDocId(null)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                      >
                                        Back to History
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-2xl border border-purple-200 p-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                      <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                          Last Mapped History — {doc.fileName}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          Most recent mapping recorded for {doc.study} / {doc.country}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => setRetrievedDocId(doc.id)}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                      >
                                        ⬇️ Retrieve
                                      </button>
                                    </div>

                                    {(() => {
                                      const entry = lastMappingFor(doc);
                                      return (
                                        <dl className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-2 text-xs">
                                          <div>
                                            <dt className="text-gray-500">Study</dt>
                                            <dd className="font-semibold text-gray-900">{entry.study}</dd>
                                          </div>
                                          <div>
                                            <dt className="text-gray-500">Country</dt>
                                            <dd className="font-semibold text-gray-900">{entry.country}</dd>
                                          </div>
                                          <div>
                                            <dt className="text-gray-500">Vault Site</dt>
                                            <dd className="font-semibold text-gray-900">{entry.site}</dd>
                                          </div>
                                          <div>
                                            <dt className="text-gray-500">Vault Subsite</dt>
                                            <dd className="font-semibold text-gray-900">{entry.subsite}</dd>
                                          </div>
                                          <div>
                                            <dt className="text-gray-500">Last Matched</dt>
                                            <dd className="font-semibold text-gray-900">
                                              {entry.matchedAt ? formatMatchedAt(entry.matchedAt) : "Not recorded"}
                                            </dd>
                                          </div>
                                        </dl>
                                      );
                                    })()}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Showing {filtered.length} of {mappings.length} documents
            </div>
          </>
        )}
      </div>
    </div>
  );
}
