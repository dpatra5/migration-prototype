import { Fragment, useState } from "react";

interface UnclassifiedDoc {
  id: string;
  fileName: string;
  study: string;
  country: string;
  site: string;
  uploadedBy: string;
  uploadDate: string;
  reason: string;
  retrying: boolean;
  docType: string;
  metadataMatch: number;
  fileSize: string;
  detectedFormat: string;
  sourcePath: string;
  suggestedDestination: string;
}

const mockUnclassified: UnclassifiedDoc[] = [
  { id: "U-001", fileName: "amendment_2.docx",    study: "STUDY-B", country: "UK", site: "Site1", uploadedBy: "Ravi",   uploadDate: "17-Aug", reason: "Low metadata match (45%)",          retrying: false, docType: "Regulatory", metadataMatch: 45, fileSize: "1.2 MB", detectedFormat: "DOCX", sourcePath: "/inbox/STUDY-B/2026/amendment_2.docx",    suggestedDestination: "VTMF / STUDY-B / UK / Site1 / Regulatory" },
  { id: "U-002", fileName: "unknown_scan.pdf",    study: "STUDY-B", country: "UK", site: "Site1", uploadedBy: "Ravi",   uploadDate: "17-Aug", reason: "No matching document type found",    retrying: false, docType: "—",         metadataMatch: 12, fileSize: "3.8 MB", detectedFormat: "PDF",  sourcePath: "/inbox/STUDY-B/2026/unknown_scan.pdf",    suggestedDestination: "Requires manual document type" },
  { id: "U-003", fileName: "randomization.pdf",   study: "STUDY-C", country: "US", site: "Site2", uploadedBy: "Rakesh", uploadDate: "18-Aug", reason: "Low metadata match (30%)",          retrying: false, docType: "—",         metadataMatch: 30, fileSize: "845 KB", detectedFormat: "PDF",  sourcePath: "/inbox/STUDY-C/2026/randomization.pdf",   suggestedDestination: "VTMF / STUDY-C / US / Site2 / Safety" },
  { id: "U-004", fileName: "consent_form.pdf",    study: "STUDY-D", country: "CA", site: "SiteA", uploadedBy: "Sahil",  uploadDate: "18-Aug", reason: "Classification engine timeout",      retrying: false, docType: "Informed Consent", metadataMatch: 62, fileSize: "2.1 MB", detectedFormat: "PDF", sourcePath: "/inbox/STUDY-D/2026/consent_form.pdf",    suggestedDestination: "VTMF / STUDY-D / CA / SiteA / Clinical" },
  { id: "U-005", fileName: "lab_results_017.xlsx", study: "STUDY-D", country: "CA", site: "SiteA", uploadedBy: "Sahil", uploadDate: "18-Aug", reason: "Classification engine timeout",      retrying: false, docType: "Lab Report", metadataMatch: 58, fileSize: "540 KB", detectedFormat: "XLSX", sourcePath: "/inbox/STUDY-D/2026/lab_results_017.xlsx", suggestedDestination: "VTMF / STUDY-D / CA / SiteA / Clinical" },
  { id: "U-006", fileName: "amendment_3.docx",    study: "STUDY-D", country: "CA", site: "SiteA", uploadedBy: "Sahil",  uploadDate: "18-Aug", reason: "Classification engine timeout",      retrying: false, docType: "Regulatory", metadataMatch: 51, fileSize: "1.6 MB", detectedFormat: "DOCX", sourcePath: "/inbox/STUDY-D/2026/amendment_3.docx",    suggestedDestination: "VTMF / STUDY-D / CA / SiteA / Regulatory" },
];

type UnclassifiedDocsPageProps = {
  onUpdateMetadata: (fileName: string) => void;
};

export function UnclassifiedDocsPage({ onUpdateMetadata }: UnclassifiedDocsPageProps) {
  const [docs, setDocs] = useState(mockUnclassified);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === docs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(docs.map((d) => d.id)));
    }
  };

  const retrySelected = () => {
    setDocs((prev) =>
      prev.map((d) => (selected.has(d.id) ? { ...d, retrying: true } : d))
    );
    setTimeout(() => {
      setDocs((prev) => prev.map((d) => (selected.has(d.id) ? { ...d, retrying: false } : d)));
      setSelected(new Set());
    }, 2000);
  };

  const toggleMetadata = (id: string) => {
    setExpandedDoc((current) => (current === id ? null : id));
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">📄 Unclassified Documents</h2>
        <p className="text-gray-500 text-sm mb-5 text-center">
          Documents that failed auto-mapping. Reclassify individually or trigger an adhoc batch job.
        </p>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{docs.length}</span> unclassified documents
            {selected.size > 0 && <span className="ml-2 text-purple-600 font-medium">({selected.size} selected)</span>}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={retrySelected}
              disabled={selected.size === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selected.size > 0
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              🔄 Retry Selected ({selected.size})
            </button>
            <button
              onClick={() => { setSelected(new Set(docs.map((d) => d.id))); }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              ⚡ Adhoc Job — Retry All
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all documents"
                      checked={selected.size === docs.length && docs.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Study</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Failure Reason</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => {
                  const isExpanded = expandedDoc === doc.id;
                  return (
                    <Fragment key={doc.id}>
                      <tr className="text-center hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${doc.fileName}`}
                            checked={selected.has(doc.id)}
                            onChange={() => toggleSelect(doc.id)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                        </td>
                        <td className="px-4 py-3 text-left font-medium text-gray-900">{doc.fileName}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.study}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.country}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.site}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.uploadedBy}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.uploadDate}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                            {doc.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleMetadata(doc.id)}
                            aria-expanded={isExpanded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isExpanded
                                ? "bg-blue-100 text-blue-700"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            🔄 Reclassification
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50/40">
                          <td colSpan={9} className="px-6 py-4 text-left">
                            <div className="flex items-start justify-between gap-6 flex-wrap">
                              <div className="flex-1 min-w-[18rem]">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                                  Document Metadata
                                </p>
                                <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                                  <div>
                                    <dt className="text-gray-500">Document ID</dt>
                                    <dd className="font-semibold text-gray-900">{doc.id}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">File Name</dt>
                                    <dd className="font-semibold text-gray-900">{doc.fileName}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">Detected Format</dt>
                                    <dd className="font-semibold text-gray-900">{doc.detectedFormat}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">File Size</dt>
                                    <dd className="font-semibold text-gray-900">{doc.fileSize}</dd>
                                  </div>
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
                                  <div className="col-span-2 md:col-span-3">
                                    <dt className="text-gray-500">Source Path</dt>
                                    <dd className="font-mono text-[11px] text-gray-900">{doc.sourcePath}</dd>
                                  </div>
                                  <div className="col-span-2 md:col-span-3">
                                    <dt className="text-gray-500">Suggested Destination</dt>
                                    <dd className="font-mono text-[11px] text-gray-900">{doc.suggestedDestination}</dd>
                                  </div>
                                  <div className="col-span-2 md:col-span-3">
                                    <dt className="text-gray-500">Failure Reason</dt>
                                    <dd className="font-semibold text-rose-700">{doc.reason}</dd>
                                  </div>
                                </dl>
                              </div>
                              <button
                                onClick={() => onUpdateMetadata(doc.fileName)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors self-start"
                              >
                                ✏️ Metadata Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Documents that pass reclassification will be moved to VTMF automatically
        </div>
      </div>
    </div>
  );
}
