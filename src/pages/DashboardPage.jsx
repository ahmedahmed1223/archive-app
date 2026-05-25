import {
  useAppStore
} from "../stores/index.js";
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
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

import {
  ActionCard,
  FormSection,
  MetricCard,
  PageHero
} from "../components/ui/V1Primitives.jsx";
import {
  createDashboardStats,
  getDashboardDemoItemIds
} from "../features/dashboard/viewModel.js";
import { formatDateTime } from "../utils/formatting.js";

function ReadinessRow({ label, value, status = "neutral" }) {
  const statusClass = status === "ok" ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
    : status === "warning" ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
      : "bg-white/5 text-gray-300 border-white/10";
  return jsxs("div", {
    className: "va-card-subtle flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-gray-800/20 px-3 py-2",
    children: [
      jsx("span", { className: "text-sm text-gray-400", children: label }),
      jsx("span", { className: `rounded-full border px-2 py-0.5 text-xs ${statusClass}`, children: value })
    ]
  });
}

function MiniStat({ label, value, hint, icon }) {
  return jsxs("div", {
    className: "va-card-subtle min-h-[96px] rounded-xl border border-white/5 bg-gray-800/20 p-3",
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
    className: "va-action-card flex w-full items-center gap-3 rounded-lg border border-white/5 bg-gray-800/20 p-3 text-right transition-colors hover:border-emerald-500/25 hover:bg-white/5",
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
    sqliteError,
    isPasswordSet,
    setCurrentPage,
    setSelectedItemId,
    updateSettings,
    runSystemHealthCheck,
    showToast
  } = useAppStore();

  const stats = React.useMemo(() => createDashboardStats({
    videoItems,
    contentTypes,
    virtualCollections,
    hierarchicalTags
  }), [videoItems, contentTypes, virtualCollections, hierarchicalTags]);

  const demoIds = React.useMemo(() => getDashboardDemoItemIds(videoItems), [videoItems]);
  const recentItems = React.useMemo(() => videoItems
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
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs(PageHero, {
        icon: jsx(LayoutGrid, { className: "h-6 w-6 text-emerald-400" }),
        title: "لوحة التحكم",
        description: "بداية يومية مختصرة: راقب جاهزية النظام، أضف محتوى جديداً، وافتح مسارات النقل والنسخ دون تشتت.",
        actions: jsxs("button", {
          type: "button",
          onClick: () => goTo("add"),
          className: "va-primary-button inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white",
          children: [jsx(Video, { className: "h-4 w-4" }), "إضافة فيديو"]
        }),
        children: [
          demoIds.length > 0 && jsx("div", {
            className: "mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100",
            children: `توجد ${demoIds.length} عناصر تجريبية. راجع الأرشيف أو الإعدادات قبل الاستخدام الفعلي.`
          }, "demo-banner"),
          settings.ui?.onboardingSecurityMode === "quick" && !isPasswordSet && jsxs("div", {
            className: "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100",
            children: [
              jsx("span", { children: "الحماية مؤجلة. يفضّل تعيين كلمة مرور المدير قبل استخدام التطبيق يوميًا." }),
              jsx("button", {
                type: "button",
                onClick: () => {
                  updateSettings?.({ ui: { ...(settings.ui || {}), lastSettingsTab: "security" } });
                  goTo("settings");
                },
                className: "rounded-lg border border-amber-300/25 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-500/10",
                children: "فتح الأمان"
              })
            ]
          }, "security-banner")
        ]
      }),
      jsx("section", {
        className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          jsx(MetricCard, { label: "إجمالي الفيديوهات", value: stats.total, hint: "العناصر النشطة فقط", icon: jsx(Video, { className: "h-5 w-5" }), tone: "emerald" }),
          jsx(MetricCard, { label: "إجمالي المدة", value: stats.totalHours, hint: "من حقول المدة المتاحة", icon: jsx(Database, { className: "h-5 w-5" }), tone: "cyan" }),
          jsx(MetricCard, { label: "أضيفت آخر 7 أيام", value: stats.addedThisWeek, hint: `${stats.recentActivity} نشاط حديث`, icon: jsx(Sparkles, { className: "h-5 w-5" }), tone: "amber" }),
          jsx(MetricCard, { label: "المستخدمون النشطون", value: activeUsers, hint: `${stats.types} أنواع و${stats.collections} مجموعات`, icon: jsx(Users, { className: "h-5 w-5" }), tone: "violet" })
        ]
      }),
      jsxs("section", {
        className: "grid gap-6 xl:grid-cols-[1.1fr_0.9fr]",
        children: [
          jsx(FormSection, {
            title: "إجراءات سريعة",
            icon: jsx(Sparkles, { className: "h-5 w-5 text-emerald-400" }),
            actions: jsx("span", { className: "text-xs text-gray-500", children: "أكثر مسارات الاستخدام اليومي" }),
            children: jsx("div", {
              className: "grid gap-3 sm:grid-cols-2",
              children: [
                jsx(ActionCard, { label: "إضافة فيديو", detail: "افتح نموذج الإدخال مباشرة", icon: jsx(Video, { className: "h-5 w-5" }), onClick: () => goTo("add"), tone: "emerald" }, "add"),
                jsx(ActionCard, { label: "فتح الأرشيف", detail: "تصفح وفلتر العناصر", icon: jsx(Archive, { className: "h-5 w-5" }), onClick: () => goTo("archive"), tone: "cyan" }, "archive"),
                jsx(ActionCard, { label: "استيراد بيانات", detail: "JSON أو Excel صادر من التطبيق", icon: jsx(Upload, { className: "h-5 w-5" }), onClick: () => openDataTab("import"), tone: "amber" }, "import"),
                jsx(ActionCard, { label: "نقل لجهاز آخر", detail: "ملف نقل مع checksum", icon: jsx(HardDrive, { className: "h-5 w-5" }), onClick: () => openDataTab("transfer"), tone: "violet" }, "transfer"),
                jsx(ActionCard, { label: "البحث المتقدم", detail: "نتائج وفلاتر تفصيلية", icon: jsx(Search, { className: "h-5 w-5" }), onClick: () => goTo("search"), tone: "slate" }, "search"),
                jsx(ActionCard, { label: "فحص النظام", detail: "IndexedDB والنسخ وحالة التخزين", icon: jsx(Shield, { className: "h-5 w-5" }), onClick: runHealth, tone: sqliteError ? "amber" : "emerald" }, "health")
              ]
            })
          }),
          jsx(FormSection, {
            title: "جاهزية اليوم",
            icon: jsx(Shield, { className: "h-5 w-5 text-emerald-400" }),
            children: [
              jsx(ReadinessRow, { label: "التخزين المحلي", value: sqliteError ? "تحقق التخزين" : "IndexedDB محلي", status: sqliteError ? "warning" : "ok" }, "storage"),
              jsx(ReadinessRow, { label: "آخر نسخة احتياطية", value: lastBackup, status: settings.lastBackupAt ? "ok" : "warning" }, "backup"),
              jsx(ReadinessRow, { label: "آخر فحص نظام", value: lastHealth, status: settings.systemHealth?.lastCheckAt ? "ok" : "neutral" }, "health"),
              jsx(ReadinessRow, { label: "المفضلة", value: `${stats.favorites} عنصر`, status: "neutral" }, "favorites"),
              jsx(ReadinessRow, { label: "المحذوفات", value: `${stats.deleted} عنصر`, status: stats.deleted ? "warning" : "ok" }, "deleted")
            ]
          })
        ]
      }),
      jsxs("section", {
        className: "grid gap-6 xl:grid-cols-[1fr_0.9fr]",
        children: [
          jsx(FormSection, {
            title: "آخر العناصر",
            icon: jsx(Bell, { className: "h-5 w-5 text-emerald-400" }),
            actions: jsx("button", { type: "button", onClick: () => goTo("archive"), className: "text-sm text-emerald-300 hover:text-emerald-200", children: "فتح الأرشيف" }),
            children: recentItems.length === 0 ? jsxs("div", {
              className: "rounded-xl border border-dashed border-white/10 p-6 text-center",
              children: [
                jsx(Video, { className: "mx-auto h-10 w-10 text-gray-600" }),
                jsx("p", { className: "mt-3 text-sm font-medium text-gray-300", children: "لا توجد فيديوهات بعد" }),
                jsx("p", { className: "mt-1 text-xs text-gray-500", children: "ابدأ بإضافة فيديو أو استيراد ملف نقل." })
              ]
            }) : jsx("div", { className: "space-y-2", children: recentItems.map((item) => jsx(RecentItem, { item, onOpen: () => openItem(item) }, item.id)) })
          }),
          jsx(FormSection, {
            title: "ملخص التنظيم",
            icon: jsx(Tags, { className: "h-5 w-5 text-emerald-400" }),
            children: jsx("div", {
              className: "grid grid-cols-2 gap-3",
              children: [
                jsx(MiniStat, { label: "أنواع", value: stats.types, hint: "بنية المحتوى", icon: jsx(Tags, { className: "h-4 w-4" }) }, "types"),
                jsx(MiniStat, { label: "مجموعات", value: stats.collections, hint: "تنظيم مخصص", icon: jsx(Database, { className: "h-4 w-4" }) }, "collections"),
                jsx(MiniStat, { label: "وسوم", value: stats.tags, hint: "هرمية", icon: jsx(Tags, { className: "h-4 w-4" }) }, "tags"),
                jsx(MiniStat, { label: "آخر نشاط", value: latestAudit ? "موجود" : "—", hint: latestAudit ? formatDateTime(latestAudit.timestamp || latestAudit.createdAt) : "لا توجد سجلات", icon: jsx(Bell, { className: "h-4 w-4" }) }, "audit")
              ]
            })
          })
        ]
      })
    ]
  });
}

DashboardPage.pageId = "dashboard";
DashboardPage.pageTitle = "لوحة التحكم";
DashboardPage.migrationStatus = "native";

export default DashboardPage;
