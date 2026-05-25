import {
  useAppStore
} from "../stores/index.js";
import {
  FolderOpen,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import {
  COLLECTION_COLORS,
  createVirtualCollectionValue,
  getAvailableCollectionItems,
  getCollectionSummary,
  getFilteredCollections,
  resolveCollectionItems
} from "../features/collections/viewModel.js";
import { formatDateTime, formatNumber } from "../utils/formatting.js";


function CollectionForm({ collection, onCancel, onSave }) {
  const [name, setName] = React.useState(collection?.name || "");
  const [description, setDescription] = React.useState(collection?.description || "");
  const [icon, setIcon] = React.useState(collection?.icon || "📁");
  const [color, setColor] = React.useState(collection?.color || "#10b981");

  const save = () => {
    if (!name.trim()) return;
    onSave({
      ...collection,
      name,
      description,
      icon,
      color,
      type: collection?.type || "manual"
    });
  };

  return jsxs("section", {
    className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-right",
    dir: "rtl",
    children: [
      jsx("h2", { className: "text-base font-bold text-white", children: collection ? "تعديل مجموعة" : "مجموعة يدوية جديدة" }),
      jsxs("div", {
        className: "mt-4 grid gap-3 lg:grid-cols-[0.7fr_1fr]",
        children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "الرمز" }),
            jsx("input", { value: icon, onChange: (event) => setIcon(event.target.value.slice(0, 4)), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-center text-xl text-white outline-none focus:border-emerald-500/40" })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "اسم المجموعة" }),
            jsx("input", { value: name, onChange: (event) => setName(event.target.value), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "مثال: مقابلات مهمة" })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("span", { children: "الوصف" }),
            jsx("textarea", { value: description, onChange: (event) => setDescription(event.target.value), className: "min-h-[76px] w-full rounded-xl border border-white/10 bg-gray-950/45 p-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "ملاحظة قصيرة عن استخدام المجموعة" })
          ] }),
          jsxs("div", { className: "space-y-1 lg:col-span-2", children: [
            jsx("span", { className: "text-sm text-gray-300", children: "اللون" }),
            jsx("div", { className: "flex flex-wrap gap-2", children: COLLECTION_COLORS.map((item) => jsx("button", { type: "button", onClick: () => setColor(item), className: `h-8 w-8 rounded-full border ${color === item ? "scale-110 border-white ring-2 ring-white/25" : "border-white/10"}`, style: { backgroundColor: item }, "aria-label": `اختيار لون ${item}` }, item)) })
          ] })
        ]
      }),
      jsxs("div", { className: "mt-4 flex flex-wrap justify-end gap-2", children: [
        jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
        jsx("button", { type: "button", onClick: save, disabled: !name.trim(), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: collection ? "حفظ التعديل" : "إنشاء المجموعة" })
      ] })
    ]
  });
}

