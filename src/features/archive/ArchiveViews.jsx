import {
  Check,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  MoreHorizontal,
  RotateCcw,
  Square,
  Trash2,
  Video
} from "lucide-react";
import { motion } from "framer-motion";
import { jsx, jsxs } from "react/jsx-runtime";

import {
  getHtml5VideoPreviewSource,
  isHtml5PreviewableVideo
} from "./mediaPreview.js";
import {
  formatDateTime,
  formatFileSize,
  formatNumber
} from "../../utils/formatting.js";
import { normalizeLocalFileValue } from "../videos/viewModel.js";

function BulkCheckbox({ checked, onToggle, label }) {
  return jsx("button", {
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    "aria-label": label || (checked ? "إلغاء التحديد" : "تحديد"),
    onClick: (event) => {
      event.stopPropagation();
      event.preventDefault();
      onToggle?.(event);
    },
    className: `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${checked
      ? "border-[color-mix(in_srgb,var(--va-action)_60%,transparent)] bg-[color-mix(in_srgb,var(--va-action)_25%,transparent)] text-white"
      : "border-white/20 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"}`,
    children: checked ? jsx(Check, { className: "h-3.5 w-3.5" }) : jsx(Square, { className: "h-3.5 w-3.5 opacity-40" })
  });
}

export const ARCHIVE_ITEM_SIZE_OPTIONS = [
  { value: "compact", label: "صغير" },
  { value: "comfortable", label: "متوسط" },
  { value: "large", label: "كبير" }
];

export const ARCHIVE_PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export const ARCHIVE_GRID_CLASSES = {
  compact: "grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  comfortable: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4",
  large: "grid gap-4 lg:grid-cols-2 2xl:grid-cols-3"
};

const ARCHIVE_CARD_SIZE = {
  compact: {
    body: "space-y-1.5 p-2.5",
    footer: "gap-1.5 p-2",
    title: "line-clamp-2 text-xs",
    meta: "text-[11px]",
    button: "min-h-7 px-2 py-0.5 text-[11px]",
    tags: 2
  },
  comfortable: {
    body: "space-y-3 p-4",
    footer: "gap-2 p-3",
    title: "line-clamp-2 text-sm",
    meta: "text-xs",
    button: "min-h-9 px-3 py-1.5 text-sm",
    tags: 3
  },
  large: {
    body: "space-y-4 p-5",
    footer: "gap-2.5 p-4",
    title: "line-clamp-2 text-base",
    meta: "text-sm",
    button: "min-h-10 px-4 py-2 text-sm",
    tags: 6
  }
};

const ARCHIVE_LIST_SIZE = {
  compact: {
    article: "gap-2 p-2.5 sm:grid-cols-[132px_minmax(0,1fr)_auto]",
    title: "text-sm",
    meta: "text-xs",
    notes: "mt-1 line-clamp-1 text-xs leading-relaxed",
    tags: 3,
    actionColumn: "sm:w-28",
    actionButton: "min-h-8 px-2.5 py-1 text-xs"
  },
  comfortable: {
    article: "gap-3 p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]",
    title: "text-base",
    meta: "text-sm",
    notes: "mt-2 line-clamp-2 text-sm leading-relaxed",
    tags: 6,
    actionColumn: "sm:w-32",
    actionButton: "min-h-9 px-3 py-1.5 text-sm"
  },
  large: {
    article: "gap-4 p-4 sm:grid-cols-[220px_minmax(0,1fr)_auto]",
    title: "text-lg",
    meta: "text-sm",
    notes: "mt-3 line-clamp-3 text-sm leading-relaxed",
    tags: 8,
    actionColumn: "sm:w-36",
    actionButton: "min-h-10 px-4 py-2 text-sm"
  }
};

const ARCHIVE_TABLE_SIZE = {
  compact: { table: "min-w-[860px]", cell: "px-3 py-2", actionButton: "px-2.5 py-1 text-[11px]", tags: 3 },
  comfortable: { table: "min-w-[940px]", cell: "px-4 py-3", actionButton: "px-3 py-1.5 text-xs", tags: 4 },
  large: { table: "min-w-[1040px]", cell: "px-5 py-4", actionButton: "px-4 py-2 text-sm", tags: 6 }
};

