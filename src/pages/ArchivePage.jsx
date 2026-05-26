import {
  parseAppRoute,
  writeAppRoute
} from "../services/router/index.js";
import {
  useAppStore
} from "../stores/index.js";
import {
  Archive,
  CheckSquare,
  FolderOpen,
  LayoutGrid,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  Upload,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { FloatingActionBar, MotionPage, PageHero } from "../components/ui/V1Primitives.jsx";
import {
  createArchiveRouteParams,
  getArchiveActiveFilterCount,
  getArchiveResultRangeText,
  getFilteredArchiveItems,
  hasArchiveContentFilters,
  normalizeArchiveGridRows,
  normalizeArchiveItemSize,
  normalizeArchivePage,
  normalizeArchivePageSize,
  normalizeArchiveTopMode,
  normalizeArchiveViewMode,
  parseArchiveRouteParams
} from "../features/archive/viewModel.js";
import { FileArchiveWizard } from "../features/archive/FileArchiveWizard.jsx";
import { BulkActionBar } from "../features/archive/BulkActionBar.jsx";
import {
  ARCHIVE_GRID_CLASSES,
  ARCHIVE_ITEM_SIZE_LABELS,
  ARCHIVE_ITEM_SIZE_OPTIONS,
  ARCHIVE_PAGE_SIZE_OPTIONS,
  AnimatedItem,
  ArchivePagination,
  PreviewPanel,
  SegmentedControl,
  ToolbarButton,
  VideoCard,
  VideoListItem,
  VideoTableView
} from "../features/archive/ArchiveViews.jsx";
import {
  isHtml5PreviewableVideo
} from "../features/archive/mediaPreview.js";
import {
  formatNumber
} from "../utils/formatting.js";

const ARCHIVE_GRID_ROW_OPTIONS = [2, 3, 4, 6];
const ARCHIVE_GRID_ROW_MIN = 1;
const ARCHIVE_GRID_ROW_MAX = 12;

function getGridColumnCount(width = 0, itemSize = "compact") {
  if (itemSize === "large") return width >= 1536 ? 3 : width >= 1024 ? 2 : 1;
  if (itemSize === "comfortable") return width >= 1536 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  return width >= 1536 ? 5 : width >= 1280 ? 4 : width >= 768 ? 3 : width >= 640 ? 2 : 1;
}

function CompactStat({ label, value, hint }) {
  return jsxs("span", {
    className: "inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-3 py-1.5 text-xs text-gray-400",
    children: [
      jsx("span", { className: "text-gray-500", children: label }),
      jsx("strong", { className: "text-sm text-white", children: value }),
      hint && jsx("span", { className: "hidden text-gray-600 sm:inline", children: hint })
    ]
  });
}


export function ArchivePage() {
  const {
    videoItems = [],
    contentTypes = [],
    virtualCollections = [],
    selectedItems: storeSelectedItems = [],
    searchQuery = "",
    filterType = "all",
    filterSubtype = "all",
    settings = {},
    viewMode = settings.defaultView || "grid",
    setCurrentPage,
    setSelectedItemId,
    setSearchQuery,
    setFilterType,
    setFilterSubtype,
    setViewMode,
    updateSettings,
    toggleFavorite,
    deleteVideoItem,
    restoreVideoItem,
    addVideoItem,
    addRecentSearch,
    toggleBulkSelect,
    selectAllItems,
    clearSelection,
    bulkDeleteItems,
    bulkRestoreItems,
    bulkAddTags,
    bulkMoveToCollection,
    showToast
  } = useAppStore();

  const initialRouteParams = React.useMemo(() => parseAppRoute().params, []);
  const initialRouteState = React.useMemo(() => parseArchiveRouteParams(initialRouteParams), [initialRouteParams]);
  const [localSearch, setLocalSearch] = React.useState(initialRouteState.searchQuery || searchQuery || "");
  const [sortField, setSortField] = React.useState(initialRouteState.sortField || "updatedAt");
  const [sortDirection, setSortDirection] = React.useState(initialRouteState.sortDirection || "desc");
  const [showDeleted, setShowDeleted] = React.useState(initialRouteState.showDeleted || false);
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(initialRouteState.showFavoritesOnly || false);
  const [page, setPage] = React.useState(initialRouteState.page || 1);
  const [pageSize, setPageSize] = React.useState(initialRouteParams.has("per") ? initialRouteState.pageSize : 24);
  const [itemSize, setItemSize] = React.useState(initialRouteParams.has("size") ? initialRouteState.itemSize : settings.ui?.archiveItemSize || "compact");
  const [topMode, setTopMode] = React.useState(initialRouteParams.has("top") ? initialRouteState.topMode : settings.ui?.archiveTopMode || "quick");
  const [gridRows, setGridRows] = React.useState(initialRouteParams.has("rows") ? initialRouteState.gridRows : settings.ui?.archiveGridRows || 3);
  const [gridColumnCount, setGridColumnCount] = React.useState(3);
  const [previewId, setPreviewId] = React.useState(null);
  const [showFileImportWizard, setShowFileImportWizard] = React.useState(initialRouteState.openImport || false);
  const [bulkMode, setBulkMode] = React.useState(false);
  const gridContainerRef = React.useRef(null);

  const selectedIdSet = React.useMemo(() => new Set(storeSelectedItems || []), [storeSelectedItems]);
  const isItemSelected = React.useCallback((id) => selectedIdSet.has(id), [selectedIdSet]);
  const exitBulkMode = React.useCallback(() => {
    setBulkMode(false);
    clearSelection?.();
  }, [clearSelection]);

  React.useEffect(() => {
    if (!bulkMode) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") exitBulkMode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bulkMode, exitBulkMode]);
  const activeViewMode = normalizeArchiveViewMode(viewMode || initialRouteState.viewMode || settings.defaultView || "grid");
  const listPageSize = normalizeArchivePageSize(pageSize);
  const activeItemSize = normalizeArchiveItemSize(itemSize);
  const activeTopMode = normalizeArchiveTopMode(topMode);
  const activeGridRows = normalizeArchiveGridRows(gridRows);
  const activePageSize = activeViewMode === "grid" ? Math.max(1, activeGridRows * gridColumnCount) : listPageSize;

  React.useEffect(() => {
    if (initialRouteState.searchQuery) setSearchQuery?.(initialRouteState.searchQuery);
    if (initialRouteState.filterType && initialRouteState.filterType !== filterType) setFilterType?.(initialRouteState.filterType);
    if (initialRouteState.filterSubtype && initialRouteState.filterSubtype !== filterSubtype) setFilterSubtype?.(initialRouteState.filterSubtype);
    if (initialRouteState.viewMode && initialRouteState.viewMode !== viewMode) setViewMode?.(initialRouteState.viewMode);
  }, []);

  React.useEffect(() => {
    const applyRouteFlags = () => {
      const nextRouteState = parseArchiveRouteParams(parseAppRoute().params);
      setShowFileImportWizard(Boolean(nextRouteState.openImport));
      if (nextRouteState.viewMode && nextRouteState.viewMode !== viewMode) setViewMode?.(nextRouteState.viewMode);
      if (nextRouteState.page !== page) setPage(nextRouteState.page);
      if (nextRouteState.pageSize !== listPageSize) setPageSize(nextRouteState.pageSize);
      if (nextRouteState.itemSize !== activeItemSize) setItemSize(nextRouteState.itemSize);
      if (nextRouteState.topMode !== activeTopMode) setTopMode(nextRouteState.topMode);
      if (nextRouteState.gridRows !== activeGridRows) setGridRows(nextRouteState.gridRows);
    };
    const applyImportEvent = () => setShowFileImportWizard(true);
    window.addEventListener("hashchange", applyRouteFlags);
    window.addEventListener("popstate", applyRouteFlags);
    window.addEventListener("videoarchive:archive-import-open", applyImportEvent);
    return () => {
      window.removeEventListener("hashchange", applyRouteFlags);
      window.removeEventListener("popstate", applyRouteFlags);
      window.removeEventListener("videoarchive:archive-import-open", applyImportEvent);
    };
  }, [activeGridRows, activeItemSize, activeTopMode, listPageSize, page, setViewMode, viewMode]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery?.(localSearch);
      if (localSearch.trim()) addRecentSearch?.(localSearch.trim());
    }, 120);
    return () => window.clearTimeout(handle);
  }, [addRecentSearch, localSearch, setSearchQuery]);

  React.useEffect(() => {
    const element = gridContainerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      setGridColumnCount(getGridColumnCount(typeof window !== "undefined" ? window.innerWidth : 1200, activeItemSize));
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || element.clientWidth || 0;
      setGridColumnCount(getGridColumnCount(width, activeItemSize));
    });
    observer.observe(element);
    setGridColumnCount(getGridColumnCount(element.clientWidth || 0, activeItemSize));
    return () => observer.disconnect();
  }, [activeItemSize]);

  const filteredItems = React.useMemo(() => getFilteredArchiveItems({
    videoItems,
    filterType,
    filterSubtype,
    searchQuery: localSearch,
    sortField,
    sortDirection,
    showDeleted,
    showFavoritesOnly
  }), [filterType, filterSubtype, localSearch, showDeleted, showFavoritesOnly, sortDirection, sortField, videoItems]);
  const quickSearchMatches = React.useMemo(() => localSearch.trim() ? filteredItems.slice(0, 5) : [], [filteredItems, localSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / activePageSize));
  const currentPage = Math.min(normalizeArchivePage(page), totalPages);
  const visibleItems = filteredItems.slice((currentPage - 1) * activePageSize, currentPage * activePageSize);
  const rangeText = getArchiveResultRangeText({ total: filteredItems.length, page: currentPage, itemsPerPage: activePageSize });
  const initialFilterHydrationSkips = React.useRef(
    initialRouteState.page > 1
    || initialRouteState.searchQuery
    || initialRouteState.filterType !== "all"
    || initialRouteState.filterSubtype !== "all"
    || initialRouteState.showDeleted
    || initialRouteState.showFavoritesOnly
    || initialRouteState.sortField !== "updatedAt"
    || initialRouteState.sortDirection !== "desc"
      ? 2
      : 1
  );
  const resetPageAfterFilterChange = React.useRef(0);

  React.useEffect(() => {
    resetPageAfterFilterChange.current += 1;
    if (resetPageAfterFilterChange.current <= initialFilterHydrationSkips.current) {
      return;
    }
    setPage(1);
  }, [activePageSize, filterType, filterSubtype, localSearch, showDeleted, showFavoritesOnly, sortDirection, sortField]);

  React.useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  React.useEffect(() => {
    const params = createArchiveRouteParams({
      searchQuery: localSearch,
      filterType,
      filterSubtype,
      showDeleted,
      showFavoritesOnly,
      sortField,
      sortDirection,
      viewMode: activeViewMode,
      topMode: activeTopMode,
      openImport: showFileImportWizard,
      page: currentPage,
      pageSize: listPageSize,
      itemSize: activeItemSize,
      gridRows: activeGridRows
    });
    writeAppRoute("archive", { params }, settings, true);
  }, [activeGridRows, activeItemSize, activeTopMode, activeViewMode, currentPage, filterType, filterSubtype, listPageSize, localSearch, settings, showDeleted, showFavoritesOnly, showFileImportWizard, sortDirection, sortField]);

  const typeById = React.useMemo(() => new Map(contentTypes.map((type) => [type.id, type])), [contentTypes]);
  const typeCounts = React.useMemo(() => new Map(contentTypes.map((type) => [
    type.id,
    videoItems.filter((item) => item.type === type.id && !item.isDeleted).length
  ])), [contentTypes, videoItems]);
  const activeType = typeById.get(filterType);
  const subtypes = activeType?.subtypes || [];
  const previewItem = filteredItems.find((item) => item.id === previewId) || visibleItems[0] || null;
  const activeFilterCount = getArchiveActiveFilterCount({ searchQuery: localSearch, filterType, filterSubtype, showDeleted, showFavoritesOnly });
  const hasFilters = hasArchiveContentFilters({ searchQuery: localSearch, filterType, filterSubtype, showFavoritesOnly });

  React.useEffect(() => {
    if (filterSubtype !== "all" && !subtypes.some((subtype) => subtype.id === filterSubtype)) {
      setFilterSubtype?.("all");
    }
  }, [filterSubtype, setFilterSubtype, subtypes]);

  const goToPage = (nextPage) => {
    const normalized = normalizeArchivePage(nextPage);
    setPage(Math.min(Math.max(normalized, 1), totalPages));
  };

  const changePageSize = (nextPageSize) => {
    setPageSize(normalizeArchivePageSize(nextPageSize));
    setPage(1);
  };

  const updateArchiveUiPreference = (patch) => {
    updateSettings?.({ ui: { ...(settings.ui || {}), ...patch } });
  };

  const changeTopMode = (nextMode) => {
    const normalized = normalizeArchiveTopMode(nextMode);
    setTopMode(normalized);
    updateArchiveUiPreference({ archiveTopMode: normalized });
  };

  const changeViewMode = (nextViewMode) => {
    const normalized = normalizeArchiveViewMode(nextViewMode);
    setViewMode?.(normalized);
    setPage(1);
    updateArchiveUiPreference({ archiveViewMode: normalized });
  };

  const changeItemSize = (nextSize) => {
    const normalized = normalizeArchiveItemSize(nextSize);
    setItemSize(normalized);
    setPage(1);
    updateArchiveUiPreference({ archiveItemSize: normalized });
  };

  const changeGridRows = (nextRows) => {
    const normalized = normalizeArchiveGridRows(nextRows);
    setGridRows(normalized);
    setPage(1);
    updateArchiveUiPreference({ archiveGridRows: normalized });
  };

  const resetFilters = () => {
    setLocalSearch("");
    setFilterType?.("all");
    setFilterSubtype?.("all");
    setShowDeleted(false);
    setShowFavoritesOnly(false);
    setSortField("updatedAt");
    setSortDirection("desc");
    setPage(1);
  };

  const openAdd = () => {
    setSelectedItemId?.(null);
    setCurrentPage?.("add");
  };

  const openItem = (item) => {
    setSelectedItemId?.(item.id);
    setCurrentPage?.("detail");
  };

  const openImport = () => {
    setShowFileImportWizard(true);
  };

  const confirmDelete = async (item) => {
    const confirmed = await appConfirm(`حذف "${item.title || "العنصر"}" إلى سلة المحذوفات؟`, {
      title: "حذف فيديو",
      kind: "warning",
      confirmLabel: "حذف"
    });
    if (!confirmed) return;
    await deleteVideoItem?.(item.id);
    showToast?.("تم نقل العنصر إلى سلة المحذوفات", "info");
  };

  const typeLabel = (item) => typeById.get(item.type)?.name || item.type || "";
  const subtypeLabel = (item) => typeById.get(item.type)?.subtypes?.find((subtype) => subtype.id === item.subtype)?.name || item.subtype || "";
  const visibleIds = React.useMemo(() => visibleItems.map((item) => item.id), [visibleItems]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIdSet.has(id));
  const toggleSelectAllVisible = React.useCallback(() => {
    if (allVisibleSelected) {
      clearSelection?.();
    } else {
      // Use selectAllItems only when no filters; otherwise add only the visible ids.
      visibleIds.forEach((id) => {
        if (!selectedIdSet.has(id)) toggleBulkSelect?.(id);
      });
    }
  }, [allVisibleSelected, clearSelection, selectedIdSet, toggleBulkSelect, visibleIds]);

  const itemActions = (item) => ({
    item,
    typeLabel: typeLabel(item),
    subtypeLabel: subtypeLabel(item),
    selected: previewItem?.id === item.id,
    showDeleted,
    itemSize: activeItemSize,
    bulkMode,
    bulkSelected: selectedIdSet.has(item.id),
    onBulkToggle: () => toggleBulkSelect?.(item.id),
    onPreview: () => setPreviewId(item.id),
    onOpen: () => openItem(item),
    onFavorite: () => toggleFavorite?.(item.id),
    onDelete: () => confirmDelete(item),
    onRestore: () => restoreVideoItem?.(item.id)
  });

  const renderArchiveItems = () => {
    if (activeViewMode === "list") {
      return jsx("div", {
        className: "space-y-3",
        children: visibleItems.map((item, index) => jsx(AnimatedItem, {
          index,
          children: jsx(VideoListItem, itemActions(item))
        }, item.id))
      });
    }
    if (activeViewMode === "table") {
      return jsx(VideoTableView, {
        items: visibleItems,
        previewItem,
        typeLabel,
        subtypeLabel,
        showDeleted,
        itemSize: activeItemSize,
        bulkMode,
        isSelected: isItemSelected,
        onBulkToggle: (id) => toggleBulkSelect?.(id),
        allSelected: allVisibleSelected,
        onSelectAll: toggleSelectAllVisible,
        onPreview: (item) => setPreviewId(item.id),
        onOpen: openItem,
        onFavorite: (item) => toggleFavorite?.(item.id),
        onDelete: confirmDelete,
        onRestore: (item) => restoreVideoItem?.(item.id)
      });
    }
    return jsx("div", {
      ref: gridContainerRef,
      className: ARCHIVE_GRID_CLASSES[activeItemSize] || ARCHIVE_GRID_CLASSES.comfortable,
      children: visibleItems.map((item, index) => jsx(AnimatedItem, {
        index,
        children: jsx(VideoCard, itemActions(item))
      }, item.id))
    });
  };

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6 pb-24",
    children: [
      jsx(PageHero, {
        icon: jsx(Archive, { className: "h-6 w-6 text-emerald-400" }),
        title: "الأرشيف",
        description: "بحث سريع وفلاتر عند الطلب، مع تحكم مباشر بحجم البطاقات وعدد الصفوف.",
        compact: true,
        actions: jsxs(React.Fragment, {
          children: [
            jsxs("div", {
              className: "va-control-surface inline-flex min-h-9 overflow-hidden rounded-xl border border-white/10 bg-gray-950/35 p-1",
              role: "group",
              "aria-label": "وضع القسم العلوي",
              children: [
                jsx("button", {
                  type: "button",
                  onClick: () => changeTopMode("quick"),
                  "aria-pressed": activeTopMode === "quick",
                  className: `rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${activeTopMode === "quick" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                  children: "سريع"
                }),
                jsx("button", {
                  type: "button",
                  onClick: () => changeTopMode("detailed"),
                  "aria-pressed": activeTopMode === "detailed",
                  className: `rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${activeTopMode === "detailed" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                  children: "تفصيلي"
                })
              ]
            }),
            jsx(ToolbarButton, { onClick: openImport, icon: jsx(Upload, { className: "h-4 w-4" }), children: "استيراد ملفات" }),
            jsx("button", {
              type: "button",
              onClick: openAdd,
              className: "va-primary-button inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-white",
              children: [jsx(Video, { className: "h-4 w-4" }), "إضافة فيديو"]
            })
          ]
        }),
        children: [
          jsxs("div", {
            className: "mt-3 grid gap-2 xl:grid-cols-[minmax(260px,1fr)_auto]",
            children: [
              jsxs("label", {
                className: "relative block",
                children: [
                  jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
                  jsx("input", {
                    value: localSearch,
                    onChange: (event) => setLocalSearch(event.target.value),
                    placeholder: "بحث لحظي بالعنوان أو الوسوم أو الملاحظات",
                    className: "min-h-10 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none focus:border-emerald-500/50"
                  })
                ]
              }),
              jsxs("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                  jsxs("div", {
                    className: "va-control-surface inline-flex min-h-9 overflow-hidden rounded-xl border border-white/10 bg-gray-950/35 p-1",
                    role: "group",
                    "aria-label": "وضع عرض الأرشيف",
                    children: [
                      jsx("button", {
                        type: "button",
                        onClick: () => changeViewMode("grid"),
                        "aria-pressed": activeViewMode === "grid",
                        className: `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${activeViewMode === "grid" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                        children: [jsx(LayoutGrid, { className: "h-3.5 w-3.5" }), "شبكة"]
                      }),
                      jsx("button", {
                        type: "button",
                        onClick: () => changeViewMode("list"),
                        "aria-pressed": activeViewMode === "list",
                        className: `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${activeViewMode === "list" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                        children: [jsx(Archive, { className: "h-3.5 w-3.5" }), "قائمة"]
                      }),
                      jsx("button", {
                        type: "button",
                        onClick: () => changeViewMode("table"),
                        "aria-pressed": activeViewMode === "table",
                        className: `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${activeViewMode === "table" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                        children: [jsx(FolderOpen, { className: "h-3.5 w-3.5" }), "جدول"]
                      })
                    ]
                  }),
                  jsx(SegmentedControl, {
                    label: "الحجم",
                    value: activeItemSize,
                    options: ARCHIVE_ITEM_SIZE_OPTIONS,
                    onChange: changeItemSize
                  }),
                  activeViewMode === "grid" ? jsxs("div", {
                    className: "inline-flex flex-wrap items-center gap-2",
                    children: [
                      jsx(SegmentedControl, {
                        label: "الصفوف",
                        value: activeGridRows,
                        options: ARCHIVE_GRID_ROW_OPTIONS.map((value) => ({ value, label: `${formatNumber(value)} صفوف` })),
                        onChange: changeGridRows
                      }),
                      jsxs("label", {
                        className: "inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-2.5 py-1 text-xs text-gray-400",
                        title: `اختر قيمة بين ${formatNumber(ARCHIVE_GRID_ROW_MIN)} و${formatNumber(ARCHIVE_GRID_ROW_MAX)} صفًا`,
                        children: [
                          jsx("span", { className: "text-gray-500", children: "مخصص" }),
                          jsx("input", {
                            type: "number",
                            min: ARCHIVE_GRID_ROW_MIN,
                            max: ARCHIVE_GRID_ROW_MAX,
                            value: activeGridRows,
                            onChange: (event) => changeGridRows(event.target.value),
                            "aria-label": "عدد صفوف مخصص",
                            className: "min-h-7 w-14 rounded-lg border border-white/10 bg-gray-950/55 px-2 text-center text-xs font-semibold text-white outline-none focus:border-emerald-500/50"
                          })
                        ]
                      })
                    ]
                  }) : jsxs("label", {
                    className: "inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-2.5 py-1 text-xs text-gray-400",
                    children: [
                      jsx("span", { className: "text-gray-500", children: "في الصفحة" }),
                      jsx("select", {
                        value: listPageSize,
                        onChange: (event) => changePageSize(event.target.value),
                        className: "min-h-7 rounded-lg border-0 bg-transparent px-1 text-xs font-semibold text-white outline-none",
                        children: ARCHIVE_PAGE_SIZE_OPTIONS.map((option) => jsx("option", { value: option, children: formatNumber(option) }, option))
                      })
                    ]
                  })
                ]
              })
            ]
          }),
          quickSearchMatches.length > 0 && jsxs("div", {
            className: "mt-2 rounded-xl border border-white/10 bg-gray-950/30 p-2",
            children: [
              jsx("p", { className: "mb-1 text-xs font-semibold text-gray-500", children: "نتائج سريعة" }),
              jsx("div", {
                className: "grid gap-2 md:grid-cols-2 xl:grid-cols-5",
                children: quickSearchMatches.map((item) => jsx("button", {
                  type: "button",
                  onClick: () => {
                    setPage(1);
                    setPreviewId(item.id);
                  },
                  className: "va-action-card min-w-0 rounded-xl border border-white/10 bg-gray-900/35 px-3 py-2 text-right hover:border-emerald-500/25",
                  children: [
                    jsx("span", { className: "block truncate text-xs font-semibold text-white", children: item.title || "بدون عنوان" }),
                    jsx("span", { className: "mt-0.5 block truncate text-[11px] text-gray-500", children: item.updatedAt ? `آخر تحديث: ${item.updatedAt.slice(0, 10)}` : "بدون تاريخ" })
                  ]
                }, item.id))
              })
            ]
          }),
          jsxs("div", {
            className: "mt-3 flex flex-wrap items-center gap-2",
            children: [
              jsx(CompactStat, { label: "النتائج", value: formatNumber(filteredItems.length), hint: rangeText }),
              jsx(CompactStat, { label: "العناصر", value: formatNumber(videoItems.length), hint: `${formatNumber(videoItems.filter((item) => !item.isDeleted).length)} نشط` }),
              jsx(CompactStat, { label: "الفلاتر", value: formatNumber(activeFilterCount), hint: activeFilterCount ? "مطبقة" : "بدون" }),
              jsx(CompactStat, { label: "المعاينة", value: formatNumber(filteredItems.filter((item) => isHtml5PreviewableVideo(item.path || item.filePath || item.url || "")).length), hint: "HTML5" }),
              jsx(ToolbarButton, { active: showFavoritesOnly, onClick: () => setShowFavoritesOnly((value) => !value), icon: jsx(Tags, { className: "h-4 w-4" }), children: "المفضلة" }),
              jsx(ToolbarButton, { active: showDeleted, danger: showDeleted, onClick: () => setShowDeleted((value) => !value), icon: jsx(Trash2, { className: "h-4 w-4" }), children: "المحذوفات" }),
              jsx(ToolbarButton, { active: bulkMode, onClick: () => { setBulkMode((value) => { if (value) clearSelection?.(); return !value; }); }, icon: jsx(CheckSquare, { className: "h-4 w-4" }), children: bulkMode ? "إنهاء التحديد" : "تحديد متعدد" }),
              (hasFilters || showDeleted) && jsx(ToolbarButton, { onClick: resetFilters, icon: jsx(RefreshCw, { className: "h-4 w-4" }), children: "مسح" })
            ]
          })
        ]
      }),
      jsx(FileArchiveWizard, {
        open: showFileImportWizard,
        onOpenChange: setShowFileImportWizard,
        contentTypes,
        videoItems,
        addVideoItem,
        showToast
      }),
      jsx(BulkActionBar, {
        selectedCount: storeSelectedItems.length,
        totalVisible: visibleIds.length,
        allSelected: allVisibleSelected,
        showRestore: showDeleted,
        collections: virtualCollections,
        onSelectAll: toggleSelectAllVisible,
        onClear: exitBulkMode,
        onDelete: async () => {
          if (!storeSelectedItems.length) return;
          const confirmed = await appConfirm(`حذف ${storeSelectedItems.length} عنصر إلى سلة المحذوفات؟`, {
            title: "حذف متعدد",
            kind: "warning",
            confirmLabel: "حذف"
          });
          if (!confirmed) return;
          await bulkDeleteItems?.([...storeSelectedItems]);
        },
        onRestore: async () => {
          if (!storeSelectedItems.length) return;
          await bulkRestoreItems?.([...storeSelectedItems]);
        },
        onAddTags: async (tags) => {
          if (!storeSelectedItems.length || !tags?.length) return;
          await bulkAddTags?.([...storeSelectedItems], tags);
        },
        onMoveToCollection: async (collectionId) => {
          if (!collectionId) {
            showToast?.("أنشئ مجموعة أولاً من صفحة المجموعات.", "warning");
            return;
          }
          if (!storeSelectedItems.length) return;
          await bulkMoveToCollection?.([...storeSelectedItems], collectionId);
        }
      }),
      activeTopMode === "detailed" && jsxs("section", {
        className: "va-filter-surface z-20 rounded-2xl border border-white/10 bg-gray-900/50 p-3 text-right backdrop-blur-sm xl:sticky xl:top-3",
        children: [
          jsxs("div", {
            className: "grid gap-2 xl:grid-cols-[minmax(260px,1fr)_220px_180px_180px]",
            children: [
              jsx("div", { className: "hidden xl:block" }),
              jsxs("select", {
                value: filterType,
                onChange: (event) => {
                  setFilterType?.(event.target.value);
                  setFilterSubtype?.("all");
                },
                className: "min-h-10 rounded-xl border border-white/10 bg-gray-950/45 px-3 py-2 text-sm text-white",
                children: [
                  jsx("option", { value: "all", children: "كل الأنواع" }),
                  ...contentTypes.map((type) => jsx("option", { value: type.id, children: type.name || type.id }, type.id))
                ]
              }),
              jsxs("select", {
                value: filterSubtype,
                onChange: (event) => setFilterSubtype?.(event.target.value),
                disabled: !subtypes.length,
                className: "min-h-10 rounded-xl border border-white/10 bg-gray-950/45 px-3 py-2 text-sm text-white disabled:opacity-50",
                children: [
                  jsx("option", { value: "all", children: "كل الفروع" }),
                  ...subtypes.map((subtype) => jsx("option", { value: subtype.id, children: subtype.name || subtype.id }, subtype.id))
                ]
              }),
              jsxs("select", {
                value: `${sortField}:${sortDirection}`,
                onChange: (event) => {
                  const [field, direction] = event.target.value.split(":");
                  setSortField(field);
                  setSortDirection(direction);
                },
                className: "min-h-10 rounded-xl border border-white/10 bg-gray-950/45 px-3 py-2 text-sm text-white",
                children: [
                  jsx("option", { value: "updatedAt:desc", children: "الأحدث تحديثاً" }),
                  jsx("option", { value: "createdAt:desc", children: "الأحدث إضافة" }),
                  jsx("option", { value: "title:asc", children: "العنوان أ-ي" }),
                  jsx("option", { value: "title:desc", children: "العنوان ي-أ" })
                ]
              })
            ]
          }),
          jsxs("div", {
            className: "mt-2 flex gap-2 overflow-x-auto pb-1",
            "aria-label": "فلاتر الأنواع السريعة",
            children: [
              jsx("button", {
                type: "button",
                onClick: () => {
                  setFilterType?.("all");
                  setFilterSubtype?.("all");
                },
                className: `inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${filterType === "all" ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5 hover:text-white"}`,
                children: ["كل المواد", jsx("span", { className: "rounded-full bg-white/10 px-2 py-0.5 text-xs", children: formatNumber(videoItems.filter((item) => !item.isDeleted).length) }, "count")]
              }, "all"),
              ...contentTypes.filter((type) => type.status !== "archived").map((type) => jsx("button", {
                type: "button",
                onClick: () => {
                  setFilterType?.(type.id);
                  setFilterSubtype?.("all");
                },
                className: `inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${filterType === type.id ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5 hover:text-white"}`,
                style: filterType === type.id && type.color ? { boxShadow: `inset 0 0 0 1px ${type.color}44` } : undefined,
                children: [
                  jsx("span", { className: "text-base", children: type.icon || "📁" }),
                  jsx("span", { children: type.name || type.id }),
                  jsx("span", { className: "rounded-full bg-white/10 px-2 py-0.5 text-xs", children: formatNumber(typeCounts.get(type.id) || 0) })
                ]
              }, type.id))
            ]
          }),
          jsx("p", { className: "mt-2 text-xs leading-5 text-gray-500", children: "الفلاتر التفصيلية تظهر هنا عند الحاجة. الوضع السريع يحافظ على مساحة أكبر للمواد." })
        ]
      }),
      jsxs("section", {
        className: "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]",
        children: [
          filteredItems.length === 0 ? jsx("div", {
            className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-950/35",
            children: jsx(EmptyState, {
              type: showDeleted ? "trash" : "archive",
              title: showDeleted ? "سلة المحذوفات فارغة" : hasFilters ? "لا توجد نتائج مطابقة" : "الأرشيف فارغ",
              description: showDeleted
                ? "لا توجد عناصر محذوفة حالياً."
                : hasFilters
                  ? "جرّب مسح الفلاتر أو كلمة بحث أقصر."
                  : "ابدأ بإضافة فيديو أو استيراد بيانات من جهازك.",
              actionLabel: !showDeleted ? "إضافة فيديو" : undefined,
              onAction: !showDeleted ? openAdd : undefined,
              secondaryActionLabel: hasFilters ? "مسح الفلاتر" : undefined,
              onSecondaryAction: hasFilters ? resetFilters : undefined
            })
          }) : jsxs("div", {
            className: "space-y-4",
            children: [
              jsxs("div", {
                className: "va-control-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gray-950/35 p-3 text-sm",
                children: [
                  jsxs("div", {
                    className: "min-w-0",
                    children: [
                      jsx("p", { className: "font-semibold text-white", children: rangeText }),
                      jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: `الصفحة ${formatNumber(currentPage)} من ${formatNumber(totalPages)}` })
                    ]
                  }),
                  jsxs("div", {
                    className: "flex flex-wrap gap-2 text-xs text-gray-400",
                    children: [
                      jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: `العرض: ${activeViewMode === "grid" ? "شبكة" : activeViewMode === "list" ? "قائمة" : "جدول"}` }),
                      jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: `الحجم: ${ARCHIVE_ITEM_SIZE_LABELS[activeItemSize]}` }),
                      jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: activeViewMode === "grid" ? `${formatNumber(activeGridRows)} صفوف × ${formatNumber(gridColumnCount)} أعمدة` : `${formatNumber(activePageSize)} عنصر/صفحة` })
                    ]
                  })
                ]
              }),
              renderArchiveItems(),
              jsx(ArchivePagination, {
                currentPage,
                totalPages,
                onPageChange: goToPage
              })
            ]
          }),
          jsx(PreviewPanel, {
            item: previewItem,
            typeLabel: previewItem ? typeLabel(previewItem) : "",
            subtypeLabel: previewItem ? subtypeLabel(previewItem) : "",
            onOpen: () => previewItem && openItem(previewItem)
          })
        ]
      }),
      jsxs(FloatingActionBar, {
        children: [
          jsx(ToolbarButton, { onClick: openImport, icon: jsx(Upload, { className: "h-4 w-4" }), children: "استيراد ملفات" }, "import"),
          jsx("button", {
            type: "button",
            onClick: openAdd,
            className: "va-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white",
            children: [jsx(Video, { className: "h-4 w-4" }), "إضافة فيديو"]
          }, "add")
        ]
      })
    ]
  });
}

ArchivePage.pageId = "archive";
ArchivePage.migrationStatus = "native";

export default ArchivePage;
