import {
  Archive,
  FolderOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Tags,
  Trash2,
  Upload,
  Video,
  appConfirm,
  legacyJsxRuntime,
  legacyMotion,
  legacyReact,
  LayoutGrid,
  parseAppRoute,
  useAppStore,
  writeAppRoute
} from "../runtime/legacyAdapter.js";
import {
  createArchiveRouteParams,
  getArchiveActiveFilterCount,
  getArchiveResultRangeText,
  getFilteredArchiveItems,
  hasArchiveContentFilters,
  normalizeArchiveViewMode,
  parseArchiveRouteParams
} from "../features/archive/viewModel.js";
import { FileArchiveWizard } from "../features/archive/FileArchiveWizard.jsx";
import {
  getHtml5VideoPreviewSource,
  isHtml5PreviewableVideo
} from "../features/archive/mediaPreview.js";
import {
  formatDateTime,
  formatNumber
} from "../utils/formatting.js";

const { jsx, jsxs } = legacyJsxRuntime;
const motion = legacyMotion;

function ToolbarButton({ children, onClick, active = false, danger = false, icon }) {
  return jsxs("button", {
    type: "button",
    onClick,
    className: `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? danger
          ? "border-red-500/35 bg-red-500/15 text-red-100"
          : "border-emerald-500/35 bg-emerald-500/15 text-emerald-100"
        : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5 hover:text-white"
    }`,
    children: [
      icon,
      children
    ]
  });
}

function ArchiveMetric({ label, value, hint }) {
  return jsxs("div", {
    className: "rounded-xl border border-white/5 bg-gray-950/35 p-3",
    children: [
      jsx("p", { className: "text-xs text-gray-500", children: label }),
      jsx("p", { className: "mt-1 text-lg font-bold text-white", children: value }),
      hint && jsx("p", { className: "mt-1 text-xs text-gray-500", children: hint })
    ]
  });
}

function VideoThumb({ item }) {
  const previewSource = getHtml5VideoPreviewSource(item.path || item.filePath || item.url || "");
  if (previewSource) {
    return jsx("video", {
      className: "h-full w-full object-cover",
      src: previewSource,
      preload: "metadata",
      muted: true,
      playsInline: true
    });
  }

  return jsxs("div", {
    className: "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 text-gray-500",
    children: [
      jsx(Video, { className: "h-9 w-9" }),
      jsx("span", { className: "mt-2 max-w-[75%] truncate text-xs", children: item.title || "بدون عنوان" })
    ]
  });
}

function VideoCard({ item, typeLabel, subtypeLabel, selected, onPreview, onOpen, onFavorite, onDelete, onRestore, showDeleted }) {
  return jsxs("article", {
    className: `group overflow-hidden rounded-2xl border bg-gray-900/45 text-right transition-colors ${
      selected ? "border-emerald-500/45 ring-1 ring-emerald-500/20" : "border-white/10 hover:border-emerald-500/25"
    }`,
    dir: "rtl",
    children: [
      jsxs("button", {
        type: "button",
        onClick: onPreview,
        className: "block w-full text-right",
        children: [
          jsx("div", { className: "aspect-video overflow-hidden border-b border-white/5 bg-gray-950", children: jsx(VideoThumb, { item }) }),
          jsxs("div", {
            className: "space-y-3 p-4",
            children: [
              jsxs("div", {
                className: "flex items-start justify-between gap-3",
                children: [
                  jsxs("div", {
                    className: "min-w-0",
                    children: [
                      jsx("h3", { className: "line-clamp-2 text-sm font-bold leading-relaxed text-white", children: item.title || "بدون عنوان" }),
                      jsx("p", { className: "mt-1 truncate text-xs text-gray-500", children: [typeLabel, subtypeLabel].filter(Boolean).join(" / ") || "غير مصنف" })
                    ]
                  }),
                  item.isFavorite && jsx("span", { className: "rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مفضلة" })
                ]
              }),
              item.tags?.length > 0 && jsxs("div", {
                className: "flex flex-wrap gap-1.5",
                children: item.tags.slice(0, 3).map((tag) => jsx("span", {
                  className: "rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
                  children: tag
                }, tag))
              }),
              jsx("p", { className: "text-xs text-gray-600", children: item.updatedAt ? formatDateTime(item.updatedAt) : "لم يسجل تحديث" })
            ]
          })
        ]
      }),
      jsxs("div", {
        className: "flex flex-wrap items-center gap-2 border-t border-white/5 p-3",
        children: [
          jsx("button", {
            type: "button",
            onClick: onOpen,
            className: "min-h-9 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600",
            children: "فتح التفاصيل"
          }),
          !showDeleted && jsx("button", {
            type: "button",
            onClick: onFavorite,
            className: "min-h-9 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5",
            children: item.isFavorite ? "إزالة المفضلة" : "مفضلة"
          }),
          showDeleted ? jsx("button", {
            type: "button",
            onClick: onRestore,
            className: "inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-500/20 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/10",
            children: [jsx(RotateCcw, { className: "h-4 w-4" }), "استعادة"]
          }) : jsx("button", {
            type: "button",
            onClick: onDelete,
            className: "inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-100 hover:bg-red-500/10",
            children: [jsx(Trash2, { className: "h-4 w-4" }), "حذف"]
          })
        ]
      })
    ]
  });
}