export const ARCHIVE_ITEM_SIZE_LABELS = {
  compact: "صغير",
  comfortable: "متوسط",
  large: "كبير"
};

function getArchivePaginationSlots(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const slots = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) slots.push("start-ellipsis");
  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    slots.push(pageNumber);
  }
  if (end < totalPages - 1) slots.push("end-ellipsis");
  slots.push(totalPages);

  return slots;
}

export function ToolbarButton({ children, onClick, active = false, danger = false, icon }) {
  return jsxs("button", {
    type: "button",
    onClick,
    "aria-pressed": active,
    className: `va-tool-button inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
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

export function ArchiveMetric({ label, value, hint }) {
  return jsxs("div", {
    className: "va-metric-card rounded-xl va-surface-muted border p-2.5",
    children: [
      jsx("p", { className: "text-xs text-gray-500", children: label }),
      jsx("p", { className: "mt-1 text-base font-bold text-white", children: value }),
      hint && jsx("p", { className: "mt-1 text-xs text-gray-500", children: hint })
    ]
  });
}

export function ArchivePagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageSlots = getArchivePaginationSlots(currentPage, totalPages);
  const buttonBase = "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";

  return jsxs("nav", {
    className: "va-control-surface flex flex-wrap items-center justify-between gap-3 va-surface-muted rounded-2xl border p-3",
    dir: "rtl",
    "aria-label": "صفحات الأرشيف",
    children: [
      jsx("button", {
        type: "button",
        onClick: () => onPageChange(currentPage - 1),
        disabled: currentPage <= 1,
        className: `${buttonBase} border-white/10 text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40`,
        children: [jsx(ChevronRight, { className: "h-4 w-4" }), "السابق"]
      }),
      jsx("div", {
        className: "flex flex-wrap justify-center gap-1.5",
        children: pageSlots.map((slot) => typeof slot === "number" ? jsx("button", {
          type: "button",
          onClick: () => onPageChange(slot),
          className: `${buttonBase} ${slot === currentPage ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100" : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"}`,
          "aria-current": slot === currentPage ? "page" : undefined,
          children: formatNumber(slot)
        }, slot) : jsx("span", {
          className: "inline-flex min-h-9 min-w-9 items-center justify-center px-2 text-gray-600",
          children: jsx(MoreHorizontal, { className: "h-4 w-4" })
        }, slot))
      }),
      jsx("button", {
        type: "button",
        onClick: () => onPageChange(currentPage + 1),
        disabled: currentPage >= totalPages,
        className: `${buttonBase} border-white/10 text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40`,
        children: ["التالي", jsx(ChevronLeft, { className: "h-4 w-4" })]
      })
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

function getArchiveFileMeta(item = {}) {
  const localFile = normalizeLocalFileValue(item.metadata?.localFile || item.localFile);
  const path = localFile?.relativePath || localFile?.path || item.path || item.filePath || item.url || "";
  const name = localFile?.name || String(path || "").split(/[\\/]/).pop() || "";
  const extension = localFile?.extension || (name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "");
  return {
    localFile,
    path,
    name,
    extension,
    size: Number(localFile?.size || 0)
  };
}

function FileMetaStrip({ item, compact = false }) {
  const file = getArchiveFileMeta(item);
  if (!file.name && !file.path) return null;

  return jsxs("div", {
    className: `rounded-xl va-surface-muted border ${compact ? "px-2.5 py-2" : "px-3 py-2"}`,
    children: [
      jsxs("div", {
        className: "flex items-center gap-2 text-xs text-gray-400",
        children: [
          jsx(HardDrive, { className: "h-3.5 w-3.5 shrink-0 text-emerald-300" }),
          jsx("span", { className: "min-w-0 truncate font-medium text-gray-300", children: file.name || "ملف محلي" }),
          file.extension && jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase text-emerald-100", children: file.extension })
        ]
      }),
      file.size > 0 && jsx("p", { className: "mt-1 text-[11px] text-gray-600", children: formatFileSize(file.size) }),
      file.path && !compact && jsx("p", { className: "mt-1 truncate text-left text-[11px] text-gray-600", dir: "ltr", children: file.path })
    ]
  });
}

export function SegmentedControl({ label, value, options, onChange }) {
  return jsxs("div", {
    className: "flex flex-wrap items-center gap-2",
    children: [
      label && jsx("span", { className: "text-xs text-gray-500", children: label }),
      jsx("div", {
        className: "va-control-surface inline-flex min-h-9 overflow-hidden va-surface-muted rounded-xl border p-1",
        role: "group",
        "aria-label": label,
        children: options.map((option) => jsx("button", {
          type: "button",
          onClick: () => onChange(option.value),
          "aria-pressed": value === option.value,
          className: `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors ${value === option.value ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
          children: [option.icon, option.label]
        }, option.value))
      })
    ]
  });
}

