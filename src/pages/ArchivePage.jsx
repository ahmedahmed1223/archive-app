import {
  parseAppRoute,
  writeAppRoute
} from "../services/router/index.js";
import {
  useAppStore
} from "../stores/index.js";
import {
  Archive,
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
import {
  createArchiveRouteParams,
  getArchiveActiveFilterCount,
  getArchiveResultRangeText,
  getFilteredArchiveItems,
  hasArchiveContentFilters,
  normalizeArchiveItemSize,
  normalizeArchivePage,
  normalizeArchivePageSize,
  normalizeArchiveViewMode,
  parseArchiveRouteParams
} from "../features/archive/viewModel.js";
import { FileArchiveWizard } from "../features/archive/FileArchiveWizard.jsx";
import {
  ARCHIVE_GRID_CLASSES,
  ARCHIVE_ITEM_SIZE_LABELS,
  ARCHIVE_ITEM_SIZE_OPTIONS,
  ARCHIVE_PAGE_SIZE_OPTIONS,
  AnimatedItem,
  ArchiveMetric,
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


export function ArchivePage() {
  const {
    videoItems = [],
    contentTypes = [],
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
    toggleFavorite,
    deleteVideoItem,
    restoreVideoItem,
    addVideoItem,
    addRecentSearch,
    showToast
  } = useAppStore();

  const initialRouteState = React.useMemo(() => parseArchiveRouteParams(parseAppRoute().params), []);
  const [localSearch, setLocalSearch] = React.useState(initialRouteState.searchQuery || searchQuery || "");
  const [sortField, setSortField] = React.useState(initialRouteState.sortField || "updatedAt");
  const [sortDirection, setSortDirection] = React.useState(initialRouteState.sortDirection || "desc");
  const [showDeleted, setShowDeleted] = React.useState(initialRouteState.showDeleted || false);
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(initialRouteState.showFavoritesOnly || false);
  const [page, setPage] = React.useState(initialRouteState.page || 1);
  const [pageSize, setPageSize] = React.useState(initialRouteState.pageSize || 24);
  const [itemSize, setItemSize] = React.useState(initialRouteState.itemSize || "comfortable");
  const [previewId, setPreviewId] = React.useState(null);
  const [showFileImportWizard, setShowFileImportWizard] = React.useState(initialRouteState.openImport || false);
  const activeViewMode = normalizeArchiveViewMode(viewMode || initialRouteState.viewMode || settings.defaultView || "grid");
  const activePageSize = normalizeArchivePageSize(pageSize);
  const activeItemSize = normalizeArchiveItemSize(itemSize);

  React.useEffect(() => {
    if (initialRouteState.searchQuery) setSearchQuery?.(initialRouteState.searchQuery);
    if (initialRouteState.filterType && initialRouteState.filterType !== filterType) setFilterType?.(initialRouteState.filterType);
    if (initialRouteState.filterSubtype && initialRouteState.filterSubtype !== filterSubtype) setFilterSubtype?.(initialRouteState.filterSubtype);
    if (initialRouteState.viewMode && initialRouteState.viewMode !== viewMode) setViewMode?.(initialRouteState.viewMode);
  }, []);

  React.useEffect(() => {
    const applyRouteFlags = () => {
      const nextRouteState = parseArchiveRouteParams(parseAppRoute().params);
      if (nextRouteState.openImport) setShowFileImportWizard(true);
      if (nextRouteState.viewMode && nextRouteState.viewMode !== viewMode) setViewMode?.(nextRouteState.viewMode);
      if (nextRouteState.page !== page) setPage(nextRouteState.page);
      if (nextRouteState.pageSize !== activePageSize) setPageSize(nextRouteState.pageSize);
      if (nextRouteState.itemSize !== activeItemSize) setItemSize(nextRouteState.itemSize);
    };
    window.addEventListener("hashchange", applyRouteFlags);
    window.addEventListener("popstate", applyRouteFlags);
    return () => {
      window.removeEventListener("hashchange", applyRouteFlags);
      window.removeEventListener("popstate", applyRouteFlags);
    };
  }, [activeItemSize, activePageSize, page, setViewMode, viewMode]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery?.(localSearch);
      if (localSearch.trim()) addRecentSearch?.(localSearch.trim());
    }, 120);
    return () => window.clearTimeout(handle);
  }, [addRecentSearch, localSearch, setSearchQuery]);

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
      openImport: showFileImportWizard,
      page: currentPage,
      pageSize: activePageSize,
      itemSize: activeItemSize
    });
    writeAppRoute("archive", { params }, settings, true);
  }, [activeItemSize, activePageSize, activeViewMode, currentPage, filterType, filterSubtype, localSearch, settings, showDeleted, showFavoritesOnly, showFileImportWizard, sortDirection, sortField]);

  const typeById = React.useMemo(() => new Map(contentTypes.map((type) => [type.id, type])), [contentTypes]);
  const activeType = typeById.get(filterType);
  const subtypes = activeType?.subtypes || [];
  const previewItem = filteredItems.find((item) => item.id === previewId) || visibleItems[0] || null;
  const activeFilterCount = getArchiveActiveFilterCount({ searchQuery: localSearch, filterType, filterSubtype, showDeleted, showFavoritesOnly });
  const hasFilters = hasArchiveContentFilters({ searchQuery: localSearch, filterType, filterSubtype, showFavoritesOnly });

  const goToPage = (nextPage) => {
    const normalized = normalizeArchivePage(nextPage);
    setPage(Math.min(Math.max(normalized, 1), totalPages));
  };

  const changePageSize = (nextPageSize) => {
    setPageSize(normalizeArchivePageSize(nextPageSize));
    setPage(1);
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
  const itemActions = (item) => ({
    item,
    typeLabel: typeLabel(item),
    subtypeLabel: subtypeLabel(item),
    selected: previewItem?.id === item.id,
    showDeleted,
    itemSize: activeItemSize,
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
        onPreview: (item) => setPreviewId(item.id),
        onOpen: openItem,
        onFavorite: (item) => toggleFavorite?.(item.id),
        onDelete: confirmDelete,
        onRestore: (item) => restoreVideoItem?.(item.id)
      });
    }
    return jsx("div", {
      className: ARCHIVE_GRID_CLASSES[activeItemSize] || ARCHIVE_GRID_CLASSES.comfortable,
      children: visibleItems.map((item, index) => jsx(AnimatedItem, {
        index,
        children: jsx(VideoCard, itemActions(item))
      }, item.id))
    });
  };

  return jsxs("div", {
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", {
        className: "va-page-hero rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10",
        children: [
          jsxs("div", {
            className: "flex flex-wrap items-start justify-between gap-4",
            children: [
              jsxs("div", {
                className: "min-w-0",
                children: [
                  jsxs("h2", { className: "va-title flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Archive, { className: "h-6 w-6 text-emerald-400" }), "الأرشيف"] }),
                  jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "شبكة سريعة للمعاينة والبحث اللحظي، مع فلاتر محفوظة في الرابط وزر إضافة واضح دائماً." })
                ]
              }),
              jsxs("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  jsx(ToolbarButton, { onClick: openImport, icon: jsx(Upload, { className: "h-4 w-4" }), children: "استيراد ملفات" }),
                  jsx("button", {
                    type: "button",
                    onClick: openAdd,
                    className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600",
                    children: [jsx(Video, { className: "h-4 w-4" }), "إضافة فيديو"]
                  })
                ]
              })
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
      jsx("section", {
        className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          jsx(ArchiveMetric, { label: "النتائج الحالية", value: formatNumber(filteredItems.length), hint: rangeText }),
          jsx(ArchiveMetric, { label: "كل العناصر", value: formatNumber(videoItems.length), hint: `${formatNumber(videoItems.filter((item) => !item.isDeleted).length)} نشط` }),
          jsx(ArchiveMetric, { label: "الفلاتر", value: formatNumber(activeFilterCount), hint: activeFilterCount ? "فلاتر مطبقة" : "بدون فلاتر" }),
          jsx(ArchiveMetric, { label: "قابل للمعاينة", value: formatNumber(filteredItems.filter((item) => isHtml5PreviewableVideo(item.path || item.filePath || item.url || "")).length), hint: "HTML5 داخل التطبيق" })
        ]
      }),
      jsxs("section", {
        className: "va-filter-surface rounded-2xl border border-white/10 bg-gray-900/50 p-4 text-right backdrop-blur-sm",
        children: [
          jsxs("div", {
            className: "grid gap-3 xl:grid-cols-[minmax(260px,1fr)_220px_180px_180px]",
            children: [
              jsxs("label", {
                className: "relative block",
                children: [
                  jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
                  jsx("input", {
                    value: localSearch,
                    onChange: (event) => setLocalSearch(event.target.value),
                    placeholder: "بحث لحظي بالعنوان أو الوسوم أو الملاحظات",
                    className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none focus:border-emerald-500/50"
                  })
                ]
              }),
              jsxs("select", {
                value: filterType,
                onChange: (event) => setFilterType?.(event.target.value),
                className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 py-2 text-sm text-white",
                children: [
                  jsx("option", { value: "all", children: "كل الأنواع" }),
                  ...contentTypes.map((type) => jsx("option", { value: type.id, children: type.name || type.id }, type.id))
                ]
              }),
              jsxs("select", {
                value: filterSubtype,
                onChange: (event) => setFilterSubtype?.(event.target.value),
                disabled: !subtypes.length,
                className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 py-2 text-sm text-white disabled:opacity-50",
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
                className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 py-2 text-sm text-white",
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
            className: "mt-3 flex flex-wrap items-center gap-2",
            children: [
              jsxs("div", {
                className: "va-control-surface inline-flex min-h-10 overflow-hidden rounded-xl border border-white/10 bg-gray-950/35 p-1",
                role: "group",
                "aria-label": "وضع عرض الأرشيف",
                children: [
                  jsx("button", {
                    type: "button",
                    onClick: () => setViewMode?.("grid"),
                    className: `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${activeViewMode === "grid" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                    children: [jsx(LayoutGrid, { className: "h-4 w-4" }), "شبكة"]
                  }),
                  jsx("button", {
                    type: "button",
                    onClick: () => setViewMode?.("list"),
                    className: `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${activeViewMode === "list" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                    children: [jsx(Archive, { className: "h-4 w-4" }), "قائمة"]
                  }),
                  jsx("button", {
                    type: "button",
                    onClick: () => setViewMode?.("table"),
                    className: `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${activeViewMode === "table" ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                    children: [jsx(FolderOpen, { className: "h-4 w-4" }), "جدول"]
                  })
                ]
              }),
              jsx(SegmentedControl, {
                label: "حجم العناصر",
                value: activeItemSize,
                options: ARCHIVE_ITEM_SIZE_OPTIONS,
                onChange: (value) => setItemSize(normalizeArchiveItemSize(value))
              }),
              jsxs("label", {
                className: "inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-3 py-1.5 text-sm text-gray-400",
                children: [
                  jsx("span", { className: "text-xs text-gray-500", children: "في الصفحة" }),
                  jsx("select", {
                    value: activePageSize,
                    onChange: (event) => changePageSize(event.target.value),
                    className: "min-h-7 rounded-lg border-0 bg-transparent px-1 text-sm font-semibold text-white outline-none",
                    children: ARCHIVE_PAGE_SIZE_OPTIONS.map((option) => jsx("option", { value: option, children: formatNumber(option) }, option))
                  })
                ]
              }),
              jsx(ToolbarButton, { active: showFavoritesOnly, onClick: () => setShowFavoritesOnly((value) => !value), icon: jsx(Tags, { className: "h-4 w-4" }), children: "المفضلة فقط" }),
              jsx(ToolbarButton, { active: showDeleted, danger: showDeleted, onClick: () => setShowDeleted((value) => !value), icon: jsx(Trash2, { className: "h-4 w-4" }), children: "سلة المحذوفات" }),
              (hasFilters || showDeleted) && jsx(ToolbarButton, { onClick: resetFilters, icon: jsx(RefreshCw, { className: "h-4 w-4" }), children: "مسح الفلاتر" })
            ]
          })
        ]
      }),
      jsxs("section", {
        className: "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]",
        children: [
          filteredItems.length === 0 ? jsxs("div", {
            className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-950/35 p-8 text-center",
            children: [
              jsx(FolderOpen, { className: "mx-auto h-12 w-12 text-gray-500" }),
              jsx("h3", { className: "mt-4 text-lg font-bold text-white", children: showDeleted ? "سلة المحذوفات فارغة" : hasFilters ? "لا توجد نتائج مطابقة" : "الأرشيف فارغ" }),
              jsx("p", { className: "mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500", children: showDeleted ? "لا توجد عناصر محذوفة حالياً." : hasFilters ? "جرّب مسح الفلاتر أو كلمة بحث أقصر." : "ابدأ بإضافة فيديو أو استيراد بيانات من جهازك." }),
              jsxs("div", {
                className: "mt-5 flex flex-wrap justify-center gap-2",
                children: [
                  hasFilters && jsx(ToolbarButton, { onClick: resetFilters, icon: jsx(RefreshCw, { className: "h-4 w-4" }), children: "مسح الفلاتر" }),
                  !showDeleted && jsx(ToolbarButton, { onClick: openAdd, active: true, icon: jsx(Video, { className: "h-4 w-4" }), children: "إضافة فيديو" })
                ]
              })
            ]
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
                      jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: `${formatNumber(activePageSize)} عنصر/صفحة` })
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
      })
    ]
  });
}

ArchivePage.pageId = "archive";
ArchivePage.migrationStatus = "native";

export default ArchivePage;
