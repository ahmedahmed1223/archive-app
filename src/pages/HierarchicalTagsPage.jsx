import {
  useAppStore
} from "../stores/index.js";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  FolderTree,
  Hash,
  PenLine,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import {
  HIERARCHICAL_TAG_COLORS,
  buildHierarchicalTagModel,
  createHierarchicalTagValue,
  getDescendantTagIds,
  getFilteredHierarchicalTags,
  getHierarchicalTagPath,
  getNextHierarchicalTagOrder
} from "../features/hierarchical-tags/viewModel.js";
import { formatNumber } from "../utils/formatting.js";


function TagForm({ tag, parentTag, tags, onCancel, onSave }) {
  const [name, setName] = React.useState(tag?.name || "");
  const [color, setColor] = React.useState(tag?.color || "#10b981");

  const save = () => {
    if (!name.trim()) return;
    const parentId = tag ? tag.parentId || null : parentTag?.id || null;
    onSave({
      ...tag,
      name,
      color,
      parentId,
      order: tag?.order ?? getNextHierarchicalTagOrder(tags, parentId)
    });
  };

  return jsxs("section", {
    className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-right",
    dir: "rtl",
    children: [
      jsx("h2", { className: "text-base font-bold text-white", children: tag ? "تعديل الوسم" : parentTag ? `وسم فرعي داخل ${parentTag.name}` : "وسم جذر جديد" }),
      jsxs("div", {
        className: "mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]",
        children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "اسم الوسم" }),
            jsx("input", {
              value: name,
              onChange: (event) => setName(event.target.value),
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40",
              placeholder: "مثال: رياضة / كرة قدم"
            })
          ] }),
          jsxs("div", { className: "space-y-1", children: [
            jsx("span", { className: "text-sm text-gray-300", children: "اللون" }),
            jsx("div", {
              className: "flex max-w-[280px] flex-wrap gap-2",
              children: HIERARCHICAL_TAG_COLORS.map((item) => jsx("button", {
                type: "button",
                onClick: () => setColor(item),
                className: `h-8 w-8 rounded-full border transition-transform ${color === item ? "scale-110 border-white ring-2 ring-white/25" : "border-white/10"}`,
                style: { backgroundColor: item },
                "aria-label": `اختيار لون ${item}`
              }, item))
            })
          ] })
        ]
      }),
      jsxs("div", {
        className: "mt-4 flex flex-wrap justify-end gap-2",
        children: [
          jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
          jsx("button", { type: "button", onClick: save, disabled: !name.trim(), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: tag ? "حفظ التعديل" : "إنشاء الوسم" })
        ]
      })
    ]
  });
}