export function VideoCard({ item, typeLabel, subtypeLabel, selected, onPreview, onOpen, onFavorite, onDelete, onRestore, showDeleted, itemSize = "comfortable", bulkMode = false, bulkSelected = false, onBulkToggle }) {
  const size = ARCHIVE_CARD_SIZE[itemSize] || ARCHIVE_CARD_SIZE.comfortable;
  const highlight = bulkMode ? bulkSelected : selected;
  const handleCardClick = bulkMode ? () => onBulkToggle?.() : onPreview;
  return jsxs("article", {
    className: `va-video-card ${highlight ? "va-video-card-selected" : ""} group relative overflow-hidden rounded-2xl border bg-gray-900/45 text-right transition-colors ${
      highlight ? "border-[color-mix(in_srgb,var(--va-action)_55%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--va-action)_30%,transparent)]" : "border-white/10 hover:border-[color-mix(in_srgb,var(--va-action)_30%,transparent)]"
    }`,
    dir: "rtl",
    children: [
      bulkMode && jsx("div", {
        className: "absolute right-2 top-2 z-10",
        children: jsx(BulkCheckbox, { checked: bulkSelected, onToggle: onBulkToggle, label: `تحديد ${item.title || "فيديو"}` })
      }),
      jsxs("button", {
        type: "button",
        onClick: handleCardClick,
        className: "block w-full text-right",
        children: [
          jsx("div", { className: "aspect-video overflow-hidden border-b border-white/5 bg-gray-950", children: jsx(VideoThumb, { item }) }),
          jsxs("div", {
            className: size.body,
            children: [
              jsxs("div", {
                className: "flex items-start justify-between gap-3",
                children: [
                  jsxs("div", {
                    className: "min-w-0",
                    children: [
                      jsx("h3", { className: `${size.title} font-bold leading-relaxed text-white`, children: item.title || "بدون عنوان" }),
                      jsx("p", { className: `mt-1 truncate ${size.meta} text-gray-500`, children: [typeLabel, subtypeLabel].filter(Boolean).join(" / ") || "غير مصنف" })
                    ]
                  }),
                  item.isFavorite && jsx("span", { className: "rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مفضلة" })
                ]
              }),
              item.tags?.length > 0 && jsxs("div", {
                className: "flex flex-wrap gap-1.5",
                children: item.tags.slice(0, size.tags).map((tag) => jsx("span", {
                  className: "va-chip rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
                  children: tag
                }, tag))
              }),
              jsx(FileMetaStrip, { item, compact: itemSize === "compact" }),
              jsx("p", { className: `${size.meta} text-gray-600`, children: item.updatedAt ? formatDateTime(item.updatedAt) : "لم يسجل تحديث" })
            ]
          })
        ]
      }),
      jsxs("div", {
        className: `flex flex-wrap items-center border-t border-white/5 ${size.footer}`,
        children: [
          jsx("button", {
            type: "button",
            onClick: onOpen,
            className: `va-primary-button ${size.button} rounded-lg font-semibold text-white `,
            children: "فتح التفاصيل"
          }),
          !showDeleted && jsx("button", {
            type: "button",
            onClick: onFavorite,
            className: `${size.button} rounded-lg border border-white/10 text-gray-300 hover:bg-white/5`,
            children: item.isFavorite ? "إزالة المفضلة" : "مفضلة"
          }),
          showDeleted ? jsx("button", {
            type: "button",
            onClick: onRestore,
            className: `inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 text-emerald-100 hover:bg-emerald-500/10 ${size.button}`,
            children: [jsx(RotateCcw, { className: "h-4 w-4" }), "استعادة"]
          }) : jsx("button", {
            type: "button",
            onClick: onDelete,
            className: `inline-flex items-center gap-2 rounded-lg border border-red-500/20 text-red-100 hover:bg-red-500/10 ${size.button}`,
            children: [jsx(Trash2, { className: "h-4 w-4" }), "حذف"]
          })
        ]
      })
    ]
  });
}

