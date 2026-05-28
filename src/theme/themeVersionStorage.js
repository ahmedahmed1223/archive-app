export const THEME_VERSION_STORAGE_KEY = "videoArchive:themeVersion";
export const DEFAULT_THEME_VERSION = "v1";

const VALID_VERSIONS = new Set(["v1", "v2"]);

export function normalizeThemeVersion(value) {
  if (typeof value !== "string") return DEFAULT_THEME_VERSION;
  return VALID_VERSIONS.has(value) ? value : DEFAULT_THEME_VERSION;
}

export function getStoredThemeVersion() {
  try {
    const raw = localStorage.getItem(THEME_VERSION_STORAGE_KEY);
    return normalizeThemeVersion(raw);
  } catch {
    return DEFAULT_THEME_VERSION;
  }
}

export function storeThemeVersion(value) {
  const normalized = normalizeThemeVersion(value);
  if (normalized !== value) return false;
  try {
    localStorage.setItem(THEME_VERSION_STORAGE_KEY, normalized);
    return true;
  } catch {
    return false;
  }
}
