import { normalizeArabicSearchText } from "../../utils/formatting.js";

export const VOCABULARY_CATEGORIES = [
  { id: "country", label: "بلد", color: "#3b82f6" },
  { id: "city", label: "مدينة", color: "#10b981" },
  { id: "person", label: "شخص", color: "#8b5cf6" },
  { id: "place", label: "مكان", color: "#f59e0b" },
  { id: "organization", label: "منظمة", color: "#ef4444" },
  { id: "other", label: "أخرى", color: "#6b7280" }
];

const VOCABULARY_CATEGORY_IDS = new Set(VOCABULARY_CATEGORIES.map((category) => category.id));
const VOCABULARY_PAGE_SIZES = new Set([24, 48, 96]);

export function normalizeVocabularyCategory(category = "all") {
  return VOCABULARY_CATEGORY_IDS.has(category) ? category : "all";
}

export function normalizeVocabularyPageSize(pageSize = 48) {
  const value = Number(pageSize);
  return VOCABULARY_PAGE_SIZES.has(value) ? value : 48;
}

export function normalizeVocabularyPage(page = 1) {
  const value = Number(page);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export function parseVocabularyAliases(value = "") {
  if (Array.isArray(value)) return value.map((alias) => String(alias).trim()).filter(Boolean);
  return String(value).split(/[,،]/).map((alias) => alias.trim()).filter(Boolean);
}

export function createVocabularyEntryValue(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: partial.id || `vocab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    term: String(partial.term || "").trim(),
    category: VOCABULARY_CATEGORY_IDS.has(partial.category) ? partial.category : "other",
    description: String(partial.description || "").trim() || undefined,
    aliases: parseVocabularyAliases(partial.aliases),
    parentId: partial.parentId,
    createdAt: partial.createdAt || now,
    updatedAt: now
  };
}

export function createVocabularyRouteParams({
  query = "",
  category = "all",
  page = 1,
  pageSize = 48
} = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  const normalizedCategory = normalizeVocabularyCategory(category);
  if (normalizedCategory !== "all") params.set("category", normalizedCategory);
  const normalizedPage = normalizeVocabularyPage(page);
  if (normalizedPage > 1) params.set("page", String(normalizedPage));
  const normalizedPageSize = normalizeVocabularyPageSize(pageSize);
  if (normalizedPageSize !== 48) params.set("per", String(normalizedPageSize));
  return params;
}

export function parseVocabularyRouteParams(params = new URLSearchParams()) {
  return {
    query: params.get("q") || "",
    category: normalizeVocabularyCategory(params.get("category") || "all"),
    page: normalizeVocabularyPage(params.get("page") || 1),
    pageSize: normalizeVocabularyPageSize(params.get("per") || 48)
  };
}

export function getVocabularyCategoryCounts(vocabulary = []) {
  const counts = { all: vocabulary.length };
  VOCABULARY_CATEGORIES.forEach((category) => {
    counts[category.id] = vocabulary.filter((entry) => entry.category === category.id).length;
  });
  return counts;
}

export function getFilteredVocabularyEntries({
  vocabulary = [],
  query = "",
  category = "all"
} = {}) {
  const normalizedCategory = normalizeVocabularyCategory(category);
  const normalizedQuery = normalizeArabicSearchText(query);
  return [...vocabulary]
    .filter((entry) => normalizedCategory === "all" || entry.category === normalizedCategory)
    .filter((entry) => {
      if (!normalizedQuery) return true;
      return [
        entry.term,
        entry.description,
        ...(Array.isArray(entry.aliases) ? entry.aliases : [])
      ].some((value) => normalizeArabicSearchText(value).includes(normalizedQuery));
    })
    .sort((a, b) => String(a.term || "").localeCompare(String(b.term || ""), "ar"));
}
