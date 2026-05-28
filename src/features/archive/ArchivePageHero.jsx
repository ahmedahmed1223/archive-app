import {
  Archive,
  CheckSquare,
  FolderOpen,
  LayoutGrid,
  RefreshCw,
  Rows3,
  Search,
  Tags,
  Trash2,
  Upload,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

import { PageHero } from "../../components/ui/V1Primitives.jsx";
import { KbdHint } from "../../components/common/Kbd.jsx";
import { formatNumber } from "../../utils/formatting.js";
import { isHtml5PreviewableVideo } from "./mediaPreview.js";
import { ArchiveSortMenu } from "./ArchiveToolbar.jsx";
import { ColumnManagerMenu } from "./ColumnManagerMenu.jsx";
import {
  ARCHIVE_ITEM_SIZE_OPTIONS,
  ARCHIVE_PAGE_SIZE_OPTIONS,
  SegmentedControl,
  ToolbarButton
} from "./ArchiveViews.jsx";

const ARCHIVE_GRID_ROW_OPTIONS = [2, 3, 4, 6];

function CompactStat({ label, value, hint }) {
  return jsxs("span", {
    className: "inline-flex min-h-9 items-center gap-2 va-surface-muted rounded-xl border px-3 py-1.5 text-xs text-gray-400",
    children: [
      jsx("span", { className: "text-gray-500", children: label }),
      jsx("strong", { className: "text-sm text-white", children: value }),
      hint && jsx("span", { className: "hidden text-gray-600 sm:inline", children: hint })
    ]
  });
}

const VIEW_MODE_BUTTONS = [
  { id: "grid", label: "شبكة", Icon: LayoutGrid },
  { id: "tiles", label: "بلاطات", Icon: Rows3 },
  { id: "list", label: "قائمة", Icon: Archive },
  { id: "table", label: "تفاصيل", Icon: FolderOpen }
];

/**
 * The top hero band of the archive page — search bar, view-mode
 * switcher, item-size, columns/rows/page-size controls, quick stats,
 * sort, mode toggle (quick/detailed). Lives on its own because the
 * markup is dense and was responsible for ~200 lines of the original
 * ArchivePage.jsx.
 */
export function ArchivePageHero(props) {
  const {
    activeTopMode,
    activeViewMode,
    activeItemSize,
    activeGridRows,
    gridColumns,
    gridColumnCount,
    localSearch,
    setLocalSearch,
    quickSearchMatches,
    setPage,
    setPreviewId,
    listPageSize,
    activePageSize,
    rangeText,
    filteredItems,
    videoItems,
    activeFilterCount,
    showFavoritesOnly,
    setShowFavoritesOnly,
    showDeleted,
    setShowDeleted,
    bulkMode,
    setBulkMode,
    clearSelection,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    hasFilters,
    resetFilters,
    tableColumns,
    changeTableColumns,
    changeTopMode,
    changeViewMode,
    changeItemSize,
    changeGridColumns,
    changeGridRows,
    changePageSize,
    openImport,
    openAdd
  } = props;

  return jsx(PageHero, {
    icon: jsx(Archive, { className: "h-6 w-6 text-emerald-400" }),
    title: "الأرشيف",
    description: "بحث سريع وفلاتر عند الطلب، مع تحكم مباشر بحجم البطاقات وعدد الصفوف.",
    compact: true,
    actions: jsxs(React.Fragment, {
      children: [
        jsxs("div", {
          className: "va-control-surface inline-flex min-h-9 overflow-hidden va-surface-muted rounded-xl border p-1",
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
        jsxs("button", {
          type: "button",
          onClick: openAdd,
          className: "va-primary-button inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-white",
          title: "إضافة فيديو — اختصار A",
          children: [
            jsx(Video, { className: "h-4 w-4" }),
            "إضافة فيديو",
            jsx(KbdHint, { keys: ["A"], className: "opacity-80" })
          ]
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
                "aria-label": "بحث في الأرشيف",
                className: "min-h-10 w-full va-surface-deep rounded-xl border py-2 pl-3 pr-12 text-sm text-white outline-none focus:border-emerald-500/50"
              }),
              jsx("span", {
                className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2",
                children: jsx(KbdHint, { keys: ["/"], className: "opacity-70" })
              })
            ]
          }),
          jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: [
              jsx("div", {
                className: "va-control-surface inline-flex min-h-9 overflow-hidden va-surface-muted rounded-xl border p-1",
                role: "group",
                "aria-label": "وضع عرض الأرشيف",
                children: VIEW_MODE_BUTTONS.map(({ id, label, Icon }) => jsxs("button", {
                  type: "button",
                  onClick: () => changeViewMode(id),
                  "aria-pressed": activeViewMode === id,
                  className: `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${activeViewMode === id ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                  children: [jsx(Icon, { className: "h-3.5 w-3.5" }), label]
                }, id))
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
                    label: "الأعمدة",
                    value: gridColumns,
                    options: [
                      { value: "auto", label: "تلقائي" },
                      { value: 2, label: "٢" },
                      { value: 3, label: "٣" },
                      { value: 4, label: "٤" },
                      { value: 5, label: "٥" },
                      { value: 6, label: "٦" },
                      { value: 8, label: "٨" }
                    ],
                    onChange: changeGridColumns
                  }),
                  jsxs("label", {
                    className: "inline-flex min-h-9 items-center gap-2 va-surface-muted rounded-xl border px-2.5 py-1 text-xs text-gray-400",
                    title: "اختر بين 1 و8 أعمدة، أو اتركه تلقائيًا",
                    children: [
                      jsx("span", { className: "text-gray-500", children: "أعمدة" }),
                      jsx("input", {
                        type: "number",
                        min: 1,
                        max: 8,
                        value: gridColumns === "auto" ? "" : gridColumns,
                        placeholder: "تلقائي",
                        onChange: (event) => changeGridColumns(event.target.value === "" ? "auto" : event.target.value),
                        "aria-label": "عدد الأعمدة المخصص",
                        className: "min-h-7 w-16 rounded-lg border border-white/10 bg-gray-950/55 px-2 text-center text-xs font-semibold text-white outline-none focus:border-emerald-500/50"
                      })
                    ]
                  }),
                  jsx(SegmentedControl, {
                    label: "الصفوف",
                    value: activeGridRows,
                    options: ARCHIVE_GRID_ROW_OPTIONS.map((value) => ({ value, label: `${formatNumber(value)}` })),
                    onChange: changeGridRows
                  })
                ]
              }) : jsxs("div", {
                className: "inline-flex flex-wrap items-center gap-2",
                children: [
                  activeViewMode === "table" && jsx(ColumnManagerMenu, {
                    stored: tableColumns,
                    onChange: changeTableColumns
                  }),
                  jsxs("label", {
                    className: "inline-flex min-h-9 items-center gap-2 va-surface-muted rounded-xl border px-2.5 py-1 text-xs text-gray-400",
                    children: [
                      jsx("span", { className: "text-gray-500", children: "في الصفحة" }),
                      jsxs("select", {
                        value: listPageSize,
                        onChange: (event) => changePageSize(event.target.value),
                        "aria-label": "عدد العناصر في الصفحة",
                        className: "min-h-7 rounded-lg border-0 bg-transparent px-1 text-xs font-semibold text-white outline-none",
                        children: ARCHIVE_PAGE_SIZE_OPTIONS.map((option) => jsx("option", { value: option, children: formatNumber(option) }, option))
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),
      quickSearchMatches.length > 0 && jsxs("div", {
        className: "mt-2 rounded-xl va-surface-subtle border p-2",
        children: [
          jsx("p", { className: "mb-1 text-xs font-semibold text-gray-500", children: "نتائج سريعة" }),
          jsx("div", {
            className: "grid gap-2 md:grid-cols-2 xl:grid-cols-5",
            children: quickSearchMatches.map((item) => jsxs("button", {
              type: "button",
              onClick: () => {
                setPage(1);
                setPreviewId(item.id);
              },
              className: "va-action-card min-w-0 rounded-xl va-surface-subtle border px-3 py-2 text-right hover:border-emerald-500/25",
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
          jsx(ToolbarButton, {
            active: bulkMode,
            onClick: () => {
              setBulkMode((value) => {
                if (value) clearSelection?.();
                return !value;
              });
            },
            icon: jsx(CheckSquare, { className: "h-4 w-4" }),
            children: bulkMode ? "إنهاء التحديد" : "تحديد متعدد"
          }),
          jsx(ArchiveSortMenu, {
            sortField,
            sortDirection,
            onChange: ({ sortField: nextField, sortDirection: nextDirection }) => {
              setSortField(nextField);
              setSortDirection(nextDirection);
            }
          }),
          (hasFilters || showDeleted) && jsx(ToolbarButton, { onClick: resetFilters, icon: jsx(RefreshCw, { className: "h-4 w-4" }), children: "مسح" })
        ]
      })
    ]
  });
}

export default ArchivePageHero;
