import {
  getFilteredArchiveItems,
  normalizeArchivePage,
  normalizeArchivePageSize
} from "../archive/viewModel.js";

export function parseSearchRouteParams(params = new URLSearchParams()) {
  return {
    query: params.get("q") || "",
    type: params.get("type") || "all",
    subtype: params.get("subtype") || "all",
    favoritesOnly: params.get("favorites") === "1",
    dateFrom: params.get("from") || "",
    dateTo: params.get("to") || "",
    page: normalizeArchivePage(params.get("page") || 1),
    pageSize: normalizeArchivePageSize(params.get("per") || 24)
  };
}

export function createSearchRouteParams({
  query = "",
  type = "all",
  subtype = "all",
  favoritesOnly = false,
  dateFrom = "",
  dateTo = "",
  page = 1,
  pageSize = 24
} = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (type && type !== "all") params.set("type", type);
  if (subtype && subtype !== "all") params.set("subtype", subtype);
  if (favoritesOnly) params.set("favorites", "1");
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  const normalizedPage = normalizeArchivePage(page);
  if (normalizedPage > 1) params.set("page", String(normalizedPage));
  const normalizedPageSize = normalizeArchivePageSize(pageSize);
  if (normalizedPageSize !== 24) params.set("per", String(normalizedPageSize));
  return params;
}

export function getSearchResults({
  videoItems = [],
  query = "",
  type = "all",
  subtype = "all",
  favoritesOnly = false,
  dateFrom = "",
  dateTo = ""
} = {}) {
  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

  return getFilteredArchiveItems({
    videoItems,
    filterType: type,
    filterSubtype: subtype,
    searchQuery: query,
    showFavoritesOnly: favoritesOnly,
    sortField: "updatedAt",
    sortDirection: "desc",
    showDeleted: false
  }).filter((item) => {
    const itemTime = new Date(item.createdAt || item.updatedAt || 0).getTime();
    if (fromTime && itemTime < fromTime) return false;
    if (toTime && itemTime > toTime) return false;
    return true;
  });
}

export function getSearchActiveFilterCount({
  query = "",
  type = "all",
  subtype = "all",
  favoritesOnly = false,
  dateFrom = "",
  dateTo = ""
} = {}) {
  return [
    query.trim(),
    type && type !== "all",
    subtype && subtype !== "all",
    favoritesOnly,
    dateFrom,
    dateTo
  ].filter(Boolean).length;
}
