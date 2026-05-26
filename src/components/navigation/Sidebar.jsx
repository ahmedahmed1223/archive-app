import {
  useTheme
} from "../../theme/useTheme.js";
import {
  useAppStore,
  useAuthStore
} from "../../stores/index.js";
import {
  Archive,
  Bell,
  BookOpen,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  CircleQuestionMark,
  Database,
  FolderOpen,
  FolderTree,
  HardDrive,
  History,
  LayoutGrid,
  Menu,
  Search,
  Shield,
  Tag,
  Users,
  X,
  Video
} from "lucide-react";
import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import { getSidebarNavigationGroups } from "./viewModel.js";
import { ACTIONS, canPerform } from "../../features/users/permissions.js";

// Map sidebar page ids to the RBAC action that gates them. Missing entries
// are treated as "always visible" (so personal pages like Dashboard, Search,
// Archive remain available to every authenticated user).
const SIDEBAR_PAGE_PERMISSIONS = {
  users: ACTIONS.USER_MANAGE,
  settings: ACTIONS.SETTINGS_EDIT,
  backup: ACTIONS.BACKUP_CREATE,
  reports: ACTIONS.AUDIT_VIEW,
  history: ACTIONS.AUDIT_VIEW
};


const iconMap = {
  dashboard: LayoutGrid,
  archive: Archive,
  add: CirclePlus,
  search: Search,
  collections: FolderOpen,
  types: FolderTree,
  vocabulary: BookOpen,
  htags: Tag,
  users: Users,
  settings: Shield,
  history: History,
  help: CircleQuestionMark,
  backup: HardDrive,
  reports: ChartColumn
};

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