export function AnimatedItem({ index, children, as = "div", className = "" }) {
  const Component = motion[as] || motion.div;
  return jsx(Component, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    className,
    children
  });
}

export function VideoListItem({ item, typeLabel, subtypeLabel, selected, onPreview, onOpen, onFavorite, onDelete, onRestore, showDeleted, itemSize = "comfortable", bulkMode = false, bulkSelected = false, onBulkToggle }) {
  const size = ARCHIVE_LIST_SIZE[itemSize] || ARCHIVE_LIST_SIZE.comfortable;
  const highlight = bulkMode ? bulkSelected : selected;
  const handlePreview = bulkMode ? () => onBulkToggle?.() : onPreview;

  return jsxs("article", {
    className: `va-video-list-item ${highlight ? "va-video-list-item-selected" : ""} group relative grid rounded-2xl border bg-gray-900/45 text-right transition-colors ${size.article} ${
      highlight ? "border-[color-mix(in_srgb,var(--va-action)_55%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--va-action)_30%,transparent)]" : "border-white/10 hover:border-[color-mix(in_srgb,var(--va-action)_30%,transparent)]"
    }`,
    dir: "rtl",
    children: [
      bulkMode && jsx("div", {
        className: "absolute right-3 top-3 z-10",
        children: jsx(BulkCheckbox, { checked: bulkSelected, onToggle: onBulkToggle, label: `تحديد ${item.title || "فيديو"}` })
      }),
      jsx("button", {
        type: "button",
        onClick: handlePreview,
        className: "overflow-hidden rounded-xl border border-white/10 bg-gray-950 text-right",
        children: jsx("div", { className: "aspect-video", children: jsx(VideoThumb, { item }) })
      }),
      jsxs("button", {
        type: "button",
        onClick: handlePreview,
        className: "min-w-0 text-right",
        children: [
          jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: [
              jsx("h3", { className: `line-clamp-2 ${size.title} font-bold leading-relaxed text-white`, children: item.title || "بدون عنوان" }),
              item.isFavorite && jsx("span", { className: "rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مفضلة" })
            ]
          }),
          jsx("p", { className: `mt-1 ${size.meta} text-gray-500`, children: [typeLabel, subtypeLabel].filter(Boolean).join(" / ") || "غير مصنف" }),
          item.notes && jsx("p", { className: `${size.notes} text-gray-400`, children: item.notes }),
          item.tags?.length > 0 && jsx("div", {
            className: "mt-3 flex flex-wrap gap-1.5",
            children: item.tags.slice(0, size.tags).map((tag) => jsx("span", {
              className: "va-chip rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
              children: tag
            }, tag))
          }),
          jsx("div", { className: "mt-3", children: jsx(FileMetaStrip, { item, compact: itemSize === "compact" }) }),
          jsx("p", { className: "mt-3 text-xs text-gray-600", children: item.updatedAt ? formatDateTime(item.updatedAt) : "لم يسجل تحديث" })
        ]
      }),
      jsxs("div", {
        className: `flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch ${size.actionColumn}`,
        children: [
          jsx("button", {
            type: "button",
            onClick: onOpen,
            className: `va-primary-button ${size.actionButton} rounded-lg font-semibold text-white `,
            children: "التفاصيل"
          }),
          !showDeleted && jsx("button", {
            type: "button",
            onClick: onFavorite,
            className: `${size.actionButton} rounded-lg border border-white/10 text-gray-300 hover:bg-white/5`,
            children: item.isFavorite ? "إزالة" : "مفضلة"
          }),
          showDeleted ? jsx("button", {
            type: "button",
            onClick: onRestore,
            className: `${size.actionButton} rounded-lg border border-emerald-500/20 text-emerald-100 hover:bg-emerald-500/10`,
            children: "استعادة"
          }) : jsx("button", {
            type: "button",
            onClick: onDelete,
            className: `${size.actionButton} rounded-lg border border-red-500/20 text-red-100 hover:bg-red-500/10`,
            children: "حذف"
          })
        ]
      })
    ]
  });
}

