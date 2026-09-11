import { useEffect, useMemo, useRef, useState } from "react";
import type { ScheduledMigration } from "./MigrationProgressPanel";
import { findMappingForStudy, recordMapping } from "../data/mappingHistory";

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

const studyOptions = ["STUDY-A", "STUDY-B", "STUDY-C", "STUDY-D"];

const siteSubsiteCatalog: Record<string, string[]> = {
  Site1: ["Regulatory", "Safety", "Operations"],
  Site2: ["Quality", "Archive", "Contracts"],
  SiteA: ["Clinical", "Essential", "Submissions"],
};

type UploadPageProps = {
  onStartMigration: (
    migration: Omit<ScheduledMigration, "id" | "startedAt">,
  ) => void;
  prefill?: {
    study: string;
    country: string;
    site: string;
    subsite: string;
    docType: string;
  } | null;
};

export function UploadPage({ onStartMigration, prefill }: UploadPageProps) {
  const [source, setSource] = useState<"inbox" | "manual">("inbox");
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [studyDropdownOpen, setStudyDropdownOpen] = useState(false);
  const studyDropdownRef = useRef<HTMLDivElement | null>(null);
  const [country, setCountry] = useState("");
  const [cro, setCro] = useState("");
  const [documentType, setDocumentType] = useState("Protocol");
  const [folderPath, setFolderPath] = useState("/inbox/STUDY-A/2026/");
  const [virusScan, setVirusScan] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [vaultSite, setVaultSite] = useState("");
  const [vaultSubsite, setVaultSubsite] = useState("");
  const [fileNamePattern, setFileNamePattern] = useState(
    "{study}_{country}_{docType}_{yyyymmdd}",
  );
  const [strictMetadataRouting, setStrictMetadataRouting] = useState(true);
  const [localBasePath, setLocalBasePath] = useState("/local_vtmf");
  const [unclassifiedBasePath, setUnclassifiedBasePath] = useState(
    "/local_unclassified",
  );

  const toggleStudy = (option: string) => {
    setSelectedStudies((current) =>
      current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option],
    );
  };

  useEffect(() => {
    if (!studyDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        studyDropdownRef.current &&
        !studyDropdownRef.current.contains(event.target as Node)
      ) {
        setStudyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [studyDropdownOpen]);

  const primaryStudy = selectedStudies[0] ?? "";

  const mappedDestination = useMemo(
    () =>
      destinationTemplates.find(
        (template) =>
          template.study === primaryStudy && template.country === country,
      ),
    [primaryStudy, country],
  );

  const availableSites = useMemo(() => Object.keys(siteSubsiteCatalog), []);
  const availableSubsites = useMemo(
    () => siteSubsiteCatalog[vaultSite] ?? [],
    [vaultSite],
  );

  const historyMapping = useMemo(
    () =>
      mappedDestination
        ? undefined
        : findMappingForStudy(primaryStudy, country),
    [mappedDestination, primaryStudy, country],
  );

  const appliedPrefillRef = useRef<typeof prefill>(null);

  useEffect(() => {
    if (!prefill || appliedPrefillRef.current === prefill) return;

    appliedPrefillRef.current = prefill;
    setSelectedStudies(prefill.study ? [prefill.study] : []);
    setCountry(prefill.country);
    if (prefill.docType && prefill.docType !== "—") {
      setDocumentType(prefill.docType);
    }
    setVaultSite(prefill.site);
    setVaultSubsite(prefill.subsite);
  }, [prefill]);

  useEffect(() => {
    // Remap prefill supplies its own destination, so skip auto-mapping for it.
    if (appliedPrefillRef.current) return;

    if (mappedDestination) {
      setVaultSite(mappedDestination.site);
      setVaultSubsite(mappedDestination.subsite);
      return;
    }

    // No built-in template match — check if this study/country pair was
    // manually mapped in a previous migration and auto-select it so the
    // user doesn't have to pick the site/subsite again.
    const previousMapping = findMappingForStudy(primaryStudy, country);
    if (previousMapping) {
      setVaultSite(previousMapping.site);
      setVaultSubsite(previousMapping.subsite);
      return;
    }

    setVaultSite("");
    setVaultSubsite("");
  }, [mappedDestination, primaryStudy, country]);

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
  const resolvedStudy = primaryStudy || "UNKNOWN_STUDY";
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
    {
      label: "Study",
      matched: selectedStudies.length > 0,
      value:
        selectedStudies.length > 0 ? selectedStudies.join(", ") : "Missing",
    },
    {
      label: "Country",
      matched: Boolean(country),
      value: country || "Missing",
    },
    {
      label: "Site",
      matched: Boolean(vaultSite),
      value: vaultSite || "Missing",
    },
    {
      label: "Subsite",
      matched: Boolean(vaultSubsite),
      value: vaultSubsite || "Missing",
    },
    {
      label: "Document Type",
      matched: Boolean(documentType),
      value: documentType || "Missing",
    },
  ];

  const matchedCount = metadataChecks.filter((check) => check.matched).length;
  const metadataReady = matchedCount === metadataChecks.length;
  const routingToPrimary = metadataReady || !strictMetadataRouting;

  const routingTargetLabel = routingToPrimary
    ? `${resolvedSite} / ${resolvedSubsite}`
    : "Unclassified";

  const matchPairs = [
    {
      label: "Study → Vault Site",
      source: {
        label: "Study",
        value:
          selectedStudies.length > 0 ? selectedStudies.join(", ") : "Missing",
      },
      destination: { label: "Vault Site", value: vaultSite || "Missing" },
      matched: selectedStudies.length > 0 && Boolean(vaultSite),
    },
    {
      label: "Country → Vault Subsite",
      source: { label: "Country", value: country || "Missing" },
      destination: {
        label: "Vault Subsite",
        value: vaultSubsite || "Missing",
      },
      matched: Boolean(country) && Boolean(vaultSubsite),
    },
    {
      label: "CRO Team → Local Base Path",
      source: { label: "CRO Team", value: cro || "Missing" },
      destination: {
        label: "Local VTMF Base",
        value: localBasePath || "Missing",
      },
      matched: Boolean(cro) && Boolean(localBasePath),
    },
    {
      label: "Document Type → Routing Target",
      source: { label: "Document Type", value: documentType || "Missing" },
      destination: { label: "Routing Target", value: routingTargetLabel },
      matched: Boolean(documentType) && routingToPrimary,
    },
  ];

  const matchedPairCount = matchPairs.filter((pair) => pair.matched).length;

  const startMigration = () => {
    const sourceFolder = source === "inbox" ? folderPath : "Manual Upload";
    const studiesToRun =
      selectedStudies.length > 0 ? selectedStudies : ["Unmapped Study"];

    studiesToRun.forEach((studyName) => {
      const studyDestination = destinationTemplates.find(
        (template) =>
          template.study === studyName && template.country === country,
      );
      const siteForStudy = studyDestination?.site ?? vaultSite;
      const subsiteForStudy = studyDestination?.subsite ?? vaultSubsite;
      const studyMetadataReady = Boolean(
        studyName !== "Unmapped Study" &&
        country &&
        siteForStudy &&
        subsiteForStudy &&
        documentType,
      );
      const routeToPrimaryForStudy =
        studyMetadataReady || !strictMetadataRouting;
      const destinationFolder = routeToPrimaryForStudy
        ? `${siteForStudy || "UNMAPPED_SITE"} / ${subsiteForStudy || "UNMAPPED_SUBSITE"}`
        : "Unclassified";

      if (studyMetadataReady && siteForStudy && subsiteForStudy) {
        recordMapping({
          study: studyName,
          country,
          site: siteForStudy,
          subsite: subsiteForStudy,
          docType: documentType,
        });
      }

      onStartMigration({
        study: studyName,
        masterFolder: `${sourceFolder} to ${destinationFolder}`,
      });
    });
  };

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">
          📤 Trigger New Migration
        </h2>
        <p className="text-gray-500 text-sm mb-6 text-center">
          Configure and start a new document migration job
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-2xl space-y-6">
        {/* Source selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Source
          </label>
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
          <div ref={studyDropdownRef} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Study Name
            </label>
            <button
              type="button"
              onClick={() => setStudyDropdownOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={studyDropdownOpen}
              className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="truncate text-left">
                {selectedStudies.length > 0
                  ? selectedStudies.join(", ")
                  : "Select Study"}
              </span>
              <span className="text-gray-400 ml-2">▾</span>
            </button>
            {studyDropdownOpen && (
              <div
                role="listbox"
                aria-multiselectable="true"
                className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto"
              >
                {studyOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudies.includes(option)}
                      onChange={() => toggleStudy(option)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
            {selectedStudies.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                Each selected study will run as a separate migration job.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Country
            </label>
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            CRO Team
          </label>
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Document Type
          </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Folder Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  aria-label="Browse inbox folder"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
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
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center"
              role="region"
              aria-label="File upload drop zone"
            >
              <p className="text-gray-500 text-sm mb-2">
                Drag & drop ZIP file here
              </p>
              <p className="text-gray-400 text-xs mb-3">or</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                Browse Files
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Metadata Sheet
          </label>
          <div className="flex items-center gap-3">
            <button
              aria-label="Browse metadata file"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
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
            <p className="text-sm font-semibold text-blue-900">
              Primary Destination (VeevaVault-style)
            </p>
            <p className="text-xs text-blue-800">
              Documents are classified with metadata and mapped to simulated
              VeevaVault path: <strong>site -&gt; subsite -&gt; file</strong>
            </p>
            <p className="text-xs text-blue-700">
              Runtime mode: VeevaVault is unavailable, so files are written to
              the local mirror path after migration.
            </p>
          </div>

          {historyMapping && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <p className="text-xs text-emerald-800">
                Auto-mapped from a previous migration:{" "}
                <strong>{historyMapping.study}</strong> /{" "}
                {historyMapping.country} was matched to{" "}
                <strong>
                  {historyMapping.site} / {historyMapping.subsite}
                </strong>{" "}
                before, so you don't need to select it again. Go to{" "}
                <strong>Mapping → History</strong> to review or clear saved
                mappings.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vault Site
              </label>
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
            {/* <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vault Subsite
              </label>
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
            </div> */}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              File Name Pattern
            </label>
            <input
              type="text"
              value={fileNamePattern}
              onChange={(e) => setFileNamePattern(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported placeholders: {"{study}"}, {"{country}"}, {"{docType}"},{" "}
              {"{yyyymmdd}"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Local VTMF Base Path
              </label>
              <input
                type="text"
                value={localBasePath}
                onChange={(e) => setLocalBasePath(e.target.value)}
                className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Unclassified Base Path
              </label>
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
            Strict metadata routing (if metadata is incomplete, route to
            unclassified)
          </label>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Metadata Match
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${metadataReady ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
              >
                {matchedCount}/{metadataChecks.length} fields matched
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_2.5rem_1fr] gap-2 items-stretch">
              <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Source Selection
              </p>
              <span className="hidden sm:block" />
              <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-right">
                Destination Mapping
              </p>

              {matchPairs.map((pair) => (
                <div key={pair.label} className="contents">
                  <div className="text-xs text-gray-700 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-500">
                      {pair.source.label}
                    </span>
                    <span
                      className={
                        pair.matched ? "text-green-700" : "text-red-600"
                      }
                    >
                      {pair.source.value}
                    </span>
                  </div>

                  <div className="flex sm:flex-col items-center justify-center gap-1 py-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pair.matched ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-600"}`}
                      aria-label={pair.matched ? "Matched" : "Not matched"}
                    >
                      {pair.matched ? "✓" : "!"}
                    </span>
                    <span className="hidden sm:block text-gray-300 text-xs">
                      ↔
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-500">
                      {pair.destination.label}
                    </span>
                    <span
                      className={
                        pair.matched ? "text-green-700" : "text-red-600"
                      }
                    >
                      {pair.destination.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              {matchedPairCount}/{matchPairs.length} source-to-destination pairs
              matched
            </p>

            <div className="space-y-1 min-w-0">
              <p className="text-xs text-gray-600">
                Veeva path preview (site/subsite/file)
              </p>
              <p className="max-w-full overflow-x-auto whitespace-nowrap text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1.5">
                {veevaPathPreview}
              </p>
              <p className="text-xs text-gray-600">
                Local write target (primary mirror)
              </p>
              <p className="max-w-full overflow-x-auto whitespace-nowrap text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1.5">
                {localPathPreview}
              </p>
              <p className="text-xs text-gray-600">
                Fallback target (unclassified)
              </p>
              <p className="max-w-full overflow-x-auto whitespace-nowrap text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1.5">
                {unclassifiedPathPreview}
              </p>
            </div>
            <p
              className={`text-xs font-semibold ${routingToPrimary ? "text-green-700" : "text-amber-700"}`}
            >
              Routing decision:{" "}
              {routingToPrimary
                ? "Metadata matched, route to local mirror destination"
                : "Metadata incomplete, route to unclassified destination"}
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
            {selectedStudies.length > 1
              ? ` (${selectedStudies.length} jobs)`
              : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