function SidebarButton({ page, active, onClick, badge, collapsed }) {
  const Icon = iconMap[page.id] || Database;
  return jsxs("button", {
    type: "button",
    onClick,
    "aria-current": active ? "page" : undefined,
    title: collapsed ? page.meta?.title : undefined,
    className: `va-sidebar-item ${active ? "va-sidebar-item-active" : ""} group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-sm transition-colors ${
      active
        ? "bg-emerald-500/10 text-emerald-100"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`,
    children: [
      active && jsx("span", { className: "absolute right-0 top-2 bottom-2 w-1 rounded-full bg-emerald-400" }),
      jsx("span", {
        className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          active ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/[0.03]"
        }`,
        children: jsx(Icon, { className: "h-4 w-4" })
      }),
      !collapsed && jsxs("span", {
        className: "flex min-w-0 flex-1 items-center justify-between gap-2",
        children: [
          jsx("span", { className: "truncate", children: page.meta?.title || page.id }),
          badge && jsx("span", {
            className: "va-number-badge shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300",
            children: badge
          })
        ]
      })
    ]
  });
}

export function Sidebar() {
  const {
    currentPage,
    setCurrentPage,
    setSelectedItemId,
    sidebarOpen,
    toggleSidebar,
    videoItems,
    lockApp,
    isPasswordSet,
    notificationHistory,
    notificationCenterOpen,
    toggleNotificationCenter
  } = useAppStore();
  const { currentUser, logout } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = React.useState(false);
  const isMobile = useIsMobile();
  const isDark = resolvedTheme === "dark";
  const activeCount = videoItems.filter((item) => !item.isDeleted).length;
  const groups = getSidebarNavigationGroups()
    .map((group) => ({
      ...group,
      pages: group.pages.filter((page) => {
        if (page.id === "detail") return false;
        const requiredAction = SIDEBAR_PAGE_PERMISSIONS[page.id];
        if (!requiredAction) return true;
        return canPerform(currentUser, requiredAction);
      })
    }))
    .filter((group) => group.pages.length > 0);

  const goToPage = (pageId) => {
    setSelectedItemId(null);
    setCurrentPage(pageId);
    if (isMobile && sidebarOpen) toggleSidebar();
  };

  const sidebarContent = jsxs(Fragment, {
    children: [
      jsxs("div", {
        className: `va-sidebar-brand flex items-center gap-3 border-b p-5 ${isDark ? "border-white/10" : "border-gray-200"}`,
        children: [
          jsx("div", {
            className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20",
            children: jsx(Video, { className: "h-5 w-5 text-white" })
          }),
          !collapsed && jsxs("div", {
            className: "min-w-0 flex-1",
            children: [
              jsx("h2", { className: "truncate text-lg font-bold text-white", children: "أرشيف الفيديو" }),
              jsx("p", { className: "truncate text-xs text-gray-500", children: "نظام إدارة الأرشيف" })
            ]
          }),
          !isMobile && jsx("button", {
            type: "button",
            onClick: () => setCollapsed((value) => !value),
            className: "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white",
            title: collapsed ? "توسيع القائمة" : "طي القائمة",
            "aria-label": collapsed ? "توسيع القائمة" : "طي القائمة",
            children: collapsed ? jsx(ChevronLeft, { className: "h-4 w-4" }) : jsx(ChevronRight, { className: "h-4 w-4" })
          }),
          isMobile && jsx("button", {
            type: "button",
            onClick: toggleSidebar,
            className: "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white",
            "aria-label": "إغلاق القائمة الجانبية",
            children: jsx(X, { className: "h-4 w-4" })
          })
        ]
      }),
      jsx("nav", {
        className: "custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-3",
        "aria-label": "القائمة الجانبية",
        children: groups.map((group) => jsxs("section", {
          children: [
            !collapsed && jsx("p", { className: "mb-2 px-3 text-xs font-medium text-gray-600", children: group.label }),
            jsx("div", {
              className: "space-y-1",
              children: group.pages.map((page) => jsx(SidebarButton, {
                page,
                active: currentPage === page.id,
                onClick: () => goToPage(page.id),
                badge: page.id === "archive" ? activeCount : undefined,
                collapsed
              }, page.id))
            })
          ]
        }, group.id))
      }),
      jsxs("div", {
        className: `space-y-2 border-t p-3 ${isDark ? "border-white/10" : "border-gray-200"}`,
        children: [
          jsxs("button", {
            type: "button",
            onClick: toggleNotificationCenter,
            className: `flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              notificationCenterOpen ? "bg-emerald-500/10 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`,
            children: [
              jsx(Bell, { className: "h-4 w-4 shrink-0" }),
              !collapsed && jsxs("span", {
                className: "flex min-w-0 flex-1 items-center justify-between gap-2",
                children: [
                  jsx("span", { children: "مركز الرسائل" }),
                  notificationHistory.length > 0 && jsx("span", {
                    className: "va-number-badge rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300",
                    children: notificationHistory.length
                  })
                ]
              })
            ]
          }),
          isPasswordSet && jsxs("button", {
            type: "button",
            onClick: lockApp,
            className: "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white",
            children: [
              jsx(Shield, { className: "h-4 w-4 shrink-0" }),
              !collapsed && "قفل التطبيق"
            ]
          }),
          currentUser && !collapsed && jsxs("div", {
            className: "rounded-xl border border-white/10 bg-white/[0.03] p-3",
            children: [
              jsx("p", { className: "truncate text-sm font-medium text-gray-200", children: currentUser.name || currentUser.username || "مستخدم" }),
              jsx("p", { className: "mt-1 truncate text-xs text-gray-500", children: currentUser.role || "user" }),
              jsx("button", {
                type: "button",
                onClick: logout,
                className: "mt-3 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white",
                children: "تسجيل الخروج"
              })
            ]
          })
        ]
      })
    ]
  });

  return jsxs(Fragment, {
    children: [
      isMobile && jsx("button", {
        type: "button",
        onClick: toggleSidebar,
        className: "fixed right-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gray-950/85 text-white shadow-lg backdrop-blur md:hidden",
        "aria-label": sidebarOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية",
        children: sidebarOpen ? jsx(X, { className: "h-5 w-5" }) : jsx(Menu, { className: "h-5 w-5" })
      }),
      isMobile && sidebarOpen && jsx("div", {
        className: "fixed inset-0 z-30 bg-black/50 md:hidden",
        onClick: toggleSidebar
      }),
      isMobile ? sidebarOpen && jsx("aside", {
        role: "navigation",
        "aria-label": "القائمة الجانبية",
        className: "va-sidebar fixed top-0 right-0 z-40 flex h-full w-[280px] flex-col border-l border-white/10 bg-gray-950",
        dir: "rtl",
        children: sidebarContent
      }) : jsx("aside", {
        role: "navigation",
        "aria-label": "القائمة الجانبية",
        className: `va-sidebar ${collapsed ? "w-[72px]" : "w-[clamp(240px,18vw,280px)]"} flex h-screen shrink-0 flex-col border-l border-white/10 bg-gray-950 transition-[width] duration-200`,
        dir: "rtl",
        children: sidebarContent
      })
    ]
  });
}

Sidebar.displayName = "Sidebar";
Sidebar.componentId = "sidebar";
Sidebar.migrationStatus = "native";

export default Sidebar;
