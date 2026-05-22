import { normalizeArabicSearchText } from "../../utils/formatting.js";

const ARCHIVE_SORT_FIELDS = new Set(["title", "createdAt", "updatedAt"]);
const ARCHIVE_VIEW_MODES = new Set(["grid", "list", "table"]);
const ARCHIVE_ITEM_SIZES = new Set(["compact", "comfortable", "large"]);
const ARCHIVE_PAGE_SIZES = new Set([12, 24, 48, 96]);

export function normalizeArchiveViewMode(viewMode = "grid") {
  return ARCHIVE_VIEW_MODES.has(viewMode) ? viewMode : "grid";
}

export function normalizeArchiveItemSize(itemSize = "comfortable") {
  return ARCHIVE_ITEM_SIZES.has(itemSize) ? itemSize : "comfortable";
}

export function normalizeArchivePageSize(pageSize = 24) {
  const value = Number(pageSize);
  return ARCHIVE_PAGE_SIZES.has(value) ? value : 24;
}

export function normalizeArchivePage(page = 1) {
  const value = Number(page);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export function getFilteredArchiveItems({
  videoItems = [],
  filterType = "all",
  filterSubtype = "all",
  searchQuery = "",
  sortField = "updatedAt",
  sortDirection = "desc",
  showDeleted = false,
  showFavoritesOnly = false
} = {}) {
  const normalizedSortField = ARCHIVE_SORT_FIELDS.has(sortField) ? sortField : "updatedAt";
  const query = normalizeArabicSearchText(searchQuery.trim());

  const items = videoItems.filter((item) => {
    if (showDeleted ? !item.isDeleted : item.isDeleted) return false;
    if (filterType && filterType !== "all" && item.type !== filterType) return false;
    if (filterSubtype && filterSubtype !== "all" && item.subtype !== filterSubtype) return false;
    if (showFavoritesOnly && !item.isFavorite) return false;
    if (!query) return true;

    return normalizeArabicSearchText(item.title).includes(query)
      || (item.tags || []).some((tag) => normalizeArabicSearchText(tag).includes(query))
      || Boolean(item.notes && normalizeArabicSearchText(item.notes).includes(query));
  });

  return items.sort((a, b) => {
    let comparison = 0;
    if (normalizedSortField === "title") comparison = String(a.title || "").localeCompare(String(b.title || ""), "ar");
    if (normalizedSortField === "createdAt") comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (normalizedSortField === "updatedAt") comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
    return sortDirection === "desc" ? -comparison : comparison;
  });
}

export function getArchiveActiveFilterCount({
  searchQuery = "",
  filterType = "all",
  filterSubtype = "all",
  showFavoritesOnly = false,
  showDeleted = false
} = {}) {
  return [
    searchQuery.trim(),
    filterType && filterType !== "all",
    filterSubtype && filterSubtype !== "all",
    showFavoritesOnly,
    showDeleted
  ].filter(Boolean).length;
}

export function hasArchiveContentFilters(filters = {}) {
  return Boolean(
    filters.searchQuery?.trim()
    || filters.filterType && filters.filterType !== "all"
    || filters.filterSubtype && filters.filterSubtype !== "all"
    || filters.showFavoritesOnly
  );
}

export function getArchiveResultRangeText({ total = 0, page = 1, itemsPerPage = 24 } = {}) {
  if (total === 0) return "لا توجد نتائج";
  const start = Math.min((page - 1) * itemsPerPage + 1, total);
  const end = Math.min(page * itemsPerPage, total);
  return `عرض ${start}-${end} من ${total}`;
}

export function createArchiveRouteParams({
  searchQuery = "",
  filterType = "all",
  filterSubtype = "all",
  showDeleted = false,
  showFavoritesOnly = false,
  sortField = "updatedAt",
  sortDirection = "desc",
  viewMode = "grid",
  openImport = false,
  page = 1,
  pageSize = 24,
  itemSize = "comfortable"
} = {}) {
  const params = new URLSearchParams();
  if (searchQuery.trim()) params.set("q", searchQuery.trim());
  if (filterType && filterType !== "all") params.set("type", filterType);
  if (filterSubtype && filterSubtype !== "all") params.set("subtype", filterSubtype);
  if (showDeleted) params.set("deleted", "1");
  if (showFavoritesOnly) params.set("favorites", "1");
  if (sortField !== "updatedAt") params.set("sort", sortField);
  if (sortDirection !== "desc") params.set("dir", sortDirection);
  const normalizedViewMode = normalizeArchiveViewMode(viewMode);
  if (normalizedViewMode !== "grid") params.set("view", normalizedViewMode);
  const normalizedPage = normalizeArchivePage(page);
  if (normalizedPage > 1) params.set("page", String(normalizedPage));
  const normalizedPageSize = normalizeArchivePageSize(pageSize);
  if (normalizedPageSize !== 24) params.set("per", String(normalizedPageSize));
  const normalizedItemSize = normalizeArchiveItemSize(itemSize);
  if (normalizedItemSize !== "comfortable") params.set("size", normalizedItemSize);
  if (openImport) params.set("import", "1");
  return params;
}

export function parseArchiveRouteParams(params = new URLSearchParams()) {
  const sortField = params.get("sort") || "updatedAt";
  return {
    searchQuery: params.get("q") || "",
    filterType: params.get("type") || "all",
    filterSubtype: params.get("subtype") || "all",
    showDeleted: params.get("deleted") === "1",
    showFavoritesOnly: params.get("favorites") === "1",
    sortField: ARCHIVE_SORT_FIELDS.has(sortField) ? sortField : "updatedAt",
    sortDirection: params.get("dir") === "asc" ? "asc" : "desc",
    viewMode: normalizeArchiveViewMode(params.get("view") || "grid"),
    openImport: params.get("import") === "1",
    page: normalizeArchivePage(params.get("page") || 1),
    pageSize: normalizeArchivePageSize(params.get("per") || 24),
    itemSize: normalizeArchiveItemSize(params.get("size") || "comfortable")
  };
}
