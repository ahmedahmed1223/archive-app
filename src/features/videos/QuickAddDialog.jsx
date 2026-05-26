import { Sparkles, Video, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";

import { useAppStore } from "../../stores/index.js";
import { createVideoItemValue, parseVideoTags } from "./viewModel.js";
import { reportError } from "../../utils/errorReporting.js";

export function QuickAddDialog({ open, onOpenChange }) {
  const {
    contentTypes = [],
    settings = {},
    addVideoItem,
    setCurrentPage,
    setSelectedItemId,
    showToast,
    showNotification
  } = useAppStore();

  const prefersReducedMotion = useReducedMotion();
  const titleRef = React.useRef(null);

  const defaultType = settings.ui?.lastQuickAddType
    || contentTypes.find((type) => type.status !== "archived")?.id
    || "";

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState(defaultType);
  const [tagsText, setTagsText] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setTagsText("");
      setNotes("");
      setType(defaultType);
      setSaving(false);
      window.requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [defaultType, open]);

  React.useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpenChange, open]);

  const submit = async (followThrough) => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const created = await addVideoItem?.(createVideoItemValue({
        title: title.trim(),
        type,
        tags: parseVideoTags(tagsText),
        notes: notes.trim()
      }));
      showToast?.("تمت إضافة الفيديو", "success");
      onOpenChange?.(false);
      if (followThrough && created?.id) {
        setSelectedItemId?.(created.id);
        setCurrentPage?.("detail");
      }
    } catch (error) {
      setSaving(false);
      reportError(showNotification, error, {
        context: "إضافة الفيديو",
        recovery: { run: () => submit(followThrough) }
      });
    }
  };

  if (typeof document === "undefined") return null;

  const activeTypes = contentTypes.filter((entry) => entry.status !== "archived");

  return createPortal(
    jsx(AnimatePresence, {
      children: open && jsxs(motion.div, {
        key: "quick-add-overlay",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: prefersReducedMotion ? 0 : 0.16 },
        onMouseDown: () => onOpenChange?.(false),
        className: "fixed inset-0 z-[9990] flex items-start justify-center p-4 backdrop-blur-md",
        style: { background: "rgba(3, 7, 18, 0.66)" },
        dir: "rtl",
        children: [
          jsxs(motion.section, {
            key: "quick-add-panel",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "quick-add-title",
            initial: { y: prefersReducedMotion ? 0 : -10, opacity: 0, scale: 0.98 },
            animate: { y: 0, opacity: 1, scale: 1 },
            exit: { y: prefersReducedMotion ? 0 : -8, opacity: 0, scale: 0.98 },
            transition: { duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] },
            onMouseDown: (event) => event.stopPropagation(),
            className: "va-surface-raised mt-16 w-full max-w-lg rounded-2xl border p-5 text-white shadow-2xl shadow-black/35",
            children: [
              jsxs("header", {
                className: "flex items-start justify-between gap-3",
                children: [
                  jsxs("div", {
                    className: "flex min-w-0 items-center gap-2",
                    children: [
                      jsx("span", {
                        className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--va-action)_30%,transparent)] bg-[color-mix(in_srgb,var(--va-action)_15%,transparent)] text-[color-mix(in_srgb,var(--va-action)_70%,#ffffff)]",
                        children: jsx(Sparkles, { className: "h-4 w-4" })
                      }),
                      jsxs("div", {
                        className: "min-w-0",
                        children: [
                          jsx("h2", { id: "quick-add-title", className: "truncate text-sm font-bold", children: "إضافة فيديو سريع" }),
                          jsx("p", { className: "text-xs text-gray-500", children: "العنوان فقط مطلوب — أكمل التفاصيل لاحقًا." })
                        ]
                      })
                    ]
                  }),
                  jsx("button", {
                    type: "button",
                    onClick: () => onOpenChange?.(false),
                    "aria-label": "إغلاق",
                    className: "rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white",
                    children: jsx(X, { className: "h-4 w-4" })
                  })
                ]
              }),
              jsxs("div", {
                className: "mt-4 space-y-3",
                children: [
                  jsxs("label", {
                    className: "block space-y-1 text-sm text-gray-300",
                    children: [
                      jsx("span", { children: "العنوان" }),
                      jsx("input", {
                        ref: titleRef,
                        value: title,
                        onChange: (event) => setTitle(event.target.value),
                        onKeyDown: (event) => {
                          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                            event.preventDefault();
                            submit(false);
                          }
                        },
                        placeholder: "مثال: مقابلة مع الدكتور أحمد - الحلقة 12",
                        className: "min-h-11 w-full rounded-xl border px-3 text-sm outline-none"
                      })
                    ]
                  }),
                  activeTypes.length > 0 && jsxs("label", {
                    className: "block space-y-1 text-sm text-gray-300",
                    children: [
                      jsx("span", { children: "النوع" }),
                      jsxs("select", {
                        value: type,
                        onChange: (event) => setType(event.target.value),
                        className: "min-h-11 w-full rounded-xl border px-3 text-sm",
                        children: [
                          jsx("option", { value: "", children: "بدون نوع" }),
                          ...activeTypes.map((entry) => jsx("option", { value: entry.id, children: entry.name }, entry.id))
                        ]
                      })
                    ]
                  }),
                  jsxs("label", {
                    className: "block space-y-1 text-sm text-gray-300",
                    children: [
                      jsx("span", { children: "وسوم (اختياري)" }),
                      jsx("input", {
                        value: tagsText,
                        onChange: (event) => setTagsText(event.target.value),
                        placeholder: "افصل بفواصل: محاضرة، عربي، 2026",
                        className: "min-h-11 w-full rounded-xl border px-3 text-sm"
                      })
                    ]
                  }),
                  jsxs("label", {
                    className: "block space-y-1 text-sm text-gray-300",
                    children: [
                      jsx("span", { children: "ملاحظات (اختياري)" }),
                      jsx("textarea", {
                        value: notes,
                        onChange: (event) => setNotes(event.target.value),
                        rows: 2,
                        placeholder: "سطر أو سطران سريعان...",
                        className: "w-full rounded-xl border p-3 text-sm"
                      })
                    ]
                  })
                ]
              }),
              jsxs("footer", {
                className: "mt-5 flex flex-wrap items-center justify-between gap-2",
                children: [
                  jsx("p", { className: "text-[11px] text-gray-500", children: "Ctrl+Enter للحفظ السريع · Esc للإغلاق" }),
                  jsxs("div", {
                    className: "flex flex-wrap gap-2",
                    children: [
                      jsx("button", {
                        type: "button",
                        onClick: () => onOpenChange?.(false),
                        className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5",
                        children: "إلغاء"
                      }),
                      jsxs("button", {
                        type: "button",
                        onClick: () => submit(false),
                        disabled: !title.trim() || saving,
                        className: "inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50",
                        children: [jsx(Video, { className: "h-4 w-4" }), "حفظ"]
                      }),
                      jsxs("button", {
                        type: "button",
                        onClick: () => submit(true),
                        disabled: !title.trim() || saving,
                        className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
                        children: ["حفظ وفتح", jsx(Sparkles, { className: "h-4 w-4" })]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    }),
    document.body
  );
}

export default QuickAddDialog;
