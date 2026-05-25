import {
  parseAppRoute,
  writeAppRoute
} from "../services/router/index.js";
import {
  useAppStore
} from "../stores/index.js";
import {
  BookOpen,
  PenLine,
  Plus,
  Search,
  Tag,
  Trash2
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { PageHero } from "../components/ui/V1Primitives.jsx";
import {
  VOCABULARY_CATEGORIES,
  createVocabularyEntryValue,
  createVocabularyRouteParams,
  getFilteredVocabularyEntries,
  getVocabularyCategoryCounts,
  parseVocabularyAliases,
  parseVocabularyRouteParams
} from "../features/vocabulary/viewModel.js";
import { formatDateTime, formatNumber } from "../utils/formatting.js";


function getCategoryInfo(categoryId) {
  return VOCABULARY_CATEGORIES.find((category) => category.id === categoryId) || VOCABULARY_CATEGORIES[VOCABULARY_CATEGORIES.length - 1];
}

function CategoryButton({ category, count, active, onClick }) {
  return jsxs("button", {
    type: "button",
    onClick,
    className: `inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${active ? "bg-white/10 text-white" : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5"}`,
    style: active && category.color ? { borderColor: `${category.color}55`, backgroundColor: `${category.color}18` } : undefined,
    children: [
      jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { backgroundColor: category.color || "#10b981" } }),
      category.label,
      jsx("span", { className: "rounded-full bg-black/20 px-2 py-0.5 text-xs text-gray-300", children: formatNumber(count || 0) })
    ]
  });
}

function VocabularyForm({ entry, activeCategory, onCancel, onSave }) {
  const [term, setTerm] = React.useState(entry?.term || "");
  const [category, setCategory] = React.useState(entry?.category || (activeCategory === "all" ? "other" : activeCategory));
  const [description, setDescription] = React.useState(entry?.description || "");
  const [aliases, setAliases] = React.useState((entry?.aliases || []).join("، "));

  const save = () => {
    if (!term.trim()) return;
    onSave({
      ...entry,
      term,
      category,
      description,
      aliases: parseVocabularyAliases(aliases)
    });
  };

  return jsxs("section", {
    className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-right",
    dir: "rtl",
    children: [
      jsx("h2", { className: "text-base font-bold text-white", children: entry ? "تعديل مصطلح" : "مصطلح جديد" }),
      jsxs("div", {
        className: "mt-4 grid gap-3 lg:grid-cols-2",
        children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "المصطلح" }),
            jsx("input", {
              value: term,
              onChange: (event) => setTerm(event.target.value),
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40",
              placeholder: "مثال: القدس"
            })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "الفئة" }),
            jsx("select", {
              value: category,
              onChange: (event) => setCategory(event.target.value),
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none",
              children: VOCABULARY_CATEGORIES.map((item) => jsx("option", { value: item.id, children: item.label }, item.id))
            })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("span", { children: "الأسماء المستعارة" }),
            jsx("input", {
              value: aliases,
              onChange: (event) => setAliases(event.target.value),
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40",
              placeholder: "أسماء بديلة مفصولة بفاصلة"
            })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("span", { children: "الوصف" }),
            jsx("textarea", {
              value: description,
              onChange: (event) => setDescription(event.target.value),
              className: "min-h-[86px] w-full rounded-xl border border-white/10 bg-gray-950/45 p-3 text-sm text-white outline-none focus:border-emerald-500/40",
              placeholder: "معلومة قصيرة تساعد فريق الأرشفة على استخدام المصطلح الصحيح"
            })
          ] })
        ]
      }),
      jsxs("div", {
        className: "mt-4 flex flex-wrap justify-end gap-2",
        children: [
          jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
          jsx("button", { type: "button", onClick: save, disabled: !term.trim(), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: entry ? "حفظ التعديل" : "إضافة المصطلح" })
        ]
      })
    ]
  });
}