function AnimatedItem({ index, children, as = "div", className = "" }) {
  const Component = motion[as] || motion.div;
  return jsx(Component, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    className,
    children
  });
}

function VideoListItem({ item, typeLabel, subtypeLabel, selected, onPreview, onOpen, onFavorite, onDelete, onRestore, showDeleted }) {
  return jsxs("article", {
    className: `group grid gap-3 rounded-2xl border bg-gray-900/45 p-3 text-right transition-colors sm:grid-cols-[180px_minmax(0,1fr)_auto] ${
      selected ? "border-emerald-500/45 ring-1 ring-emerald-500/20" : "border-white/10 hover:border-emerald-500/25"
    }`,
    dir: "rtl",
    children: [
      jsx("button", {
        type: "button",
        onClick: onPreview,
        className: "overflow-hidden rounded-xl border border-white/10 bg-gray-950 text-right",
        children: jsx("div", { className: "aspect-video", children: jsx(VideoThumb, { item }) })
      }),
      jsxs("button", {
        type: "button",
        onClick: onPreview,
        className: "min-w-0 text-right",
        children: [
          jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: [
              jsx("h3", { className: "line-clamp-2 text-base font-bold leading-relaxed text-white", children: item.title || "بدون عنوان" }),
              item.isFavorite && jsx("span", { className: "rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مفضلة" })
            ]
          }),
          jsx("p", { className: "mt-1 text-sm text-gray-500", children: [typeLabel, subtypeLabel].filter(Boolean).join(" / ") || "غير مصنف" }),
          item.notes && jsx("p", { className: "mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400", children: item.notes }),
          item.tags?.length > 0 && jsx("div", {
            className: "mt-3 flex flex-wrap gap-1.5",
            children: item.tags.slice(0, 6).map((tag) => jsx("span", {
              className: "rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
              children: tag
            }, tag))
          }),
          jsx("p", { className: "mt-3 text-xs text-gray-600", children: item.updatedAt ? formatDateTime(item.updatedAt) : "لم يسجل تحديث" })
        ]
      }),
      jsxs("div", {
        className: "flex flex-wrap items-center gap-2 sm:w-32 sm:flex-col sm:items-stretch",
        children: [
          jsx("button", {
            type: "button",
            onClick: onOpen,
            className: "min-h-9 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600",
            children: "التفاصيل"
          }),
          !showDeleted && jsx("button", {
            type: "button",
            onClick: onFavorite,
            className: "min-h-9 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5",
            children: item.isFavorite ? "إزالة" : "مفضلة"
          }),
          showDeleted ? jsx("button", {
            type: "button",
            onClick: onRestore,
            className: "min-h-9 rounded-lg border border-emerald-500/20 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/10",
            children: "استعادة"
          }) : jsx("button", {
            type: "button",
            onClick: onDelete,
            className: "min-h-9 rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-100 hover:bg-red-500/10",
            children: "حذف"
          })
        ]
      })
    ]
  });
}

