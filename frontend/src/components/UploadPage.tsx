import { useEffect, useMemo, useState } from "react";
import type { ScheduledMigration } from "./AutomaticJobScheduler";

type DestinationTemplate = {
  study: string;
  country: string;
  site: string;
  subsite: string;
};

const destinationTemplates: DestinationTemplate[] = [
  { study: "STUDY-A", country: "US", site: "Site1", subsite: "Regulatory" },
  { study: "STUDY-B", country: "CA", site: "SiteA", subsite: "Clinical" },
  { study: "STUDY-C", country: "UK", site: "Site1", subsite: "Safety" },
  { study: "STUDY-D", country: "IN", site: "Site2", subsite: "Quality" },
];

const siteSubsiteCatalog: Record<string, string[]> = {
  Site1: ["Regulatory", "Safety", "Operations"],
  Site2: ["Quality", "Archive", "Contracts"],
  SiteA: ["Clinical", "Essential", "Submissions"],
};

type UploadPageProps = {
  onStartMigration: (migration: Omit<ScheduledMigration, "id">) => void;
};

export function UploadPage({ onStartMigration }: UploadPageProps) {
  const [source, setSource] = useState<"inbox" | "manual">("inbox");
  const [study, setStudy] = useState("");
  const [country, setCountry] = useState("");
  const [cro, setCro] = useState("");
  const [documentType, setDocumentType] = useState("Protocol");
  const [folderPath, setFolderPath] = useState("/inbox/STUDY-A/2026/");
  const [virusScan, setVirusScan] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [vaultSite, setVaultSite] = useState("");
  const [vaultSubsite, setVaultSubsite] = useState("");
  const [fileNamePattern, setFileNamePattern] = useState("{study}_{country}_{docType}_{yyyymmdd}");
  const [strictMetadataRouting, setStrictMetadataRouting] = useState(true);
  const [localBasePath, setLocalBasePath] = useState("/local_vtmf");
  const [unclassifiedBasePath, setUnclassifiedBasePath] = useState("/local_unclassified");

  const mappedDestination = useMemo(
    () => destinationTemplates.find((template) => template.study === study && template.country === country),
    [study, country]
  );

  const availableSites = useMemo(() => Object.keys(siteSubsiteCatalog), []);
  const availableSubsites = useMemo(() => siteSubsiteCatalog[vaultSite] ?? [], [vaultSite]);

  useEffect(() => {
    if (mappedDestination) {
      setVaultSite(mappedDestination.site);
      setVaultSubsite(mappedDestination.subsite);
      return;
    }

    setVaultSite("");
    setVaultSubsite("");
  }, [mappedDestination]);

  useEffect(() => {
    if (!vaultSite) {
      setVaultSubsite("");
      return;
    }

    const subsites = siteSubsiteCatalog[vaultSite] ?? [];
    if (!subsites.includes(vaultSubsite)) {
      setVaultSubsite(subsites[0] ?? "");
    }
  }, [vaultSite, vaultSubsite]);

  const placeholderDate = "20260902";
  const resolvedStudy = study || "UNKNOWN_STUDY";
  const resolvedCountry = country || "UNKNOWN_COUNTRY";
  const resolvedDocType = documentType || "UNKNOWN_DOC";
  const resolvedSite = vaultSite || "UNMAPPED_SITE";
  const resolvedSubsite = vaultSubsite || "UNMAPPED_SUBSITE";

  const resolvedFileName = fileNamePattern
    .replace("{study}", resolvedStudy)
    .replace("{country}", resolvedCountry)
    .replace("{docType}", resolvedDocType)
    .replace("{yyyymmdd}", placeholderDate);

  const veevaPathPreview = `${resolvedSite}/${resolvedSubsite}/${resolvedFileName}.pdf`;
  const localPathPreview = `${localBasePath}/${resolvedStudy}/${resolvedCountry}/${resolvedSite}/${resolvedSubsite}/${resolvedFileName}.pdf`;
  const unclassifiedPathPreview = `${unclassifiedBasePath}/${resolvedStudy}/${resolvedCountry}/${resolvedFileName}.pdf`;

  const metadataChecks = [
    { label: "Study", matched: Boolean(study), value: study || "Missing" },
    { label: "Country", matched: Boolean(country), value: country || "Missing" },
    { label: "Site", matched: Boolean(vaultSite), value: vaultSite || "Missing" },
    { label: "Subsite", matched: Boolean(vaultSubsite), value: vaultSubsite || "Missing" },
    { label: "Document Type", matched: Boolean(documentType), value: documentType || "Missing" },
  ];

  const matchedCount = metadataChecks.filter((check) => check.matched).length;
  const metadataReady = matchedCount === metadataChecks.length;
  const routingToPrimary = metadataReady || !strictMetadataRouting;

  const startMigration = () => {
    const sourceFolder = source === "inbox" ? folderPath : "Manual Upload";
    const destinationFolder = routingToPrimary
      ? `${resolvedSite} / ${resolvedSubsite}`
      : "Unclassified";

    onStartMigration({
      study: study || "Unmapped Study",
      masterFolder: `${sourceFolder} to ${destinationFolder}`,
    });
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">📤 Trigger New Migration</h2>
        <p className="text-gray-500 text-sm mb-6 text-center">Configure and start a new document migration job</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-2xl space-y-6">
        {/* Source selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="radio"
                name="source"
                checked={source === "inbox"}
                onChange={() => setSource("inbox")}
                className="w-4 h-4 text-blue-600"
              />
              Inbox (FTP)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="radio"
                name="source"
                checked={source === "manual"}
                onChange={() => setSource("manual")}
                className="w-4 h-4 text-blue-600"
              />
              Manual Upload
            </label>
          </div>
        </div>

        {/* Study / Country / CRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Study Name</label>
            <select
              value={study}
              onChange={(e) => setStudy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Study</option>
              <option value="STUDY-A">STUDY-A</option>
              <option value="STUDY-B">STUDY-B</option>
              <option value="STUDY-C">STUDY-C</option>
              <option value="STUDY-D">STUDY-D</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Country</option>
              <option value="US">US</option>
              <option value="CA">CA</option>
              <option value="UK">UK</option>
              <option value="IN">IN</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">CRO Team</label>
          <select
            value={cro}
            onChange={(e) => setCro(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select CRO</option>
            <option value="IQVIA">IQVIA</option>
            <option value="Covance">Covance</option>
            <option value="PPD">PPD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Protocol">Protocol</option>
            <option value="InformedConsent">InformedConsent</option>
            <option value="LabReport">LabReport</option>
            <option value="SafetyReport">SafetyReport</option>
            <option value="InvestigatorBrochure">InvestigatorBrochure</option>
          </select>
        </div>

        {/* Inbox Path */}
        {source === "inbox" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">
              Inbox Path
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Folder Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button aria-label="Browse inbox folder" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                  🔍 Browse Inbox
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Upload */}
        {source === "manual" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">
              Upload Files
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center" role="region" aria-label="File upload drop zone">
              <p className="text-gray-500 text-sm mb-2">Drag & drop ZIP file here</p>
              <p className="text-gray-400 text-xs mb-3">or</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                Browse Files
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Metadata Sheet</label>
          <div className="flex items-center gap-3">
            <button aria-label="Browse metadata file" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              Browse
            </button>
            <span className="text-sm text-gray-500">metadata.xlsx</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">
            Destination Configuration
          </p>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">Primary Destination (VeevaVault-style)</p>
            <p className="text-xs text-blue-800">
              Documents are classified with metadata and mapped to simulated VeevaVault path: <strong>site -&gt; subsite -&gt; file</strong>
            </p>
            <p className="text-xs text-blue-700">
              Runtime mode: VeevaVault is unavailable, so files are written to the local mirror path after migration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Vault Site</label>
              <select
                value={vaultSite}
                onChange={(e) => setVaultSite(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Site</option>
                {availableSites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Vault Subsite</label>
              <select
                value={vaultSubsite}
                onChange={(e) => setVaultSubsite(e.target.value)}
                disabled={!vaultSite}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select Subsite</option>
                {availableSubsites.map((subsite) => (
                  <option key={subsite} value={subsite}>
                    {subsite}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">File Name Pattern</label>
            <input
              type="text"
              value={fileNamePattern}
              onChange={(e) => setFileNamePattern(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Supported placeholders: {"{study}"}, {"{country}"}, {"{docType}"}, {"{yyyymmdd}"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Local VTMF Base Path</label>
              <input
                type="text"
                value={localBasePath}
                onChange={(e) => setLocalBasePath(e.target.value)}
                className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Unclassified Base Path</label>
              <input
                type="text"
                value={unclassifiedBasePath}
                onChange={(e) => setUnclassifiedBasePath(e.target.value)}
                className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={strictMetadataRouting}
              onChange={(e) => setStrictMetadataRouting(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            Strict metadata routing (if metadata is incomplete, route to unclassified)
          </label>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Metadata Match</p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${metadataReady ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
              >
                {matchedCount}/{metadataChecks.length} fields matched
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metadataChecks.map((check) => (
                <div key={check.label} className="text-xs text-gray-700 flex items-center justify-between bg-white border border-gray-200 rounded-md px-2 py-1.5">
                  <span>{check.label}</span>
                  <span className={check.matched ? "text-green-700" : "text-red-600"}>{check.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-gray-600">Veeva path preview (site/subsite/file)</p>
              <p className="max-w-full overflow-x-auto whitespace-nowrap text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1.5">{veevaPathPreview}</p>
              <p className="text-xs text-gray-600">Local write target (primary mirror)</p>
              <p className="max-w-full overflow-x-auto whitespace-nowrap text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1.5">{localPathPreview}</p>
              <p className="text-xs text-gray-600">Fallback target (unclassified)</p>
              <p className="max-w-full overflow-x-auto whitespace-nowrap text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1.5">{unclassifiedPathPreview}</p>
            </div>
            <p className={`text-xs font-semibold ${routingToPrimary ? "text-green-700" : "text-amber-700"}`}>
              Routing decision: {routingToPrimary ? "Metadata matched, route to local mirror destination" : "Metadata incomplete, route to unclassified destination"}
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={virusScan}
              onChange={(e) => setVirusScan(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            Run virus scan before processing
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            Send notification email on completion
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            Preview Files
          </button>
          <button
            type="button"
            onClick={startMigration}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            ▶ Start Migration
          </button>
        </div>
      </div>
    </div>
  );
}