export function VideoTableView({ items, previewItem, typeLabel, subtypeLabel, showDeleted, onPreview, onOpen, onFavorite, onDelete, onRestore, itemSize = "comfortable", bulkMode = false, isSelected, onBulkToggle, allSelected, onSelectAll }) {
  const size = ARCHIVE_TABLE_SIZE[itemSize] || ARCHIVE_TABLE_SIZE.comfortable;

  return jsx("div", {
    className: "va-card overflow-hidden rounded-2xl va-surface-muted border",
    dir: "rtl",
    children: jsx("div", {
      className: "overflow-x-auto",
      children: jsxs("table", {
        className: `${size.table} w-full text-right text-sm`,
        children: [
          jsx("thead", {
            className: "border-b border-white/10 bg-gray-950/45 text-xs text-gray-500",
            children: jsxs("tr", {
              children: [
                bulkMode && jsx("th", {
                  className: `${size.cell} w-10 font-medium`,
                  children: jsx(BulkCheckbox, { checked: !!allSelected, onToggle: () => onSelectAll?.(), label: allSelected ? "إلغاء الكل" : "تحديد الكل" })
                }),
                jsx("th", { className: `${size.cell} font-medium`, children: "العنوان" }),
                jsx("th", { className: `${size.cell} font-medium`, children: "النوع" }),
                jsx("th", { className: `${size.cell} font-medium`, children: "الملف" }),
                jsx("th", { className: `${size.cell} font-medium`, children: "الوسوم" }),
                jsx("th", { className: `${size.cell} font-medium`, children: "آخر تحديث" }),
                jsx("th", { className: `${size.cell} font-medium`, children: "إجراءات" })
              ]
            })
          }),
          jsx("tbody", {
            className: "divide-y divide-white/5",
            children: items.map((item, index) => {
              const selectedRow = bulkMode && isSelected?.(item.id);
              return jsxs(motion.tr, {
                initial: { opacity: 0, y: 6 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.16, delay: Math.min(index, 10) * 0.02 },
                className: selectedRow
                  ? "bg-[color-mix(in_srgb,var(--va-action)_14%,transparent)]"
                  : previewItem?.id === item.id ? "bg-emerald-500/10" : "hover:bg-white/[0.03]",
                children: [
                  bulkMode && jsx("td", {
                    className: size.cell,
                    children: jsx(BulkCheckbox, { checked: !!selectedRow, onToggle: () => onBulkToggle?.(item.id), label: `تحديد ${item.title || "فيديو"}` })
                  }),
                  jsxs("td", {
                    className: size.cell,
                    children: [
                      jsx("button", {
                        type: "button",
                        onClick: () => bulkMode ? onBulkToggle?.(item.id) : onPreview(item),
                        className: "line-clamp-2 text-right font-semibold leading-relaxed text-white hover:text-[color-mix(in_srgb,var(--va-action)_70%,#ffffff)]",
                        children: item.title || "بدون عنوان"
                      }),
                      item.isFavorite && jsx("span", { className: "mt-1 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مفضلة" })
                    ]
                  }),
                jsx("td", { className: `${size.cell} text-gray-400`, children: [typeLabel(item), subtypeLabel(item)].filter(Boolean).join(" / ") || "غير مصنف" }),
                jsx("td", { className: size.cell, children: jsx(FileMetaStrip, { item, compact: true }) }),
                jsx("td", {
                  className: size.cell,
                  children: item.tags?.length ? jsx("div", {
                    className: "flex flex-wrap gap-1.5",
                    children: item.tags.slice(0, size.tags).map((tag) => jsx("span", {
                      className: "va-chip rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
                      children: tag
                    }, tag))
                  }) : jsx("span", { className: "text-gray-600", children: "—" })
                }),
                jsx("td", { className: `${size.cell} text-xs text-gray-500`, children: item.updatedAt ? formatDateTime(item.updatedAt) : "—" }),
                jsx("td", {
                  className: size.cell,
                  children: jsxs("div", {
                    className: "flex flex-wrap gap-2",
                    children: [
                      jsx("button", { type: "button", onClick: () => onOpen(item), className: `va-primary-button rounded-lg font-semibold text-white  ${size.actionButton}`, children: "فتح" }),
                      !showDeleted && jsx("button", { type: "button", onClick: () => onFavorite(item), className: `rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 ${size.actionButton}`, children: item.isFavorite ? "إزالة" : "مفضلة" }),
                      showDeleted ? jsx("button", { type: "button", onClick: () => onRestore(item), className: `rounded-lg border border-emerald-500/20 text-emerald-100 hover:bg-emerald-500/10 ${size.actionButton}`, children: "استعادة" }) : jsx("button", { type: "button", onClick: () => onDelete(item), className: `rounded-lg border border-red-500/20 text-red-100 hover:bg-red-500/10 ${size.actionButton}`, children: "حذف" })
                    ]
                  })
                })
              ]
              }, item.id);
            })
          })
        ]
      })
    })
  });
}