function VideoTableView({ items, previewItem, typeLabel, subtypeLabel, showDeleted, onPreview, onOpen, onFavorite, onDelete, onRestore }) {
  return jsx("div", {
    className: "overflow-hidden rounded-2xl border border-white/10 bg-gray-900/45",
    dir: "rtl",
    children: jsx("div", {
      className: "overflow-x-auto",
      children: jsxs("table", {
        className: "min-w-[820px] w-full text-right text-sm",
        children: [
          jsx("thead", {
            className: "border-b border-white/10 bg-gray-950/45 text-xs text-gray-500",
            children: jsxs("tr", {
              children: [
                jsx("th", { className: "px-4 py-3 font-medium", children: "العنوان" }),
                jsx("th", { className: "px-4 py-3 font-medium", children: "النوع" }),
                jsx("th", { className: "px-4 py-3 font-medium", children: "الوسوم" }),
                jsx("th", { className: "px-4 py-3 font-medium", children: "آخر تحديث" }),
                jsx("th", { className: "px-4 py-3 font-medium", children: "إجراءات" })
              ]
            })
          }),
          jsx("tbody", {
            className: "divide-y divide-white/5",
            children: items.map((item, index) => jsx(motion.tr, {
              initial: { opacity: 0, y: 6 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.16, delay: Math.min(index, 10) * 0.02 },
              className: previewItem?.id === item.id ? "bg-emerald-500/10" : "hover:bg-white/[0.03]",
              children: [
                jsxs("td", {
                  className: "px-4 py-3",
                  children: [
                    jsx("button", {
                      type: "button",
                      onClick: () => onPreview(item),
                      className: "line-clamp-2 text-right font-semibold leading-relaxed text-white hover:text-emerald-300",
                      children: item.title || "بدون عنوان"
                    }),
                    item.isFavorite && jsx("span", { className: "mt-1 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مفضلة" })
                  ]
                }),
                jsx("td", { className: "px-4 py-3 text-gray-400", children: [typeLabel(item), subtypeLabel(item)].filter(Boolean).join(" / ") || "غير مصنف" }),
                jsx("td", {
                  className: "px-4 py-3",
                  children: item.tags?.length ? jsx("div", {
                    className: "flex flex-wrap gap-1.5",
                    children: item.tags.slice(0, 4).map((tag) => jsx("span", {
                      className: "rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
                      children: tag
                    }, tag))
                  }) : jsx("span", { className: "text-gray-600", children: "—" })
                }),
                jsx("td", { className: "px-4 py-3 text-xs text-gray-500", children: item.updatedAt ? formatDateTime(item.updatedAt) : "—" }),
                jsx("td", {
                  className: "px-4 py-3",
                  children: jsxs("div", {
                    className: "flex flex-wrap gap-2",
                    children: [
                      jsx("button", { type: "button", onClick: () => onOpen(item), className: "rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600", children: "فتح" }),
                      !showDeleted && jsx("button", { type: "button", onClick: () => onFavorite(item), className: "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5", children: item.isFavorite ? "إزالة" : "مفضلة" }),
                      showDeleted ? jsx("button", { type: "button", onClick: () => onRestore(item), className: "rounded-lg border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/10", children: "استعادة" }) : jsx("button", { type: "button", onClick: () => onDelete(item), className: "rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/10", children: "حذف" })
                    ]
                  })
                })
              ]
            }, item.id))
          })
        ]
      })
    })
  });
}

