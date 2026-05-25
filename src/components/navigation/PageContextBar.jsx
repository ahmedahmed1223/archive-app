import {
  writeAppRoute
} from "../../services/router/index.js";
import {
  useAppStore
} from "../../stores/index.js";
import {
  Archive,
  CirclePlus,
  CircleQuestionMark,
  Download,
  HardDrive,
  LayoutGrid,
  Search,
  Upload
} from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";

import { getPageContextBarModel } from "./viewModel.js";


function ContextButton({ children, onClick, variant = "secondary" }) {
  const classes = variant === "primary"
    ? "va-primary-button border-emerald-500/30 bg-emerald-700 text-white hover:bg-emerald-600"
    : "va-secondary-button border-white/10 text-gray-300 hover:bg-white/5 hover:text-white";

  return jsx("button", {
    type: "button",
    onClick,
    className: `inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${classes}`,
    children
  });
}

export function PageContextBar({ currentPage, currentPageTitle }) {
  const {
    setCurrentPage,
    setSelectedItemId,
    settings,
    updateSettings,
    videoItems,
    sqliteReady,
    sqliteError
  } = useAppStore();
  const meta = getPageContextBarModel(currentPage, currentPageTitle);
  const activeCount = videoItems.filter((item) => !item.isDeleted).length;

  const goToPage = (page) => {
    setSelectedItemId(null);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    goToPage("dashboard");
  };

  const openHelp = () => {
    setSelectedItemId(null);
    if (typeof window !== "undefined") window.__videoArchiveApplyingHistory = true;
    setCurrentPage("help");
    if (typeof window !== "undefined") window.__videoArchiveApplyingHistory = false;
    writeAppRoute("help", { section: meta.helpSection || "getting-started" }, settings, false);
  };

  const openArchiveImport = () => {
    const params = new URLSearchParams([["import", "1"]]);
    setSelectedItemId(null);
    if (typeof window !== "undefined") window.__videoArchiveApplyingHistory = true;
    setCurrentPage("archive");
    if (typeof window !== "undefined") window.__videoArchiveApplyingHistory = false;
    writeAppRoute("archive", { params }, settings, false);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("videoarchive:archive-import-open"));
      }, 0);
    }
  };

  const openDataTab = async (tab) => {
    await updateSettings?.({ ui: { ...(settings.ui || {}), lastDataCenterTab: tab } });
    goToPage("backup");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("videoarchive:data-tab", { detail: { tab } }));
    }
  };

  const primaryAction = (() => {
    if (["archive", "dashboard", "search"].includes(currentPage)) {
      return { label: "إضافة فيديو", icon: jsx(CirclePlus, { className: "h-4 w-4" }), onClick: () => goToPage("add") };
    }
    if (currentPage === "backup") {
      return { label: "نقل لجهاز آخر", icon: jsx(Download, { className: "h-4 w-4" }), onClick: () => openDataTab("transfer") };
    }
    if (currentPage === "add" || currentPage === "detail") {
      return { label: "فتح الأرشيف", icon: jsx(Archive, { className: "h-4 w-4" }), onClick: () => goToPage("archive") };
    }
    if (currentPage === "help") {
      return { label: "لوحة التحكم", icon: jsx(LayoutGrid, { className: "h-4 w-4" }), onClick: () => goToPage("dashboard") };
    }
    return { label: "فتح الأرشيف", icon: jsx(Archive, { className: "h-4 w-4" }), onClick: () => goToPage("archive") };
  })();

  const secondaryActions = [
    currentPage !== "dashboard" && { label: "رجوع", icon: "→", onClick: goBack },
    currentPage !== "archive" && { label: "الأرشيف", icon: jsx(Archive, { className: "h-4 w-4" }), onClick: () => goToPage("archive") },
    currentPage === "archive" && { label: "استيراد ملفات", icon: jsx(Upload, { className: "h-4 w-4" }), onClick: openArchiveImport },
    currentPage !== "search" && { label: "بحث", icon: jsx(Search, { className: "h-4 w-4" }), onClick: () => goToPage("search") },
    currentPage !== "backup" && { label: "نقل ونسخ", icon: jsx(HardDrive, { className: "h-4 w-4" }), onClick: () => openDataTab("transfer") }
  ].filter(Boolean).slice(0, 3);

  return jsx("div", {
    className: "va-context-bar",
    dir: "rtl",
    children: jsxs("div", {
      className: "va-context-bar-inner",
      children: [
        jsxs("div", {
          className: "va-context-title min-w-0",
          children: [
            jsxs("div", {
              className: "mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500",
              children: [
                jsx("span", { children: meta.breadcrumb }),
                jsx("span", {
                  className: "va-number-badge rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-gray-400",
                  children: `${activeCount} عنصر`
                }),
                sqliteError ? jsx("span", {
                  className: "rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200",
                  children: "تحقق التخزين"
                }) : jsx("span", {
                  className: `rounded-full border px-2 py-0.5 text-[11px] ${
                    sqliteReady ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-gray-400"
                  }`,
                  children: sqliteReady ? "SQLite جاهز" : "IndexedDB محلي"
                })
              ]
            }),
            jsx("h2", { className: "truncate text-lg font-bold text-white sm:text-xl", children: meta.title || currentPageTitle }),
            meta.hint && jsx("p", { className: "mt-1 line-clamp-2 text-sm leading-relaxed text-gray-400", children: meta.hint })
          ]
        }),
        jsxs("div", {
          className: "va-context-actions",
          children: [
            jsxs(ContextButton, {
              variant: "primary",
              onClick: primaryAction.onClick,
              children: [primaryAction.icon, primaryAction.label]
            }),
            secondaryActions.map((action) => jsxs(ContextButton, {
              onClick: action.onClick,
              children: [action.icon, action.label]
            }, action.label)),
            jsxs(ContextButton, {
              onClick: openHelp,
              children: [
                jsx(CircleQuestionMark, { className: "h-4 w-4" }),
                "مساعدة"
              ]
            })
          ]
        })
      ]
    })
  });
}

PageContextBar.displayName = "PageContextBar";
PageContextBar.componentId = "page-context-bar";
PageContextBar.migrationStatus = "native";

export default PageContextBar;