export function PreviewPanel({ item, typeLabel, subtypeLabel, onOpen }) {
  if (!item) {
    return jsxs("aside", {
      className: "va-preview-panel rounded-2xl border border-dashed border-white/10 bg-gray-950/35 p-5 text-center text-gray-500 xl:sticky xl:top-4",
      children: [
        jsx(Video, { className: "mx-auto h-10 w-10" }),
        jsx("p", { className: "mt-3 text-sm font-medium text-gray-300", children: "اختر بطاقة للمعاينة" }),
        jsx("p", { className: "mt-1 text-xs leading-relaxed", children: "ستظهر تفاصيل مختصرة وتشغيل HTML5 إذا كان المسار قابلاً للمعاينة داخل المتصفح." })
      ]
    });
  }

  const source = getHtml5VideoPreviewSource(item.path || item.filePath || item.url || "");
  const file = getArchiveFileMeta(item);
  return jsxs("aside", {
    className: "va-preview-panel h-fit rounded-2xl border border-white/10 bg-gray-900/55 p-4 text-right backdrop-blur-sm xl:sticky xl:top-4",
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
      (file.name || file.path) && jsxs("div", {
        className: "mt-4 va-surface-muted rounded-xl border p-3",
        children: [
          jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-gray-200", children: [jsx(HardDrive, { className: "h-4 w-4 text-emerald-300" }), file.name || "ملف محلي"] }),
          file.size > 0 && jsx("p", { className: "mt-1 text-xs text-gray-600", children: formatFileSize(file.size) }),
          file.path && jsx("p", { className: "mt-2 break-all text-left text-xs text-gray-600", dir: "ltr", children: file.path })
        ]
      }),
      item.notes && jsx("p", { className: "mt-3 line-clamp-4 text-sm leading-relaxed text-gray-400", children: item.notes }),
      item.tags?.length > 0 && jsxs("div", {
        className: "mt-4 flex flex-wrap gap-1.5",
        children: item.tags.map((tag) => jsx("span", {
          className: "va-chip rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
          children: tag
        }, tag))
      }),
      jsx("button", {
        type: "button",
        onClick: onOpen,
        className: "va-primary-button mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white ",
        children: "فتح صفحة التفاصيل"
      })
    ]
  });
}