function PreviewPanel({ item, typeLabel, subtypeLabel, onOpen }) {
  if (!item) {
    return jsxs("aside", {
      className: "rounded-2xl border border-dashed border-white/10 bg-gray-950/35 p-5 text-center text-gray-500 xl:sticky xl:top-4",
      children: [
        jsx(Video, { className: "mx-auto h-10 w-10" }),
        jsx("p", { className: "mt-3 text-sm font-medium text-gray-300", children: "اختر بطاقة للمعاينة" }),
        jsx("p", { className: "mt-1 text-xs leading-relaxed", children: "ستظهر تفاصيل مختصرة وتشغيل HTML5 إذا كان المسار قابلاً للمعاينة داخل المتصفح." })
      ]
    });
  }

  const source = getHtml5VideoPreviewSource(item.path || item.filePath || item.url || "");
  return jsxs("aside", {
    className: "h-fit rounded-2xl border border-white/10 bg-gray-900/55 p-4 text-right backdrop-blur-sm xl:sticky xl:top-4",
    dir: "rtl",
    children: [
      jsx("div", {
        className: "overflow-hidden rounded-xl border border-white/10 bg-gray-950",
        children: source ? jsx("video", {
          className: "aspect-video w-full bg-black",
          src: source,
          controls: true,
          preload: "metadata"
        }) : jsx("div", {
          className: "flex aspect-video items-center justify-center text-gray-500",
          children: isHtml5PreviewableVideo(item.path || "") ? "تعذر بناء رابط المعاينة" : "لا توجد معاينة HTML5 لهذا المسار"
        })
      }),
      jsx("h3", { className: "mt-4 text-lg font-bold leading-relaxed text-white", children: item.title || "بدون عنوان" }),
      jsx("p", { className: "mt-1 text-sm text-gray-500", children: [typeLabel, subtypeLabel].filter(Boolean).join(" / ") || "غير مصنف" }),
      item.notes && jsx("p", { className: "mt-3 line-clamp-4 text-sm leading-relaxed text-gray-400", children: item.notes }),
      item.tags?.length > 0 && jsxs("div", {
        className: "mt-4 flex flex-wrap gap-1.5",
        children: item.tags.map((tag) => jsx("span", {
          className: "rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
          children: tag
        }, tag))
      }),
      jsx("button", {
        type: "button",
        onClick: onOpen,
        className: "mt-4 w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600",
        children: "فتح صفحة التفاصيل"
      })
    ]
  });
}

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

  const initialRouteState = legacyReact.useMemo(() => parseArchiveRouteParams(parseAppRoute().params), []);
  const [localSearch, setLocalSearch] = legacyReact.useState(initialRouteState.searchQuery || searchQuery || "");
  const [sortField, setSortField] = legacyReact.useState(initialRouteState.sortField || "updatedAt");
  const [sortDirection, setSortDirection] = legacyReact.useState(initialRouteState.sortDirection || "desc");
  const [showDeleted, setShowDeleted] = legacyReact.useState(initialRouteState.showDeleted || false);
  const [showFavoritesOnly, setShowFavoritesOnly] = legacyReact.useState(initialRouteState.showFavoritesOnly || false);
  const [page, setPage] = legacyReact.useState(1);
  const [previewId, setPreviewId] = legacyReact.useState(null);
  const [showFileImportWizard, setShowFileImportWizard] = legacyReact.useState(initialRouteState.openImport || false);
  const activeViewMode = normalizeArchiveViewMode(viewMode || initialRouteState.viewMode || settings.defaultView || "grid");

  legacyReact.useEffect(() => {
    if (initialRouteState.searchQuery) setSearchQuery?.(initialRouteState.searchQuery);
    if (initialRouteState.filterType && initialRouteState.filterType !== filterType) setFilterType?.(initialRouteState.filterType);
    if (initialRouteState.filterSubtype && initialRouteState.filterSubtype !== filterSubtype) setFilterSubtype?.(initialRouteState.filterSubtype);
    if (initialRouteState.viewMode && initialRouteState.viewMode !== viewMode) setViewMode?.(initialRouteState.viewMode);
  }, []);

  legacyReact.useEffect(() => {
    const applyRouteFlags = () => {
      const nextRouteState = parseArchiveRouteParams(parseAppRoute().params);
      if (nextRouteState.openImport) setShowFileImportWizard(true);
      if (nextRouteState.viewMode && nextRouteState.viewMode !== viewMode) setViewMode?.(nextRouteState.viewMode);
    };
    window.addEventListener("hashchange", applyRouteFlags);
    window.addEventListener("popstate", applyRouteFlags);
    return () => {
      window.removeEventListener("hashchange", applyRouteFlags);
      window.removeEventListener("popstate", applyRouteFlags);
    };
  }, [setViewMode, viewMode]);

  legacyReact.useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery?.(localSearch);
      if (localSearch.trim()) addRecentSearch?.(localSearch.trim());
    }, 120);
    return () => window.clearTimeout(handle);
  }, [addRecentSearch, localSearch, setSearchQuery]);

  const filteredItems = legacyReact.useMemo(() => getFilteredArchiveItems({
    videoItems,
    filterType,
    filterSubtype,
    searchQuery: localSearch,
    sortField,
    sortDirection,
    showDeleted,
    showFavoritesOnly
  }), [filterType, filterSubtype, localSearch, showDeleted, showFavoritesOnly, sortDirection, sortField, videoItems]);

  legacyReact.useEffect(() => {
    const params = createArchiveRouteParams({
      searchQuery: localSearch,
      filterType,
      filterSubtype,
      showDeleted,
      showFavoritesOnly,
      sortField,
      sortDirection,
      viewMode: activeViewMode,
      openImport: showFileImportWizard
    });
    writeAppRoute("archive", { params }, settings, true);
    setPage(1);
  }, [activeViewMode, filterType, filterSubtype, localSearch, settings, showDeleted, showFavoritesOnly, showFileImportWizard, sortDirection, sortField]);

  const typeById = legacyReact.useMemo(() => new Map(contentTypes.map((type) => [type.id, type])), [contentTypes]);
  const activeType = typeById.get(filterType);
  const subtypes = activeType?.subtypes || [];
  const perPage = 24;
  const visibleItems = filteredItems.slice(0, page * perPage);
  const previewItem = filteredItems.find((item) => item.id === previewId) || visibleItems[0] || null;
  const activeFilterCount = getArchiveActiveFilterCount({ searchQuery: localSearch, filterType, filterSubtype, showDeleted, showFavoritesOnly });
  const hasFilters = hasArchiveContentFilters({ searchQuery: localSearch, filterType, filterSubtype, showFavoritesOnly });

  const resetFilters = () => {
    setLocalSearch("");
    setFilterType?.("all");
    setFilterSubtype?.("all");
    setShowDeleted(false);
    setShowFavoritesOnly(false);
    setSortField("updatedAt");
    setSortDirection("desc");
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
        onPreview: (item) => setPreviewId(item.id),
        onOpen: openItem,
        onFavorite: (item) => toggleFavorite?.(item.id),
        onDelete: confirmDelete,
        onRestore: (item) => restoreVideoItem?.(item.id)
      });
    }
    return jsx("div", {
      className: "grid gap-4 sm:grid-cols-2 2xl:grid-cols-3",
      children: visibleItems.map((item, index) => jsx(AnimatedItem, {
        index,
        children: jsx(VideoCard, itemActions(item))
      }, item.id))
    });
  };

  return jsxs("div", {
    className: "space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", {
        className: "rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10",
        children: [
          jsxs("div", {
            className: "flex flex-wrap items-start justify-between gap-4",
            children: [
              jsxs("div", {
                className: "min-w-0",
                children: [
                  jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Archive, { className: "h-6 w-6 text-emerald-400" }), "الأرشيف"] }),
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
                    className: "inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600",
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
          jsx(ArchiveMetric, { label: "النتائج الحالية", value: formatNumber(filteredItems.length), hint: getArchiveResultRangeText({ total: filteredItems.length, page, itemsPerPage: perPage }) }),
          jsx(ArchiveMetric, { label: "كل العناصر", value: formatNumber(videoItems.length), hint: `${formatNumber(videoItems.filter((item) => !item.isDeleted).length)} نشط` }),
          jsx(ArchiveMetric, { label: "الفلاتر", value: formatNumber(activeFilterCount), hint: activeFilterCount ? "فلاتر مطبقة" : "بدون فلاتر" }),
          jsx(ArchiveMetric, { label: "قابل للمعاينة", value: formatNumber(filteredItems.filter((item) => isHtml5PreviewableVideo(item.path || item.filePath || item.url || "")).length), hint: "HTML5 داخل التطبيق" })
        ]
      }),
      jsxs("section", {
        className: "rounded-2xl border border-white/10 bg-gray-900/50 p-4 text-right backdrop-blur-sm",
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
                className: "inline-flex min-h-10 overflow-hidden rounded-xl border border-white/10 bg-gray-950/35 p-1",
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
            className: "rounded-2xl border border-dashed border-white/10 bg-gray-950/35 p-8 text-center",
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
              renderArchiveItems(),
              visibleItems.length < filteredItems.length && jsx("button", {
                type: "button",
                onClick: () => setPage((value) => value + 1),
                className: "w-full rounded-xl border border-white/10 bg-gray-950/35 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5",
                children: `عرض المزيد (${formatNumber(filteredItems.length - visibleItems.length)} متبقية)`
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