function TagNode({
  tag,
  level,
  tags,
  model,
  expandedIds,
  onToggle,
  onCreateChild,
  onEdit,
  onDelete,
  onMove,
  getTagUsageCount
}) {
  const children = model.childrenByParent.get(tag.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(tag.id);
  const usageCount = typeof getTagUsageCount === "function" ? getTagUsageCount(tag.id) : 0;

  return jsxs("div", {
    role: "treeitem",
    "aria-expanded": hasChildren ? isExpanded : undefined,
    children: [
      jsxs("div", {
        className: "group flex items-center gap-2 rounded-xl border border-transparent p-2 transition-colors hover:border-white/10 hover:bg-white/5",
        style: { paddingRight: `${level * 22 + 8}px` },
        children: [
          jsx("button", {
            type: "button",
            onClick: () => hasChildren && onToggle(tag.id),
            className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${hasChildren ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-transparent"}`,
            "aria-label": isExpanded ? "طي الوسم" : "توسيع الوسم",
            children: hasChildren ? isExpanded ? jsx(ChevronDown, { className: "h-4 w-4" }) : jsx(ChevronLeft, { className: "h-4 w-4" }) : jsx(ChevronLeft, { className: "h-4 w-4" })
          }),
          jsx("span", { className: "h-3 w-3 shrink-0 rounded-full", style: { backgroundColor: tag.color || "#10b981" } }),
          jsxs("div", { className: "min-w-0 flex-1", children: [
            jsx("p", { className: "truncate text-sm font-semibold text-white group-hover:text-emerald-200", children: tag.name || "وسم بدون اسم" }),
            level > 0 && jsx("p", { className: "truncate text-xs text-gray-600", children: getHierarchicalTagPath(tag.id, tags) })
          ] }),
          usageCount > 0 && jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-500", children: formatNumber(usageCount) }),
          jsxs("div", { className: "flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100", children: [
            jsx("button", { type: "button", onClick: () => onCreateChild(tag), className: "rounded-lg p-2 text-gray-500 hover:bg-emerald-500/10 hover:text-emerald-300", "aria-label": `إضافة فرع داخل ${tag.name}`, children: jsx(Plus, { className: "h-4 w-4" }) }),
            jsx("button", { type: "button", onClick: () => onMove(tag, "up"), className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", "aria-label": "رفع الوسم", children: jsx(ArrowUp, { className: "h-4 w-4" }) }),
            jsx("button", { type: "button", onClick: () => onMove(tag, "down"), className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", "aria-label": "خفض الوسم", children: jsx(ArrowDown, { className: "h-4 w-4" }) }),
            jsx("button", { type: "button", onClick: () => onEdit(tag), className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", "aria-label": `تعديل ${tag.name}`, children: jsx(PenLine, { className: "h-4 w-4" }) }),
            jsx("button", { type: "button", onClick: () => onDelete(tag), className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300", "aria-label": `حذف ${tag.name}`, children: jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ]
      }),
      isExpanded && hasChildren && jsx("div", {
        className: "mt-1 space-y-1",
        role: "group",
        children: children.map((child) => jsx(TagNode, {
          tag: child,
          level: level + 1,
          tags,
          model,
          expandedIds,
          onToggle,
          onCreateChild,
          onEdit,
          onDelete,
          onMove,
          getTagUsageCount
        }, child.id))
      })
    ]
  });
}

function FlatTagCard({ tag, tags, index, onEdit, onDelete }) {
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    className: "va-entity-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right",
    children: [
      jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        jsxs("div", { className: "min-w-0", children: [
          jsxs("div", { className: "flex items-center gap-2", children: [
            jsx("span", { className: "h-3 w-3 rounded-full", style: { backgroundColor: tag.color || "#10b981" } }),
            jsx("h3", { className: "truncate text-base font-bold text-white", children: tag.name || "وسم بدون اسم" })
          ] }),
          jsx("p", { className: "mt-2 truncate text-xs text-gray-500", children: getHierarchicalTagPath(tag.id, tags) || tag.name })
        ] }),
        jsxs("div", { className: "flex shrink-0 gap-1", children: [
          jsx("button", { type: "button", onClick: onEdit, className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", children: jsx(PenLine, { className: "h-4 w-4" }) }),
          jsx("button", { type: "button", onClick: onDelete, className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300", children: jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] })
    ]
  }, tag.id);
}

export function HierarchicalTagsPage() {
  const {
    hierarchicalTags = [],
    addHierarchicalTag,
    updateHierarchicalTag,
    deleteHierarchicalTag,
    getTagUsageCount,
    showToast
  } = useAppStore();

  const [query, setQuery] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState(() => new Set());
  const [editingTag, setEditingTag] = React.useState(null);
  const [parentTag, setParentTag] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);

  const model = React.useMemo(() => buildHierarchicalTagModel(hierarchicalTags), [hierarchicalTags]);
  const filteredTags = React.useMemo(() => getFilteredHierarchicalTags(hierarchicalTags, query), [hierarchicalTags, query]);

  const rootCount = model.roots.length;
  const childCount = Math.max(0, hierarchicalTags.length - rootCount);

  const toggleExpand = (id) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(hierarchicalTags.map((tag) => tag.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const startCreateRoot = () => {
    setEditingTag(null);
    setParentTag(null);
    setShowForm(true);
  };

  const startCreateChild = (tag) => {
    setEditingTag(null);
    setParentTag(tag);
    setShowForm(true);
    setExpandedIds((previous) => new Set([...previous, tag.id]));
  };

  const saveTag = async (draft) => {
    try {
      if (editingTag) {
        await updateHierarchicalTag?.(createHierarchicalTagValue({
          ...editingTag,
          ...draft,
          createdAt: editingTag.createdAt
        }));
        showToast?.("تم تحديث الوسم", "success");
      } else {
        await addHierarchicalTag?.(createHierarchicalTagValue(draft));
        showToast?.("تم إنشاء الوسم", "success");
      }
      setShowForm(false);
      setEditingTag(null);
      setParentTag(null);
    } catch (error) {
      showToast?.("تعذر حفظ الوسم", "error");
    }
  };

  const deleteTag = async (tag) => {
    const descendantCount = getDescendantTagIds(tag.id, model.childrenByParent).length;
    const message = descendantCount
      ? `سيتم حذف "${tag.name}" و${descendantCount} وسم فرعي. هل تريد المتابعة؟`
      : `هل تريد حذف الوسم "${tag.name}"؟`;
    const confirmed = await appConfirm(message, {
      title: "حذف وسم هرمي",
      kind: "danger",
      confirmLabel: "حذف"
    });
    if (!confirmed) return;
    try {
      await deleteHierarchicalTag?.(tag.id);
      showToast?.("تم حذف الوسم", "info");
    } catch (error) {
      showToast?.("تعذر حذف الوسم", "error");
    }
  };

  const moveTag = async (tag, direction) => {
    const siblings = model.childrenByParent.get(tag.parentId || null) || [];
    const index = siblings.findIndex((item) => item.id === tag.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
    const target = siblings[targetIndex];
    try {
      await updateHierarchicalTag?.({ ...tag, order: target.order ?? 0, updatedAt: new Date().toISOString() });
      await updateHierarchicalTag?.({ ...target, order: tag.order ?? 0, updatedAt: new Date().toISOString() });
    } catch (error) {
      showToast?.("تعذر تغيير ترتيب الوسوم", "error");
    }
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", {
        className: "va-page-hero rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10",
        children: [
          jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
            jsxs("div", { className: "min-w-0", children: [
              jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(FolderTree, { className: "h-6 w-6 text-emerald-400" }), "الوسوم الهرمية"] }),
              jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "وسوم جذرية وفرعية تظهر في حقول الوسوم عند كتابة الرمز # مع حفظ المسار الكامل للوسم." })
            ] }),
            jsxs("div", { className: "flex flex-wrap gap-2", children: [
              jsx("button", { type: "button", onClick: expandAll, className: "inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5", children: [jsx(ChevronDown, { className: "h-4 w-4" }), "توسيع الكل"] }),
              jsx("button", { type: "button", onClick: collapseAll, className: "inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5", children: [jsx(ChevronLeft, { className: "h-4 w-4" }), "طي الكل"] }),
              jsx("button", { type: "button", onClick: startCreateRoot, className: "inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: [jsx(Plus, { className: "h-4 w-4" }), "وسم جذر"] })
            ] })
          ] })
        ]
      }),
      showForm && jsx(TagForm, {
        tag: editingTag,
        parentTag,
        tags: hierarchicalTags,
        onCancel: () => {
          setShowForm(false);
          setEditingTag(null);
          setParentTag(null);
        },
        onSave: saveTag
      }),
      jsx("section", {
        className: "grid gap-3 sm:grid-cols-3",
        children: [
          ["كل الوسوم", hierarchicalTags.length, Hash],
          ["وسوم جذر", rootCount, FolderTree],
          ["وسوم فرعية", childCount, ChevronLeft]
        ].map(([label, value, Icon]) => jsxs("div", {
          className: "va-metric-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right",
          children: [
            jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              jsx("span", { className: "text-sm text-gray-500", children: label }),
              jsx(Icon, { className: "h-5 w-5 text-emerald-400" })
            ] }),
            jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: formatNumber(value) })
          ]
        }, label))
      }),
      jsxs("section", {
        className: "va-filter-surface rounded-2xl border border-white/10 bg-gray-900/45 p-4",
        children: [
          jsxs("label", { className: "relative block", children: [
            jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
            jsx("input", {
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: "بحث في أسماء الوسوم أو المسارات...",
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40"
            })
          ] }),
          jsx("p", { className: "mt-3 text-xs text-gray-500", children: query.trim() ? `${formatNumber(filteredTags.length)} نتيجة بحث` : "يمكن ترتيب الوسوم أو إضافة فروع من نفس الشجرة." })
        ]
      }),
      query.trim() ? filteredTags.length ? jsx("section", {
        className: "grid gap-3 lg:grid-cols-2",
        children: filteredTags.map((tag, index) => jsx(FlatTagCard, {
          tag,
          tags: hierarchicalTags,
          index,
          onEdit: () => {
            setEditingTag(tag);
            setParentTag(null);
            setShowForm(true);
          },
          onDelete: () => deleteTag(tag)
        }, tag.id))
      }) : jsxs("section", {
        className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-900/35 p-10 text-center",
        children: [
          jsx(Search, { className: "mx-auto h-12 w-12 text-gray-600" }),
          jsx("h2", { className: "mt-3 text-lg font-bold text-white", children: "لا توجد وسوم مطابقة" }),
          jsx("p", { className: "mt-2 text-sm text-gray-500", children: "جرب كلمة أبسط أو امسح البحث للعودة إلى الشجرة." }),
          jsx("button", { type: "button", onClick: () => setQuery(""), className: "mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "مسح البحث" })
        ]
      }) : model.roots.length ? jsx("section", {
        className: "va-card rounded-2xl border border-white/10 bg-gray-900/45 p-4",
        role: "tree",
        "aria-label": "شجرة الوسوم الهرمية",
        children: model.roots.map((tag) => jsx(TagNode, {
          tag,
          level: 0,
          tags: hierarchicalTags,
          model,
          expandedIds,
          onToggle: toggleExpand,
          onCreateChild: startCreateChild,
          onEdit: (item) => {
            setEditingTag(item);
            setParentTag(null);
            setShowForm(true);
          },
          onDelete: deleteTag,
          onMove: moveTag,
          getTagUsageCount
        }, tag.id))
      }) : jsxs("section", {
        className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-900/35 p-10 text-center",
        children: [
          jsx(FolderTree, { className: "mx-auto h-12 w-12 text-gray-600" }),
          jsx("h2", { className: "mt-3 text-lg font-bold text-white", children: "ابدأ شجرة الوسوم" }),
          jsx("p", { className: "mt-2 text-sm text-gray-500", children: "أنشئ وسمًا جذرًا ثم أضف فروعًا لتسهيل الاستدعاء عبر #." }),
          jsx("button", { type: "button", onClick: startCreateRoot, className: "mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "إنشاء أول وسم" })
        ]
      })
    ]
  });
}

HierarchicalTagsPage.pageId = "htags";
HierarchicalTagsPage.migrationStatus = "native";

export default HierarchicalTagsPage;
