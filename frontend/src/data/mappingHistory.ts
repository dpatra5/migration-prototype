export interface MappingHistoryEntry {
  study: string;
  country: string;
  site: string;
  subsite: string;
  docType: string;
  matchedAt: string;
}

const STORAGE_KEY = "migration-utility.mapping-history.v1";

function readAll(): MappingHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MappingHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: MappingHistoryEntry[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures (e.g. quota exceeded, private browsing).
  }
}

/** Returns all recorded mappings, most recently matched first. */
export function getMappingHistory(): MappingHistoryEntry[] {
  return readAll().sort((a, b) => (a.matchedAt < b.matchedAt ? 1 : -1));
}

/** Finds the most recent mapping previously matched for a study + country pair. */
export function findMappingForStudy(
  study: string,
  country: string,
): MappingHistoryEntry | undefined {
  if (!study || !country) return undefined;

  return readAll()
    .filter((entry) => entry.study === study && entry.country === country)
    .sort((a, b) => (a.matchedAt < b.matchedAt ? 1 : -1))[0];
}

/**
 * Records (or updates) the mapping used for a study + country pair so future
 * migrations for the same study/country can be auto-mapped without reselecting.
 */
export function recordMapping(
  entry: Omit<MappingHistoryEntry, "matchedAt">,
): void {
  if (!entry.study || !entry.country || !entry.site || !entry.subsite) return;

  const entries = readAll().filter(
    (existing) =>
      !(existing.study === entry.study && existing.country === entry.country),
  );

  entries.push({ ...entry, matchedAt: new Date().toISOString() });
  writeAll(entries);
}
