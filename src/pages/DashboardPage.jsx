import {
  Archive,
  Bell,
  Database,
  HardDrive,
  LayoutGrid,
  Search,
  Shield,
  Sparkles,
  Tags,
  Upload,
  Users,
  Video,
  legacyJsxRuntime,
  legacyReact,
  useAppStore
} from "../runtime/legacyAdapter.js";
import {
  createDashboardStats,
  getDashboardDemoItemIds
} from "../features/dashboard/viewModel.js";
import { formatDateTime } from "../utils/formatting.js";

const { jsx, jsxs } = legacyJsxRuntime;

const toneClasses = {
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  slate: "border-white/10 bg-white/5 text-gray-200"
};

function DashboardCard({ children, className = "" }) {
  return jsx("section", {
    className: `rounded-xl border border-white/10 bg-gray-900/50 p-5 text-right backdrop-blur-sm ${className}`,
    dir: "rtl",
    children
  });
}

function KpiCard({ label, value, hint, icon, tone = "slate" }) {
  return jsxs(DashboardCard, {
    className: "min-h-[132px]",
    children: [
      jsxs("div", {
        className: "flex items-start justify-between gap-3",
        children: [
          jsxs("div", {
            className: "min-w-0",
            children: [
              jsx("p", { className: "text-sm text-gray-400", children: label }),
              jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: value }),
              hint && jsx("p", { className: "mt-2 text-xs leading-relaxed text-gray-500", children: hint })
            ]
          }),
          jsx("div", {
            className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses[tone] || toneClasses.slate}`,
            children: icon
          })
        ]
      })
    ]
  });
}

function ActionButton({ label, detail, icon, onClick, tone = "emerald" }) {
  return jsxs("button", {
    type: "button",
    onClick,
    className: "group flex min-h-[92px] w-full items-center gap-3 rounded-xl border border-white/10 bg-gray-800/30 p-4 text-right transition-colors hover:border-emerald-500/25 hover:bg-white/5",
    children: [
      jsx("span", {
        className: `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneClasses[tone] || toneClasses.emerald}`,
        children: icon
      }),
      jsxs("span", {
        className: "min-w-0",
        children: [
          jsx("span", { className: "block text-sm font-semibold text-white group-hover:text-emerald-100", children: label }),
          jsx("span", { className: "mt-1 block text-xs leading-relaxed text-gray-500", children: detail })
        ]
      })
    ]
  });
}

function ReadinessRow({ label, value, status = "neutral" }) {
  const statusClass = status === "ok" ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
    : status === "warning" ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
      : "bg-white/5 text-gray-300 border-white/10";
  return jsxs("div", {
    className: "flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-gray-800/20 px-3 py-2",
    children: [
      jsx("span", { className: "text-sm text-gray-400", children: label }),
      jsx("span", { className: `rounded-full border px-2 py-0.5 text-xs ${statusClass}`, children: value })
    ]
  });
}

function MiniStat({ label, value, hint, icon }) {
  return jsxs("div", {
    className: "min-h-[96px] rounded-xl border border-white/5 bg-gray-800/20 p-3",
    children: [
      jsxs("div", {
        className: "flex items-center justify-between gap-2",
        children: [
          jsx("span", { className: "text-xs text-gray-500", children: label }),
          jsx("span", { className: "text-gray-400", children: icon })
        ]
      }),
      jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: value }),
      jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500", children: hint })
    ]
  });
}

function RecentItem({ item, onOpen }) {
  return jsxs("button", {
    type: "button",
    onClick: onOpen,
    className: "flex w-full items-center gap-3 rounded-lg border border-white/5 bg-gray-800/20 p-3 text-right transition-colors hover:border-emerald-500/25 hover:bg-white/5",
    children: [
      jsx("span", {
        className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300",
        children: jsx(Video, { className: "h-4 w-4" })
      }),
      jsxs("span", {
        className: "min-w-0 flex-1",
        children: [
          jsx("span", { className: "block truncate text-sm font-medium text-white", children: item.title || "بدون عنوان" }),
          jsx("span", { className: "mt-1 block truncate text-xs text-gray-500", children: item.updatedAt ? formatDateTime(item.updatedAt) : "لم يتم تسجيل وقت" })
        ]
      })
    ]
  });
}

export function DashboardPage() {
  const {
    videoItems,
    contentTypes,
    virtualCollections,
    hierarchicalTags,
    auditLogs,
    users,
    settings,
    sqliteReady,
    sqliteError,
    setCurrentPage,
    setSelectedItemId,
    updateSettings,
    runSystemHealthCheck,
    showToast
  } = useAppStore();

  const stats = legacyReact.useMemo(() => createDashboardStats({
    videoItems,
    contentTypes,
    virtualCollections,
    hierarchicalTags
  }), [videoItems, contentTypes, virtualCollections, hierarchicalTags]);

  const demoIds = legacyReact.useMemo(() => getDashboardDemoItemIds(videoItems), [videoItems]);
  const recentItems = legacyReact.useMemo(() => videoItems
    .filter((item) => !item.isDeleted)
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 5), [videoItems]);
  const activeUsers = users.filter((user) => user.isActive !== false).length;
  const lastBackup = settings.lastBackupAt ? formatDateTime(settings.lastBackupAt) : "لا توجد نسخة بعد";
  const lastHealth = settings.systemHealth?.lastCheckAt ? formatDateTime(settings.systemHealth.lastCheckAt) : "لم يتم الفحص";
  const latestAudit = auditLogs.slice().sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())[0];

  const goTo = (page) => {
    setSelectedItemId(null);
    setCurrentPage(page);
  };

  const openItem = (item) => {
    setSelectedItemId(item.id);
    setCurrentPage("detail");
  };

  const openDataTab = async (tab) => {
    await updateSettings({ ui: { ...(settings.ui || {}), lastDataCenterTab: tab } });
    goTo("backup");
    window.dispatchEvent(new CustomEvent("videoarchive:data-tab", { detail: { tab } }));
  };

  const runHealth = async () => {
    const report = await runSystemHealthCheck?.();
    if (report) showToast("اكتمل فحص النظام", report.status === "ok" ? "success" : "warning");
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
                  jsxs("h2", {
                    className: "flex items-center gap-2 text-2xl font-bold text-white",
                    children: [jsx(LayoutGrid, { className: "h-6 w-6 text-emerald-400" }), "لوحة التحكم"]
                  }),
                  jsx("p", {
                    className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400",
                    children: "بداية يومية مختصرة: راقب جاهزية النظام، أضف محتوى جديداً، وافتح مسارات النقل والنسخ دون تشتت."
                  })
                ]
              }),
              jsxs("button", {
                type: "button",
                onClick: () => goTo("add"),
                className: "inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600",
                children: [jsx(Video, { className: "h-4 w-4" }), "إضافة فيديو"]
              })
            ]
          }),
          demoIds.length > 0 && jsx("div", {
            className: "mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100",
            children: `توجد ${demoIds.length} عناصر تجريبية. راجع الأرشيف أو الإعدادات قبل الاستخدام الفعلي.`
          })
        ]
      }),
      jsx("section", {
        className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          jsx(KpiCard, { label: "إجمالي الفيديوهات", value: stats.total, hint: "العناصر النشطة فقط", icon: jsx(Video, { className: "h-5 w-5" }), tone: "emerald" }),
          jsx(KpiCard, { label: "إجمالي المدة", value: stats.totalHours, hint: "من حقول المدة المتاحة", icon: jsx(Database, { className: "h-5 w-5" }), tone: "cyan" }),
          jsx(KpiCard, { label: "أضيفت آخر 7 أيام", value: stats.addedThisWeek, hint: `${stats.recentActivity} نشاط حديث`, icon: jsx(Sparkles, { className: "h-5 w-5" }), tone: "amber" }),
          jsx(KpiCard, { label: "المستخدمون النشطون", value: activeUsers, hint: `${stats.types} أنواع و${stats.collections} مجموعات`, icon: jsx(Users, { className: "h-5 w-5" }), tone: "violet" })
        ]
      }),
      jsxs("section", {
        className: "grid gap-6 xl:grid-cols-[1.1fr_0.9fr]",
        children: [
          jsxs(DashboardCard, {
            children: [
              jsxs("div", {
                className: "mb-4 flex items-center justify-between gap-3",
                children: [
                  jsxs("h3", { className: "flex items-center gap-2 text-lg font-bold text-white", children: [jsx(Sparkles, { className: "h-5 w-5 text-emerald-400" }), "إجراءات سريعة"] }),
                  jsx("span", { className: "text-xs text-gray-500", children: "أكثر مسارات الاستخدام اليومي" })
                ]
              }),
              jsx("div", {
                className: "grid gap-3 sm:grid-cols-2",
                children: [
                  jsx(ActionButton, { label: "إضافة فيديو", detail: "افتح نموذج الإدخال مباشرة", icon: jsx(Video, { className: "h-5 w-5" }), onClick: () => goTo("add"), tone: "emerald" }),
                  jsx(ActionButton, { label: "فتح الأرشيف", detail: "تصفح وفلتر العناصر", icon: jsx(Archive, { className: "h-5 w-5" }), onClick: () => goTo("archive"), tone: "cyan" }),
                  jsx(ActionButton, { label: "استيراد بيانات", detail: "JSON أو Excel صادر من التطبيق", icon: jsx(Upload, { className: "h-5 w-5" }), onClick: () => openDataTab("import"), tone: "amber" }),
                  jsx(ActionButton, { label: "نقل لجهاز آخر", detail: "ملف نقل مع checksum", icon: jsx(HardDrive, { className: "h-5 w-5" }), onClick: () => openDataTab("transfer"), tone: "violet" }),
                  jsx(ActionButton, { label: "البحث المتقدم", detail: "نتائج وفلاتر تفصيلية", icon: jsx(Search, { className: "h-5 w-5" }), onClick: () => goTo("search"), tone: "slate" }),
                  jsx(ActionButton, { label: "فحص النظام", detail: "SQLite وIndexedDB والنسخ", icon: jsx(Shield, { className: "h-5 w-5" }), onClick: runHealth, tone: sqliteError ? "amber" : "emerald" })
                ]
              })
            ]
          }),
          jsxs(DashboardCard, {
            children: [
              jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-bold text-white", children: [jsx(Shield, { className: "h-5 w-5 text-emerald-400" }), "جاهزية اليوم"] }),
              jsxs("div", {
                className: "space-y-2",
                children: [
                  jsx(ReadinessRow, { label: "SQLite", value: sqliteError ? "وضع محدود" : sqliteReady ? "جاهز" : "محلي", status: sqliteError ? "warning" : "ok" }),
                  jsx(ReadinessRow, { label: "آخر نسخة احتياطية", value: lastBackup, status: settings.lastBackupAt ? "ok" : "warning" }),
                  jsx(ReadinessRow, { label: "آخر فحص نظام", value: lastHealth, status: settings.systemHealth?.lastCheckAt ? "ok" : "neutral" }),
                  jsx(ReadinessRow, { label: "المفضلة", value: `${stats.favorites} عنصر`, status: "neutral" }),
                  jsx(ReadinessRow, { label: "المحذوفات", value: `${stats.deleted} عنصر`, status: stats.deleted ? "warning" : "ok" })
                ]
              })
            ]
          })
        ]
      }),
      jsxs("section", {
        className: "grid gap-6 xl:grid-cols-[1fr_0.9fr]",
        children: [
          jsxs(DashboardCard, {
            children: [
              jsxs("div", {
                className: "mb-4 flex items-center justify-between gap-3",
                children: [
                  jsxs("h3", { className: "flex items-center gap-2 text-lg font-bold text-white", children: [jsx(Bell, { className: "h-5 w-5 text-emerald-400" }), "آخر العناصر"] }),
                  jsx("button", { type: "button", onClick: () => goTo("archive"), className: "text-sm text-emerald-300 hover:text-emerald-200", children: "فتح الأرشيف" })
                ]
              }),
              recentItems.length === 0 ? jsxs("div", {
                className: "rounded-xl border border-dashed border-white/10 p-6 text-center",
                children: [
                  jsx(Video, { className: "mx-auto h-10 w-10 text-gray-600" }),
                  jsx("p", { className: "mt-3 text-sm font-medium text-gray-300", children: "لا توجد فيديوهات بعد" }),
                  jsx("p", { className: "mt-1 text-xs text-gray-500", children: "ابدأ بإضافة فيديو أو استيراد ملف نقل." })
                ]
              }) : jsx("div", { className: "space-y-2", children: recentItems.map((item) => jsx(RecentItem, { item, onOpen: () => openItem(item) }, item.id)) })
            ]
          }),
          jsxs(DashboardCard, {
            children: [
              jsxs("h3", { className: "mb-4 flex items-center gap-2 text-lg font-bold text-white", children: [jsx(Tags, { className: "h-5 w-5 text-emerald-400" }), "ملخص التنظيم"] }),
              jsx("div", {
                className: "grid grid-cols-2 gap-3",
                children: [
                  jsx(MiniStat, { label: "أنواع", value: stats.types, hint: "بنية المحتوى", icon: jsx(Tags, { className: "h-4 w-4" }) }),
                  jsx(MiniStat, { label: "مجموعات", value: stats.collections, hint: "تنظيم مخصص", icon: jsx(Database, { className: "h-4 w-4" }) }),
                  jsx(MiniStat, { label: "وسوم", value: stats.tags, hint: "هرمية", icon: jsx(Tags, { className: "h-4 w-4" }) }),
                  jsx(MiniStat, { label: "آخر نشاط", value: latestAudit ? "موجود" : "—", hint: latestAudit ? formatDateTime(latestAudit.timestamp || latestAudit.createdAt) : "لا توجد سجلات", icon: jsx(Bell, { className: "h-4 w-4" }) })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

DashboardPage.pageId = "dashboard";
DashboardPage.pageTitle = "لوحة التحكم";
DashboardPage.migrationStatus = "native";
DashboardPage.legacyComponentName = "";

export default DashboardPage;
