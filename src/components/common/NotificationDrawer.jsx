import { AlertTriangle, Bell, CheckCircle2, Info, Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";

import { useAppStore } from "../../stores/index.js";
import { useFocusTrap } from "./useFocusTrap.js";

const FILTER_TABS = [
  { id: "all", label: "الكل" },
  { id: "success", label: "نجاح" },
  { id: "warning", label: "تحذير" },
  { id: "error", label: "خطأ" }
];

const TYPE_ICON = {
  success: { Icon: CheckCircle2, tone: "text-emerald-300" },
  error: { Icon: AlertTriangle, tone: "text-red-300" },
  warning: { Icon: AlertTriangle, tone: "text-amber-300" },
  info: { Icon: Info, tone: "text-sky-300" }
};

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 45) return "الآن";
  if (diffSeconds < 90) return "قبل دقيقة";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `قبل ${diffDays} يوم`;
  return date.toLocaleDateString("ar");
}

export function NotificationDrawer() {
  const open = useAppStore((state) => state.notificationCenterOpen);
  const toggle = useAppStore((state) => state.toggleNotificationCenter);
  const history = useAppStore((state) => state.notificationHistory || []);
  const clearHistory = useAppStore((state) => state.clearNotificationHistory);
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = React.useState("all");
  const closeButtonRef = React.useRef(null);
  const panelRef = React.useRef(null);
  useFocusTrap(panelRef, open, { initialFocusRef: closeButtonRef });

  React.useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") toggle?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, toggle]);

  React.useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (filter === "all") return history;
    return history.filter((item) => (item.type || "info") === filter);
  }, [filter, history]);

  const counts = React.useMemo(() => {
    const tally = { all: history.length, success: 0, warning: 0, error: 0, info: 0 };
    for (const item of history) {
      const type = item.type || "info";
      if (tally[type] !== undefined) tally[type] += 1;
    }
    return tally;
  }, [history]);

  if (typeof document === "undefined") return null;

  const slideDuration = prefersReducedMotion ? 0 : 0.25;

  return createPortal(
    jsx(AnimatePresence, {
      children: open && jsxs(motion.div, {
        key: "notification-drawer",
        className: "fixed inset-0 z-[9995] flex",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: prefersReducedMotion ? 0 : 0.18 },
        dir: "rtl",
        children: [
          jsx(motion.button, {
            type: "button",
            "aria-label": "إغلاق سجل التنبيهات",
            onClick: () => toggle?.(),
            className: "absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm",
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 }
          }),
          jsxs(motion.aside, {
            ref: panelRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "سجل التنبيهات",
            className: "relative ms-auto flex h-full w-full max-w-[400px] flex-col border-s border-white/10 bg-[var(--color-bg-surface,#0b1626)] text-white shadow-2xl shadow-black/35",
            initial: { x: prefersReducedMotion ? 0 : -32, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: prefersReducedMotion ? 0 : -32, opacity: 0 },
            transition: { duration: slideDuration, ease: "easeOut" },
            children: [
              jsxs("header", {
                className: "flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3",
                children: [
                  jsxs("div", {
                    className: "flex min-w-0 items-center gap-2",
                    children: [
                      jsx(Bell, { className: "h-5 w-5 text-[var(--va-action)]" }),
                      jsxs("div", {
                        className: "min-w-0",
                        children: [
                          jsx("h2", { className: "truncate text-sm font-bold", children: "سجل التنبيهات" }),
                          jsx("p", { className: "text-xs text-gray-500", children: `${counts.all} إشعار` })
                        ]
                      })
                    ]
                  }),
                  jsx("button", {
                    ref: closeButtonRef,
                    type: "button",
                    onClick: () => toggle?.(),
                    "aria-label": "إغلاق",
                    className: "rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white",
                    children: jsx(X, { className: "h-4 w-4" })
                  })
                ]
              }),
              jsx("div", {
                role: "tablist",
                "aria-label": "تصفية حسب النوع",
                className: "flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-3 py-2",
                children: FILTER_TABS.map((tab) => {
                  const active = filter === tab.id;
                  const tabCount = counts[tab.id] ?? 0;
                  return jsxs("button", {
                    type: "button",
                    role: "tab",
                    "aria-selected": active,
                    onClick: () => setFilter(tab.id),
                    className: `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${active
                      ? "bg-[color-mix(in_srgb,var(--va-action)_22%,transparent)] text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                    children: [tab.label, " · ", tabCount]
                  }, tab.id);
                })
              }),
              jsx("div", {
                className: "flex-1 overflow-y-auto px-3 py-2",
                children: filtered.length === 0
                  ? jsxs("div", {
                    className: "flex h-full flex-col items-center justify-center px-4 py-12 text-center",
                    children: [
                      jsx(Bell, { className: "h-10 w-10 text-gray-600" }),
                      jsx("p", { className: "mt-4 text-sm font-semibold text-gray-300", children: history.length === 0 ? "لا توجد تنبيهات بعد" : "لا توجد تنبيهات في هذا التصنيف" }),
                      jsx("p", { className: "mt-1 text-xs text-gray-500", children: history.length === 0 ? "سيظهر هنا أي تنبيه يحدث أثناء العمل." : "جرّب اختيار تصنيف آخر." })
                    ]
                  })
                  : jsx("ul", {
                    className: "space-y-2",
                    children: filtered.map((item) => {
                      const meta = TYPE_ICON[item.type] || TYPE_ICON.info;
                      const Icon = meta.Icon;
                      return jsxs("li", {
                        className: "rounded-xl border border-white/5 bg-white/[0.02] p-3",
                        children: [
                          jsxs("div", {
                            className: "flex items-start gap-3",
                            children: [
                              jsx(Icon, { className: `mt-0.5 h-4 w-4 shrink-0 ${meta.tone}` }),
                              jsxs("div", {
                                className: "min-w-0 flex-1",
                                children: [
                                  jsx("p", { className: "text-sm font-semibold text-white", children: item.title || "تنبيه" }),
                                  jsx("p", { className: "mt-1 whitespace-pre-wrap text-xs leading-6 text-gray-400", dir: "auto", children: item.message })
                                ]
                              })
                            ]
                          }),
                          jsx("p", { className: "mt-2 text-[10px] text-gray-600", children: formatRelativeTime(item.createdAt) })
                        ]
                      }, item.id);
                    })
                  })
              }),
              history.length > 0 && jsx("footer", {
                className: "border-t border-white/10 px-4 py-3",
                children: jsxs("button", {
                  type: "button",
                  onClick: () => clearHistory?.(),
                  className: "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10",
                  children: [jsx(Trash2, { className: "h-3.5 w-3.5" }), "مسح السجل"]
                })
              })
            ]
          })
        ]
      })
    }),
    document.body
  );
}

NotificationDrawer.displayName = "NotificationDrawer";
export default NotificationDrawer;