function VocabularyCard({ entry, index, onEdit, onDelete }) {
  const category = getCategoryInfo(entry.category);
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    className: "va-entity-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right transition-colors hover:border-emerald-500/25",
    dir: "rtl",
    children: [
      jsxs("div", {
        className: "flex items-start justify-between gap-3",
        children: [
          jsxs("div", {
            className: "min-w-0",
            children: [
              jsxs("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                  jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { backgroundColor: category.color } }),
                  jsx("h3", { className: "truncate text-base font-bold text-white", children: entry.term || "مصطلح بدون اسم" }),
                  jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400", children: category.label })
                ]
              }),
              entry.description && jsx("p", { className: "mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400", children: entry.description }),
              entry.aliases?.length > 0 && jsx("div", {
                className: "mt-3 flex flex-wrap gap-1.5",
                children: entry.aliases.map((alias) => jsx("span", {
                  className: "rounded-full border border-white/5 bg-gray-950/45 px-2 py-0.5 text-xs text-gray-400",
                  children: alias
                }, alias))
              })
            ]
          }),
          jsxs("div", {
            className: "flex shrink-0 gap-1",
            children: [
              jsx("button", { type: "button", onClick: onEdit, className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", "aria-label": `تعديل ${entry.term}`, children: jsx(PenLine, { className: "h-4 w-4" }) }),
              jsx("button", { type: "button", onClick: onDelete, className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300", "aria-label": `حذف ${entry.term}`, children: jsx(Trash2, { className: "h-4 w-4" }) })
            ]
          })
        ]
      }),
      entry.updatedAt && jsx("p", { className: "mt-4 text-xs text-gray-600", children: `آخر تحديث: ${formatDateTime(entry.updatedAt)}` })
    ]
  }, entry.id);
}

