import {
  useAppStore
} from "../stores/index.js";
import {
  ChartColumn,
  Database,
  Download,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  History,
  Users
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { XLSX } from "../vendor/xlsx.js";

import {
  downloadArchiveBlob
} from "../services/data-portability/index.js";
import { MotionPage, PageHero } from "../components/ui/index.js";
import {
  formatDateTime,
  formatFileSize,
  formatNumber
} from "../utils/formatting.js";

function ReportPanel({ children, className = "" }) {
  return jsx("section", {
    className: `va-card rounded-2xl va-surface-muted border p-5 text-right backdrop-blur-sm ${className}`,
    dir: "rtl",
    children
  });
}

function Kpi({ label, value, hint, icon, tone = "emerald" }) {
  const toneClass = tone === "amber" ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
    : tone === "cyan" ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
      : tone === "violet" ? "border-violet-500/20 bg-violet-500/10 text-violet-200"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  return jsxs(ReportPanel, {
    className: "min-h-[118px]",
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
            className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClass}`,
            children: icon
          })
        ]
      })
    ]
  });
}

function BarList({ items, maxValue, emptyTitle, emptyHint }) {
  if (!items.length) {
    return jsxs("div", {
      className: "rounded-xl border border-dashed border-white/10 bg-gray-950/30 p-6 text-center",
      children: [
        jsx(ChartColumn, { className: "mx-auto h-9 w-9 text-gray-500" }),
        jsx("p", { className: "mt-3 text-sm font-semibold text-gray-300", children: emptyTitle }),
        jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500", children: emptyHint })
      ]
    });
  }

  return jsx("div", {
    className: "space-y-3",
    children: items.map((item) => {
      const width = maxValue ? Math.max(6, Math.round(item.value / maxValue * 100)) : 0;
      return jsxs("div", {
        className: "space-y-1.5",
        children: [
          jsxs("div", {
            className: "flex items-center justify-between gap-3 text-sm",
            children: [
              jsx("span", { className: "truncate text-gray-300", children: item.label }),
              jsx("span", { className: "font-semibold text-gray-500", children: formatNumber(item.value) })
            ]
          }),
          jsx("div", {
            className: "va-progress-rtl h-2 overflow-hidden rounded-full bg-gray-800",
            children: jsx("div", {
              className: "h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400",
              style: { width: `${width}%` }
            })
          })
        ]
      }, item.id || item.label);
    })
  });
}

export function ReportsPage() {
  const {
    videoItems = [],
    contentTypes = [],
    auditLogs = [],
    virtualCollections = [],
    hierarchicalTags = [],
    vocabulary = [],
    users = [],
    settings = {},
    getStats
  } = useAppStore();

  const activeItems = videoItems.filter((item) => !item.isDeleted);
  const stats = typeof getStats === "function"
    ? getStats()
    : {
      total: activeItems.length,
      favorites: videoItems.filter((item) => item.isFavorite).length,
      deleted: videoItems.filter((item) => item.isDeleted).length
    };

  const typeDistribution = React.useMemo(() => contentTypes.map((type) => ({
    id: type.id,
    label: type.name || type.id,
    value: activeItems.filter((item) => item.type === type.id).length
  })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value), [activeItems, contentTypes]);

  const monthlyDistribution = React.useMemo(() => {
    const counts = new Map();
    activeItems.forEach((item) => {
      const date = new Date(item.createdAt || item.updatedAt || Date.now());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([label, value]) => ({ id: label, label, value }));
  }, [activeItems]);

  const recentLogs = React.useMemo(() => auditLogs
    .slice()
    .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
    .slice(0, 8), [auditLogs]);

  const estimatedStorage = activeItems.length * 50 * 1024;
  const maxType = Math.max(1, ...typeDistribution.map((item) => item.value));
  const maxMonth = Math.max(1, ...monthlyDistribution.map((item) => item.value));

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: stats.total,
      favorites: stats.favorites,
      deleted: stats.deleted,
      contentTypes: contentTypes.length,
      collections: virtualCollections.length,
      hierarchicalTags: hierarchicalTags.length,
      vocabulary: vocabulary.length,
      users: users.length
    },
    typeDistribution,
    monthlyDistribution,
    recentLogs
  };

  const exportJson = () => {
    downloadArchiveBlob(new Blob([JSON.stringify(reportPayload, null, 2)], { type: "application/json;charset=utf-8" }), `archive-report-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };
    const appendSheet = (name, rows) => {
      const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "البيان": "لا توجد بيانات" }]);
      worksheet["!rtl"] = true;
      worksheet["!cols"] = Object.keys(rows[0] || { "البيان": "" }).map(() => ({ wch: 24 }));
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    };
    appendSheet("ملخص", [reportPayload.summary]);
    appendSheet("الأنواع", typeDistribution.map((item) => ({ "النوع": item.label, "العدد": item.value })));
    appendSheet("الشهور", monthlyDistribution.map((item) => ({ "الشهر": item.label, "العدد": item.value })));
    appendSheet("النشاط", recentLogs.map((log) => ({
      "المستخدم": log.username || "",
      "الحدث": log.eventType || "",
      "التفاصيل": log.details || "",
      "التاريخ": log.timestamp ? formatDateTime(log.timestamp, settings.numberSystem) : ""
    })));
    XLSX.writeFile(workbook, `archive-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsx(PageHero, {
        icon: jsx(ChartColumn, { className: "h-6 w-6 text-emerald-400" }),
        title: "التقارير والإحصائيات",
        description: "ملخص بصري سريع لاتجاهات الأرشيف، توزيع الأنواع، النشاط الأخير، وقابلية التصدير.",
        actions: jsxs("div", {
          className: "flex flex-wrap gap-2",
          children: [
            jsxs("button", { type: "button", onClick: exportJson, className: "va-secondary-button inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5", children: [jsx(Download, { className: "h-4 w-4" }), "JSON"] }),
            jsxs("button", { type: "button", onClick: exportExcel, className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white", children: [jsx(FileSpreadsheet, { className: "h-4 w-4" }), "Excel"] })
          ]
        })
      }),
      jsx("section", {
        className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          jsx(Kpi, { label: "العناصر النشطة", value: formatNumber(stats.total, settings.numberSystem), hint: `${formatNumber(stats.deleted || 0, settings.numberSystem)} في سلة المحذوفات`, icon: jsx(Database, { className: "h-5 w-5" }) }),
          jsx(Kpi, { label: "المفضلة", value: formatNumber(stats.favorites || 0, settings.numberSystem), hint: "عناصر مميزة للرجوع السريع", icon: jsx(FolderOpen, { className: "h-5 w-5" }), tone: "amber" }),
          jsx(Kpi, { label: "المجموعات", value: formatNumber(virtualCollections.length, settings.numberSystem), hint: `${formatNumber(hierarchicalTags.length, settings.numberSystem)} وسم هرمي`, icon: jsx(HardDrive, { className: "h-5 w-5" }), tone: "violet" }),
          jsx(Kpi, { label: "تقدير التخزين", value: formatFileSize(estimatedStorage), hint: "تقدير داخلي للبيانات الوصفية", icon: jsx(ChartColumn, { className: "h-5 w-5" }), tone: "cyan" })
        ]
      }),
      jsxs("section", {
        className: "grid gap-6 xl:grid-cols-2",
        children: [
          jsxs(ReportPanel, {
            children: [
              jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-bold text-white", children: [jsx(FolderOpen, { className: "h-5 w-5 text-emerald-400" }), "التوزيع حسب النوع"] }),
              jsx(BarList, { items: typeDistribution, maxValue: maxType, emptyTitle: "لا توجد عناصر مصنفة بعد", emptyHint: "سيظهر التوزيع بعد إضافة عناصر مرتبطة بأنواع محتوى." })
            ]
          }),
          jsxs(ReportPanel, {
            children: [
              jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-bold text-white", children: [jsx(ChartColumn, { className: "h-5 w-5 text-emerald-400" }), "نشاط آخر 12 شهرًا"] }),
              jsx(BarList, { items: monthlyDistribution, maxValue: maxMonth, emptyTitle: "لا يوجد نشاط شهري بعد", emptyHint: "سيظهر المخطط بعد إضافة أو استيراد عناصر بتاريخ إنشاء." })
            ]
          })
        ]
      }),
      jsxs("section", {
        className: "grid gap-6 xl:grid-cols-[0.9fr_1.1fr]",
        children: [
          jsxs(ReportPanel, {
            children: [
              jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-bold text-white", children: [jsx(Users, { className: "h-5 w-5 text-emerald-400" }), "مؤشرات تنظيمية"] }),
              jsx("div", {
                className: "grid gap-3 sm:grid-cols-2",
                children: [
                  ["المستخدمون", users.length],
                  ["المصطلحات", vocabulary.length],
                  ["الأنواع", contentTypes.length],
                  ["السجلات", auditLogs.length]
                ].map(([label, value]) => jsxs("div", {
                  className: "rounded-xl va-surface-muted border p-3",
                  children: [
                    jsx("p", { className: "text-xs text-gray-500", children: label }),
                    jsx("p", { className: "mt-1 text-xl font-bold text-white", children: formatNumber(value, settings.numberSystem) })
                  ]
                }, label))
              })
            ]
          }),
          jsxs(ReportPanel, {
            children: [
              jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-bold text-white", children: [jsx(History, { className: "h-5 w-5 text-emerald-400" }), "آخر النشاط"] }),
              recentLogs.length ? jsx("div", {
                className: "space-y-2",
                children: recentLogs.map((log) => jsxs("div", {
                  className: "grid gap-2 rounded-xl va-surface-subtle border p-3 text-sm sm:grid-cols-[1fr_auto]",
                  children: [
                    jsxs("div", {
                      className: "min-w-0",
                      children: [
                        jsx("p", { className: "truncate font-semibold text-gray-200", children: log.eventType || "نشاط" }),
                        log.details && jsx("p", { className: "mt-1 truncate text-xs text-gray-500", children: log.details })
                      ]
                    }),
                    jsx("span", { className: "text-xs text-gray-600", children: log.timestamp ? formatDateTime(log.timestamp, settings.numberSystem) : "" })
                  ]
                }, log.id || `${log.eventType}-${log.timestamp}`))
              }) : jsx("p", { className: "rounded-xl border border-dashed border-white/10 bg-gray-950/30 p-6 text-center text-sm text-gray-500", children: "لا توجد سجلات نشاط بعد." })
            ]
          })
        ]
      })
    ]
  });
}

ReportsPage.pageId = "reports";
ReportsPage.migrationStatus = "native";

export default ReportsPage;