function CollectionCard({ collection, itemCount, active, index, onOpen, onEdit, onDelete }) {
  const isSmart = collection.type === "smart";
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    onClick: onOpen,
    className: `va-entity-card cursor-pointer rounded-2xl border p-4 text-right transition-colors ${active ? "border-emerald-500/35 bg-emerald-500/10" : "border-white/10 bg-gray-900/45 hover:border-emerald-500/25"}`,
    dir: "rtl",
    children: [
      jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
          jsx("span", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl", style: { backgroundColor: `${collection.color || "#10b981"}22`, color: collection.color || "#10b981" }, children: collection.icon || "📁" }),
          jsxs("div", { className: "min-w-0", children: [
            jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              jsx("h3", { className: "truncate text-base font-bold text-white", children: collection.name || "مجموعة بدون اسم" }),
              isSmart && jsxs("span", { className: "inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200", children: [jsx(Sparkles, { className: "h-3 w-3" }), "ذكية"] })
            ] }),
            collection.description && jsx("p", { className: "mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500", children: collection.description }),
            jsx("p", { className: "mt-3 text-xs text-gray-600", children: `${formatNumber(itemCount)} عنصر` })
          ] })
        ] }),
        jsxs("div", { className: "flex shrink-0 gap-1", onClick: (event) => event.stopPropagation(), children: [
          jsx("button", { type: "button", onClick: onEdit, className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", children: jsx(PenLine, { className: "h-4 w-4" }) }),
          jsx("button", { type: "button", onClick: onDelete, className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300", children: jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }),
      collection.updatedAt && jsx("p", { className: "mt-4 text-xs text-gray-700", children: `آخر تحديث: ${formatDateTime(collection.updatedAt)}` })
    ]
  }, collection.id);
}

function CollectionDetails({ collection, items, availableItems, onAddItems, onRemoveItem, onOpenItem }) {
  const [selectedIds, setSelectedIds] = React.useState([]);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [collection?.id]);

  if (!collection) {
    return jsxs("aside", {
      className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-900/35 p-8 text-center",
      children: [
        jsx(FolderOpen, { className: "mx-auto h-12 w-12 text-gray-600" }),
        jsx("h2", { className: "mt-3 text-lg font-bold text-white", children: "اختر مجموعة" }),
        jsx("p", { className: "mt-2 text-sm text-gray-500", children: "ستظهر معاينة العناصر وإجراءات الإضافة والإزالة هنا." })
      ]
    });
  }

  const canManageItems = collection.type !== "smart";

  return jsxs("aside", {
    className: "va-preview-panel space-y-4 rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right",
    dir: "rtl",
    children: [
      jsxs("div", { className: "flex items-start gap-3", children: [
        jsx("span", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl", style: { backgroundColor: `${collection.color || "#10b981"}22`, color: collection.color || "#10b981" }, children: collection.icon || "📁" }),
        jsxs("div", { className: "min-w-0", children: [
          jsx("h2", { className: "text-lg font-bold text-white", children: collection.name || "مجموعة" }),
          jsx("p", { className: "mt-1 text-sm text-gray-500", children: collection.description || (collection.type === "smart" ? "مجموعة ذكية تتحدث حسب قواعدها." : "مجموعة يدوية لتنظيم العناصر.") })
        ] })
      ] }),
      canManageItems && availableItems.length > 0 && jsxs("div", {
        className: "rounded-xl border border-white/10 bg-gray-950/35 p-3",
        children: [
          jsx("p", { className: "mb-2 text-sm font-semibold text-gray-300", children: "إضافة عناصر" }),
          jsx("select", {
            multiple: true,
            value: selectedIds,
            onChange: (event) => setSelectedIds(Array.from(event.target.selectedOptions).map((option) => option.value)),
            className: "h-32 w-full rounded-xl border border-white/10 bg-gray-950/60 p-2 text-sm text-white outline-none",
            children: availableItems.slice(0, 250).map((item) => jsx("option", { value: item.id, children: item.title || item.id }, item.id))
          }),
          jsx("button", { type: "button", disabled: selectedIds.length === 0, onClick: () => onAddItems(selectedIds), className: "mt-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: `إضافة ${formatNumber(selectedIds.length)}` })
        ]
      }),
      items.length ? jsx("div", {
        className: "space-y-2",
        children: items.slice(0, 80).map((item) => jsxs("div", {
          className: "grid gap-2 rounded-xl border border-white/5 bg-gray-950/35 p-3 sm:grid-cols-[1fr_auto]",
          children: [
            jsxs("button", { type: "button", onClick: () => onOpenItem(item), className: "min-w-0 text-right", children: [
              jsx("p", { className: "truncate text-sm font-semibold text-white", children: item.title || "بدون عنوان" }),
              jsx("p", { className: "mt-1 text-xs text-gray-600", children: item.updatedAt ? formatDateTime(item.updatedAt) : "بدون تاريخ" })
            ] }),
            canManageItems && jsx("button", { type: "button", onClick: () => onRemoveItem(item.id), className: "rounded-lg px-3 py-2 text-xs text-red-300 hover:bg-red-500/10", children: "إزالة" })
          ]
        }, item.id))
      }) : jsxs("div", {
        className: "rounded-xl border border-dashed border-white/10 bg-gray-950/30 p-6 text-center",
        children: [
          jsx(Video, { className: "mx-auto h-10 w-10 text-gray-600" }),
          jsx("p", { className: "mt-2 text-sm font-semibold text-gray-300", children: "المجموعة فارغة" }),
          jsx("p", { className: "mt-1 text-xs text-gray-600", children: canManageItems ? "أضف عناصر من القائمة أعلاه." : "ستظهر العناصر عندما تطابق قواعد المجموعة الذكية." })
        ]
      })
    ]
  });
}

export function CollectionsPage() {
  const {
    virtualCollections = [],
    videoItems = [],
    settings = {},
    addVirtualCollection,
    updateVirtualCollection,
    deleteVirtualCollection,
    addItemsToCollection,
    removeItemsFromCollection,
    setCurrentPage,
    setSelectedItemId,
    showToast
  } = useAppStore();

  const [query, setQuery] = React.useState("");
  const [selectedCollectionId, setSelectedCollectionId] = React.useState(virtualCollections[0]?.id || null);
  const [editingCollection, setEditingCollection] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);

  const filteredCollections = React.useMemo(() => getFilteredCollections(virtualCollections, query), [query, virtualCollections]);
  const selectedCollection = virtualCollections.find((collection) => collection.id === selectedCollectionId) || filteredCollections[0] || null;
  const selectedItems = React.useMemo(() => resolveCollectionItems(selectedCollection, videoItems), [selectedCollection, videoItems]);
  const availableItems = React.useMemo(() => getAvailableCollectionItems(selectedCollection, videoItems), [selectedCollection, videoItems]);
  const summary = React.useMemo(() => getCollectionSummary(virtualCollections, videoItems), [videoItems, virtualCollections]);

  React.useEffect(() => {
    if (selectedCollectionId && virtualCollections.some((collection) => collection.id === selectedCollectionId)) return;
    setSelectedCollectionId(filteredCollections[0]?.id || null);
  }, [filteredCollections, selectedCollectionId, virtualCollections]);

  const startCreate = () => {
    setEditingCollection(null);
    setShowForm(true);
  };

  const saveCollection = async (draft) => {
    try {
      if (editingCollection) {
        const updated = createVirtualCollectionValue({ ...editingCollection, ...draft, createdAt: editingCollection.createdAt });
        await updateVirtualCollection?.(updated);
        setSelectedCollectionId(updated.id);
      } else {
        const created = createVirtualCollectionValue(draft);
        await addVirtualCollection?.(created);
        setSelectedCollectionId(created.id);
      }
      setShowForm(false);
      setEditingCollection(null);
    } catch (error) {
      showToast?.("تعذر حفظ المجموعة", "error");
    }
  };

  const deleteCollection = async (collection) => {
    const confirmed = await appConfirm(`هل تريد حذف المجموعة "${collection.name}"؟ لن يتم حذف عناصر الفيديو نفسها.`, {
      title: "حذف مجموعة",
      kind: "danger",
      confirmLabel: "حذف"
    });
    if (!confirmed) return;
    try {
      await deleteVirtualCollection?.(collection.id);
      if (selectedCollectionId === collection.id) setSelectedCollectionId(null);
    } catch (error) {
      showToast?.("تعذر حذف المجموعة", "error");
    }
  };

  const openItem = (item) => {
    setSelectedItemId?.(item.id);
    setCurrentPage?.("detail");
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
              jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(FolderOpen, { className: "h-6 w-6 text-emerald-400" }), "المجموعات"] }),
              jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "تنظيم يدوي وذكي للعناصر مع معاينة مباشرة وإدارة سريعة للمحتوى داخل كل مجموعة." })
            ] }),
            jsx("button", { type: "button", onClick: startCreate, className: "inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: [jsx(Plus, { className: "h-4 w-4" }), "مجموعة جديدة"] })
          ] })
        ]
      }),
      showForm && jsx(CollectionForm, {
        collection: editingCollection,
        onCancel: () => {
          setShowForm(false);
          setEditingCollection(null);
        },
        onSave: saveCollection
      }),
      jsx("section", {
        className: "grid gap-3 sm:grid-cols-4",
        children: [
          ["كل المجموعات", summary.total, FolderOpen],
          ["يدوية", summary.manual, FolderOpen],
          ["ذكية", summary.smart, Sparkles],
          ["عناصر مرتبطة", summary.linkedItems, Video]
        ].map(([label, value, Icon]) => jsxs("div", { className: "va-metric-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right", children: [
          jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            jsx("span", { className: "text-sm text-gray-500", children: label }),
            jsx(Icon, { className: "h-5 w-5 text-emerald-400" })
          ] }),
          jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: formatNumber(value, settings.numberSystem) })
        ] }, label))
      }),
      jsxs("section", { className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]", children: [
        jsxs("div", { className: "space-y-4", children: [
          jsxs("label", { className: "va-filter-surface relative block rounded-2xl border border-white/10 bg-gray-900/45 p-3", children: [
            jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
            jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "بحث في المجموعات...", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40" })
          ] }),
          filteredCollections.length ? jsx("div", { className: "grid gap-3 lg:grid-cols-2", children: filteredCollections.map((collection, index) => jsx(CollectionCard, {
            collection,
            index,
            itemCount: resolveCollectionItems(collection, videoItems).length,
            active: selectedCollection?.id === collection.id,
            onOpen: () => setSelectedCollectionId(collection.id),
            onEdit: () => {
              setEditingCollection(collection);
              setShowForm(true);
            },
            onDelete: () => deleteCollection(collection)
          }, collection.id)) }) : jsx("div", { className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-900/35", children: jsx(EmptyState, {
            icon: jsx(FolderOpen, { className: "h-16 w-16" }),
            title: virtualCollections.length ? "لا توجد مجموعات مطابقة" : "ابدأ تنظيم الأرشيف",
            description: virtualCollections.length ? "امسح البحث أو استخدم كلمة أبسط." : "أنشئ مجموعة يدوية لتجميع الفيديوهات المهمة.",
            actionLabel: virtualCollections.length ? "مسح البحث" : "إنشاء مجموعة",
            onAction: virtualCollections.length ? () => setQuery("") : startCreate
          }) })
        ] }),
        jsx(CollectionDetails, {
          collection: selectedCollection,
          items: selectedItems,
          availableItems,
          onAddItems: async (ids) => {
            await addItemsToCollection?.(selectedCollection.id, ids);
            showToast?.("تمت إضافة العناصر للمجموعة", "success");
          },
          onRemoveItem: async (id) => {
            await removeItemsFromCollection?.(selectedCollection.id, [id]);
            showToast?.("تمت إزالة العنصر من المجموعة", "info");
          },
          onOpenItem: openItem
        })
      ] })
    ]
  });
}

CollectionsPage.pageId = "collections";
CollectionsPage.migrationStatus = "native";

export default CollectionsPage;
