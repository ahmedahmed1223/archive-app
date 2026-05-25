import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Upload
} from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";

import { formatNumber } from "../../utils/formatting.js";

const tabIconMap = {
  export: Download,
  import: Upload,
  transfer: RefreshCw,
  backup: HardDrive
};

const sourceTypeLabels = {
  json: "ملف JSON",
  excel: "ملف Excel صادر من التطبيق",
  transfer: "ملف نقل بين الأجهزة"
};

export function PageCard({ children, className = "" }) {
  return jsx("section", {
    className: `va-card rounded-2xl border border-white/10 bg-gray-900/50 p-5 text-right backdrop-blur-sm ${className}`,
    dir: "rtl",
    children
  });
}

export function DataMetric({ label, value, hint, icon }) {
  return jsxs(PageCard, {
    className: "va-metric-card min-h-[116px]",
    children: [
      jsxs("div", {
        className: "flex items-start justify-between gap-3",
        children: [
          jsxs("div", {
            className: "min-w-0",
            children: [
              jsx("p", { className: "text-sm text-gray-400", children: label }),
              jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: value }),
              hint && jsx("p", { className: "mt-2 text-xs leading-relaxed text-gray-500", children: hint })
            ]
          }),
          jsx("span", {
            className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
            children: icon
          })
        ]
      })
    ]
  });
}

export function TabButton({ tab, active, onClick }) {
  const Icon = tabIconMap[tab.id] || Database;
  return jsxs("button", {
    type: "button",
    role: "tab",
    "aria-selected": active,
    onClick,
    className: `va-tool-button flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-right text-sm transition-colors ${
      active
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
        : "border-white/5 bg-gray-900/40 text-gray-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
    }`,
    children: [
      jsx(Icon, { className: "h-4 w-4 shrink-0" }),
      jsx("span", { className: "min-w-0 truncate", children: tab.label })
    ]
  });
}

export function SegmentedButton({ active, children, onClick, danger = false }) {
  return jsx("button", {
    type: "button",
    onClick,
    "aria-pressed": active,
    className: `va-tool-button min-h-10 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? danger
          ? "border-red-500/40 bg-red-500/15 text-red-100"
          : "border-emerald-500/35 bg-emerald-500/15 text-emerald-100"
        : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5 hover:text-white"
    }`,
    children
  });
}

export function ActionButton({ children, icon, onClick, disabled = false, tone = "emerald" }) {
  const toneClass = tone === "amber"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
    : tone === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
      : "va-primary-button text-white";
  return jsxs("button", {
    type: "button",
    onClick,
    disabled,
    className: `va-action-button inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`,
    children: [
      icon,
      children
    ]
  });
}

export function SummaryGrid({ rows }) {
  return jsx("div", {
    className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
    children: rows.map((item) => jsxs("div", {
      className: "va-card-subtle rounded-xl border border-white/5 bg-gray-950/35 p-3",
      children: [
        jsx("p", { className: "text-xs text-gray-500", children: item.label }),
        jsx("p", { className: "mt-1 text-sm font-semibold text-gray-100", children: String(item.value) })
      ]
    }, item.label))
  });
}

export function PreviewSummary({ preview }) {
  if (!preview) return null;
  const visibleEntities = preview.summary.entities.filter((entity) => entity.total > 0 || entity.conflictCount > 0 || entity.potentialDuplicateCount > 0);
  return jsxs("div", {
    className: "space-y-3",
    children: [
      jsxs("div", {
        className: "rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4",
        children: [
          jsx("p", { className: "text-sm font-semibold text-emerald-100", children: "تمت قراءة الملف بنجاح" }),
          jsxs("p", {
            className: "mt-1 text-xs leading-relaxed text-emerald-200/80",
            children: [
              preview.fileName,
              " - ",
              sourceTypeLabels[preview.sourceType] || "ملف بيانات",
              preview.packageInfo?.checksum ? ` - checksum ${String(preview.packageInfo.checksum).slice(0, 16)}...` : ""
            ]
          })
        ]
      }),
      jsx("div", {
        className: "grid gap-2 sm:grid-cols-2",
        children: [
          ["كل السجلات", preview.summary.totals.records],
          ["جديد", preview.summary.totals.newCount],
          ["مكرر", preview.summary.totals.duplicateCount],
          ["متعارض", preview.summary.totals.conflictCount]
        ].map(([label, value]) => jsxs("div", {
          className: "rounded-xl border border-white/5 bg-gray-950/35 p-3",
          children: [
            jsx("p", { className: "text-xs text-gray-500", children: label }),
            jsx("p", { className: "mt-1 text-xl font-bold text-white", children: formatNumber(value) })
          ]
        }, label))
      }),
      visibleEntities.length > 0 && jsx("div", {
        className: "max-h-[260px] overflow-auto rounded-xl border border-white/5",
        children: visibleEntities.map((entity) => jsxs("div", {
          className: "grid gap-2 border-b border-white/5 bg-gray-950/25 p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]",
          children: [
            jsx("span", { className: "font-medium text-gray-200", children: entity.label }),
            jsx("span", {
              className: "text-gray-400",
              children: `الإجمالي ${entity.total} | جديد ${entity.newCount} | مكرر ${entity.duplicateCount} | متعارض ${entity.conflictCount}`
            })
          ]
        }, entity.key))
      })
    ]
  });
}