export function VocabularyPage() {
  const {
    vocabulary = [],
    settings = {},
    addVocabularyEntry,
    updateVocabularyEntry,
    deleteVocabularyEntry,
    showToast
  } = useAppStore();

  const initialRouteState = React.useMemo(() => parseVocabularyRouteParams(parseAppRoute().params), []);
  const [query, setQuery] = React.useState(initialRouteState.query);
  const [category, setCategory] = React.useState(initialRouteState.category);
  const [page, setPage] = React.useState(initialRouteState.page);
  const [pageSize, setPageSize] = React.useState(initialRouteState.pageSize);
  const [editingEntry, setEditingEntry] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const skipPageReset = React.useRef(true);

  const counts = React.useMemo(() => getVocabularyCategoryCounts(vocabulary), [vocabulary]);
  const filteredEntries = React.useMemo(() => getFilteredVocabularyEntries({ vocabulary, query, category }), [category, query, vocabulary]);
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    const applyRouteState = () => {
      const next = parseVocabularyRouteParams(parseAppRoute().params);
      setQuery(next.query);
      setCategory(next.category);
      setPage(next.page);
      setPageSize(next.pageSize);
    };
    window.addEventListener("hashchange", applyRouteState);
    window.addEventListener("popstate", applyRouteState);
    return () => {
      window.removeEventListener("hashchange", applyRouteState);
      window.removeEventListener("popstate", applyRouteState);
    };
  }, []);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      writeAppRoute("vocabulary", {
        params: createVocabularyRouteParams({ query, category, page: currentPage, pageSize })
      }, settings, true);
    }, 120);
    return () => window.clearTimeout(handle);
  }, [category, currentPage, pageSize, query, settings]);

  React.useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setPage(1);
  }, [category, pageSize, query]);

  React.useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  const startCreate = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const saveEntry = async (draft) => {
    try {
      if (editingEntry) {
        await updateVocabularyEntry?.(createVocabularyEntryValue({
          ...editingEntry,
          ...draft,
          createdAt: editingEntry.createdAt
        }));
        showToast?.("تم تحديث المصطلح", "success");
      } else {
        await addVocabularyEntry?.(createVocabularyEntryValue(draft));
        showToast?.("تمت إضافة المصطلح", "success");
      }
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      showToast?.("تعذر حفظ المصطلح", "error");
    }
  };

  const deleteEntry = async (entry) => {
    const confirmed = await appConfirm(`هل تريد حذف المصطلح "${entry.term}"؟`, {
      title: "حذف مصطلح",
      kind: "danger",
      confirmLabel: "حذف"
    });
    if (!confirmed) return;
    try {
      await deleteVocabularyEntry?.(entry.id);
      showToast?.("تم حذف المصطلح", "info");
    } catch (error) {
      showToast?.("تعذر حذف المصطلح", "error");
    }
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsx(PageHero, {
        icon: jsx(BookOpen, { className: "h-6 w-6 text-emerald-400" }),
        title: "القاموس المتحكم به",
        description: "مصطلحات موحدة تظهر في حقول الوسوم والاستدعاء الذكي عند كتابة الرمز @.",
        actions: jsxs("button", { type: "button", onClick: startCreate, className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white", children: [jsx(Plus, { className: "h-4 w-4" }), "مصطلح جديد"] })
      }),
      showForm && jsx(VocabularyForm, {
        entry: editingEntry,
        activeCategory: category,
        onCancel: () => {
          setShowForm(false);
          setEditingEntry(null);
        },
        onSave: saveEntry
      }),
      jsxs("section", {
        className: "va-filter-surface rounded-2xl border border-white/10 bg-gray-900/45 p-4",
        children: [
          jsxs("div", {
            className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]",
            children: [
              jsxs("label", {
                className: "relative block",
                children: [
                  jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
                  jsx("input", {
                    value: query,
                    onChange: (event) => setQuery(event.target.value),
                    placeholder: "بحث في المصطلحات والأسماء المستعارة...",
                    className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40"
                  })
                ]
              }),
              jsx("select", {
                value: pageSize,
                onChange: (event) => setPageSize(Number(event.target.value)),
                className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none",
                children: [24, 48, 96].map((size) => jsx("option", { value: size, children: `${size} مصطلح` }, size))
              })
            ]
          }),
          jsx("div", {
            className: "mt-4 flex flex-wrap gap-2",
            children: [
              jsx(CategoryButton, { category: { id: "all", label: "الكل", color: "#10b981" }, count: counts.all, active: category === "all", onClick: () => setCategory("all") }, "all"),
              ...VOCABULARY_CATEGORIES.map((item) => jsx(CategoryButton, { category: item, count: counts[item.id], active: category === item.id, onClick: () => setCategory(item.id) }, item.id))
            ]
          }),
          jsxs("p", { className: "mt-3 flex items-center gap-2 text-xs text-gray-500", children: [jsx(Tag, { className: "h-3.5 w-3.5" }), `${formatNumber(filteredEntries.length, settings.numberSystem)} نتيجة من ${formatNumber(vocabulary.length, settings.numberSystem)} مصطلح`] })
        ]
      }),
      visibleEntries.length ? jsx("section", {
        className: "grid gap-3 lg:grid-cols-2",
        children: visibleEntries.map((entry, index) => jsx(VocabularyCard, {
          entry,
          index,
          onEdit: () => {
            setEditingEntry(entry);
            setShowForm(true);
          },
          onDelete: () => deleteEntry(entry)
        }, entry.id))
      }) : jsx("section", {
        className: "rounded-2xl border border-dashed border-white/10 bg-gray-900/35",
        children: jsx(EmptyState, {
          icon: jsx(BookOpen, { className: "h-16 w-16" }),
          title: vocabulary.length ? "لا توجد مصطلحات مطابقة" : "ابدأ قاموس المصطلحات",
          description: vocabulary.length
            ? "غيّر الفئة أو امسح البحث لعرض المصطلحات."
            : "أضف مصطلحات موحدة ليستخدمها الفريق من خلال الاستدعاء الذكي @.",
          actionLabel: vocabulary.length ? "مسح الفلاتر" : "إضافة أول مصطلح",
          onAction: vocabulary.length ? () => { setQuery(""); setCategory("all"); } : startCreate
        })
      }),
      jsx("div", {
        className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gray-950/35 p-3",
        children: [
          jsx("button", { type: "button", disabled: currentPage <= 1, onClick: () => setPage(currentPage - 1), className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "السابق" }),
          jsx("p", { className: "text-sm text-gray-500", children: `الصفحة ${formatNumber(currentPage)} من ${formatNumber(totalPages)}` }),
          jsx("button", { type: "button", disabled: currentPage >= totalPages, onClick: () => setPage(currentPage + 1), className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "التالي" })
        ]
      })
    ]
  });
}

VocabularyPage.pageId = "vocabulary";
VocabularyPage.migrationStatus = "native";

export default VocabularyPage;
