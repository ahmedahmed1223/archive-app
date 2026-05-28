import {
  useAppStore
} from "../stores/index.js";
import {
  Database,
  Eye,
  FolderOpen,
  Layers3,
  Palette,
  PenLine,
  Plus,
  Search,
  Trash2,
  Workflow,
  X
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { MotionPage, PageHero } from "../components/ui/V1Primitives.jsx";
import {
  FIELD_TYPE_OPTIONS,
  TYPE_COLORS,
  createContentTypeValue,
  createCustomFieldValue,
  createSubtypeValue,
  getFilteredContentTypes,
  getTypeUsageCounts,
  parseFieldOptions
} from "../features/types/viewModel.js";
import { formatNumber } from "../utils/formatting.js";


function TypeBasicsForm({ draft, setDraft }) {
  // Switched the 3-column row to md: (≥768px). The previous lg: kept the
  // form vertical on standard 13-15" laptops in split-screen mode and on
  // most tablets. Icon column shrunk to 5rem so it doesn't dominate.
  return jsxs("div", {
    className: "grid gap-3 md:grid-cols-[5rem_1.5fr_1.2fr]",
    children: [
      jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
        jsx("span", { children: "الأيقونة" }),
        jsx("input", { value: draft.icon || "📁", onChange: (event) => setDraft({ ...draft, icon: event.target.value.slice(0, 4), iconSpec: { type: "emoji", value: event.target.value.slice(0, 4) || "📁" } }), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-center text-xl text-white outline-none focus:border-emerald-500/40" })
      ] }),
      jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
        jsx("span", { children: "اسم النوع" }),
        jsx("input", { value: draft.name || "", onChange: (event) => setDraft({ ...draft, name: event.target.value }), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "مثال: مقابلات" })
      ] }),
      jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
        jsx("span", { children: "اسم داخلي/إنجليزي" }),
        jsx("input", { value: draft.nameEn || "", onChange: (event) => setDraft({ ...draft, nameEn: event.target.value }), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "interviews" })
      ] }),
      jsxs("div", { className: "space-y-1 md:col-span-3", children: [
        jsx("span", { className: "text-sm text-gray-300", children: "اللون" }),
        jsx("div", { className: "flex flex-wrap gap-2", role: "radiogroup", "aria-label": "اختر لون النوع", children: TYPE_COLORS.map((color) => jsx("button", { type: "button", role: "radio", "aria-checked": draft.color === color, onClick: () => setDraft({ ...draft, color }), className: `h-8 w-8 rounded-full border transition-transform ${draft.color === color ? "scale-110 border-white ring-2 ring-white/25" : "border-white/10 hover:scale-105"}`, style: { backgroundColor: color }, "aria-label": `اختيار لون ${color}` }, color)) })
      ] })
    ]
  });
}

function SubtypesEditor({ draft, setDraft }) {
  const [name, setName] = React.useState("");
  const addSubtype = () => {
    if (!name.trim()) return;
    setDraft({
      ...draft,
      subtypes: [...(draft.subtypes || []), createSubtypeValue({ name, order: draft.subtypes?.length || 0 })]
    });
    setName("");
  };

  const removeSubtype = (id) => setDraft({ ...draft, subtypes: (draft.subtypes || []).filter((item) => item.id !== id) });

  const handleKey = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSubtype();
    }
  };
  const subtypes = draft.subtypes || [];

  return jsxs("section", {
    className: "rounded-2xl va-surface-subtle border p-4",
    children: [
      jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        jsx("h3", { className: "text-sm font-bold text-white", children: "الفروع" }),
        jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400", children: `${subtypes.length} فرع` })
      ] }),
      jsxs("div", { className: "mt-3 flex gap-2", children: [
        jsx("input", {
          value: name,
          onChange: (event) => setName(event.target.value),
          onKeyDown: handleKey,
          className: "min-h-10 min-w-0 flex-1 va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40",
          placeholder: "اسم الفرع (مثلاً: مقابلات سياسية)",
          "aria-label": "اسم الفرع الجديد"
        }),
        jsx("button", {
          type: "button",
          onClick: addSubtype,
          disabled: !name.trim(),
          className: "va-primary-button shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
          children: "إضافة"
        })
      ] }),
      subtypes.length ? jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: subtypes.map((subtype) => jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-200", children: [
        subtype.name,
        jsx("button", { type: "button", onClick: () => removeSubtype(subtype.id), className: "rounded-full p-0.5 text-gray-400 hover:bg-red-500/15 hover:text-red-300", "aria-label": `حذف الفرع ${subtype.name}`, children: jsx(X, { className: "h-3.5 w-3.5" }) })
      ] }, subtype.id)) }) : jsx("p", { className: "mt-3 text-xs text-gray-500", children: "لا توجد فروع بعد. أضف فرعاً لتقسيم العناصر داخل هذا النوع." })
    ]
  });
}

function FieldsEditor({ draft, setDraft }) {
  const [fieldDraft, setFieldDraft] = React.useState({ label: "", type: "text", options: "", required: false });

  const addField = () => {
    if (!fieldDraft.label.trim()) return;
    const field = createCustomFieldValue({
      ...fieldDraft,
      options: parseFieldOptions(fieldDraft.options),
      order: draft.fields?.length || 0
    });
    setDraft({ ...draft, fields: [...(draft.fields || []), field] });
    setFieldDraft({ label: "", type: "text", options: "", required: false });
  };

  const removeField = (id) => setDraft({ ...draft, fields: (draft.fields || []).filter((field) => field.id !== id) });
  const toggleField = (id, key) => setDraft({
    ...draft,
    fields: (draft.fields || []).map((field) => field.id === id ? { ...field, [key]: !field[key] } : field)
  });

  const showOptionsInput = ["select", "tags", "radio", "multiselect"].includes(fieldDraft.type);

  return jsxs("section", {
    className: "rounded-2xl va-surface-subtle border p-4",
    children: [
      jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        jsx("h3", { className: "text-sm font-bold text-white", children: "الحقول المخصصة" }),
        jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200", children: "يدعم ملف محلي" })
      ] }),
      // Add-field row — single horizontal layout at sm: so 13-15"
      // laptops never see this stacked. Name takes the flex remainder
      // while type/required/add stay at intrinsic width.
      jsxs("div", { className: "mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto_auto]", children: [
        jsx("input", {
          value: fieldDraft.label,
          onChange: (event) => setFieldDraft({ ...fieldDraft, label: event.target.value }),
          className: "min-h-10 va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40",
          placeholder: "اسم الحقل",
          "aria-label": "اسم الحقل المخصص"
        }),
        jsx("select", {
          value: fieldDraft.type,
          onChange: (event) => setFieldDraft({ ...fieldDraft, type: event.target.value }),
          className: "min-h-10 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40",
          "aria-label": "نوع الحقل",
          children: FIELD_TYPE_OPTIONS.map((type) => jsx("option", { value: type.id, children: type.label }, type.id))
        }),
        jsxs("label", {
          className: `inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${fieldDraft.required ? "border-amber-500/35 bg-amber-500/15 text-amber-100" : "border-white/10 bg-gray-950/35 text-gray-300 hover:bg-white/5"}`,
          children: [
            jsx("input", { type: "checkbox", checked: fieldDraft.required, onChange: (event) => setFieldDraft({ ...fieldDraft, required: event.target.checked }) }),
            "مطلوب"
          ]
        }),
        jsx("button", {
          type: "button",
          onClick: addField,
          disabled: !fieldDraft.label.trim(),
          className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
          children: "إضافة الحقل"
        })
      ] }),
      showOptionsInput && jsxs("div", {
        className: "mt-2 rounded-xl va-surface-muted border px-3 py-2",
        children: [
          jsx("span", { className: "block text-[11px] font-medium text-gray-400", children: "خيارات الحقل (مفصولة بفاصلة)" }),
          jsx("input", {
            value: fieldDraft.options,
            onChange: (event) => setFieldDraft({ ...fieldDraft, options: event.target.value }),
            className: "mt-1 min-h-10 w-full bg-transparent text-sm text-white outline-none",
            placeholder: "خيار 1، خيار 2، خيار 3",
            "aria-label": "قيم الخيارات"
          })
        ]
      }),
      (draft.fields || []).length ? jsx("div", { className: "mt-3 space-y-2", children: (draft.fields || []).map((field) => jsxs("div", {
        // Field list rows — go horizontal at sm:. Name+key share the
        // first cell; chip/toggle/delete take intrinsic widths.
        className: "grid items-center gap-2 rounded-xl va-surface-muted border p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]",
        children: [
          jsxs("div", { className: "min-w-0", children: [
            jsx("p", { className: "truncate text-sm font-semibold text-white", children: field.label }),
            jsx("p", { className: "truncate text-xs text-gray-500 font-mono", dir: "ltr", children: field.storageKey || field.name })
          ] }),
          jsx("span", { className: "shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300", children: FIELD_TYPE_OPTIONS.find((type) => type.id === field.type)?.label || field.type }),
          jsx("button", {
            type: "button",
            onClick: () => toggleField(field.id, "required"),
            "aria-pressed": !!field.required,
            className: `shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${field.required ? "border-amber-500/35 bg-amber-500/15 text-amber-100" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"}`,
            children: field.required ? "مطلوب" : "اختياري"
          }),
          jsx("button", {
            type: "button",
            onClick: () => removeField(field.id),
            "aria-label": `حذف الحقل ${field.label}`,
            className: "shrink-0 rounded-lg border border-transparent px-3 py-1.5 text-xs text-red-300 hover:border-red-500/25 hover:bg-red-500/10",
            children: "حذف"
          })
        ]
      }, field.id)) }) : jsx("p", { className: "mt-3 text-xs text-gray-500", children: "لا توجد حقول مخصصة بعد." })
    ]
  });
}

function TypeEditor({ type, onCancel, onSave }) {
  const [draft, setDraft] = React.useState(() => createContentTypeValue(type || { name: "", icon: "📁", color: "#6366f1" }));

  const save = () => {
    if (!draft.name.trim()) return;
    onSave(createContentTypeValue(draft));
  };

  return jsxs("section", {
    className: "space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-right",
    dir: "rtl",
    children: [
      jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        jsx("h2", { className: "text-base font-bold text-white", children: type ? "تعديل نوع محتوى" : "نوع محتوى جديد" }),
        jsxs("div", { className: "flex flex-wrap gap-2", children: [
          jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
          jsx("button", { type: "button", onClick: save, disabled: !draft.name.trim(), className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40", children: type ? "حفظ النوع" : "إنشاء النوع" })
        ] })
      ] }),
      jsx(TypeBasicsForm, { draft, setDraft }),
      // Side-by-side at xl: so a typical 1280px+ screen shows the
      // editor compactly. Below xl they stack — both panels still
      // render fully horizontal internally.
      jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
        jsx(SubtypesEditor, { draft, setDraft }),
        jsx(FieldsEditor, { draft, setDraft })
      ] })
    ]
  });
}

function TypeCard({ type, count, active, index, onOpen, onEdit, onArchive }) {
  const accentColor = type.color || "#6366f1";
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    onClick: onOpen,
    className: `va-entity-card cursor-pointer rounded-2xl border p-4 text-right transition-all ${active ? "border-emerald-500/35 bg-emerald-500/10" : "border-white/10 bg-gray-900/45 hover:border-white/20"}`,
    style: { boxShadow: `inset -3px 0 0 0 ${accentColor}${active ? "88" : "44"}` },
    children: [
      jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
          jsx("span", {
            className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl",
            style: { backgroundColor: `${accentColor}22`, color: accentColor, boxShadow: `0 0 0 1px ${accentColor}30` },
            children: type.icon || "📁"
          }),
          jsxs("div", { className: "min-w-0", children: [
            jsx("h3", { className: "truncate text-base font-bold text-white", children: type.name || "نوع بدون اسم" }),
            jsx("p", { className: "mt-1 text-xs text-gray-600", children: `${formatNumber(count)} عنصر، ${formatNumber(type.subtypes?.length || 0)} فرع، ${formatNumber(type.fields?.length || 0)} حقل` }),
            type.status === "archived" && jsx("span", { className: "mt-2 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مؤرشف" })
          ] })
        ] }),
        jsxs("div", { className: "flex shrink-0 gap-1", onClick: (event) => event.stopPropagation(), children: [
          jsx("button", { type: "button", onClick: onEdit, className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", "aria-label": `تعديل ${type.name}`, children: jsx(PenLine, { className: "h-4 w-4" }) }),
          jsx("button", { type: "button", onClick: onArchive, className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300", "aria-label": `أرشفة ${type.name}`, children: jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] })
    ]
  }, type.id);
}

export function TypesPage() {
  const {
    contentTypes = [],
    videoItems = [],
    settings = {},
    addContentType,
    updateContentType,
    deleteContentType,
    showToast
  } = useAppStore();

  const [query, setQuery] = React.useState("");
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const [selectedTypeId, setSelectedTypeId] = React.useState(contentTypes.find((type) => type.status !== "archived")?.id || contentTypes[0]?.id || null);
  const [editingType, setEditingType] = React.useState(null);
  const [showEditor, setShowEditor] = React.useState(false);

  const filteredTypes = React.useMemo(() => getFilteredContentTypes(contentTypes, query, includeArchived), [contentTypes, includeArchived, query]);
  const usageCounts = React.useMemo(() => getTypeUsageCounts(contentTypes, videoItems), [contentTypes, videoItems]);
  const selectedType = contentTypes.find((type) => type.id === selectedTypeId) || filteredTypes[0] || null;
  const activeTypes = contentTypes.filter((type) => type.status !== "archived");
  const totalSubtypes = contentTypes.reduce((sum, type) => sum + (type.subtypes?.length || 0), 0);
  const totalFields = contentTypes.reduce((sum, type) => sum + (type.fields?.length || 0), 0);

  React.useEffect(() => {
    if (selectedTypeId && contentTypes.some((type) => type.id === selectedTypeId)) return;
    setSelectedTypeId(filteredTypes[0]?.id || null);
  }, [contentTypes, filteredTypes, selectedTypeId]);

  const saveType = async (type) => {
    try {
      if (editingType) await updateContentType?.(type);
      else await addContentType?.(type);
      setSelectedTypeId(type.id);
      setShowEditor(false);
      setEditingType(null);
    } catch (error) {
      showToast?.("تعذر حفظ نوع المحتوى", "error");
    }
  };

  const archiveType = async (type) => {
    const confirmed = await appConfirm(`هل تريد أرشفة نوع المحتوى "${type.name}"؟ لن يتم حذف عناصر الفيديو.`, {
      title: "أرشفة نوع محتوى",
      kind: "warning",
      confirmLabel: "أرشفة"
    });
    if (!confirmed) return;
    await deleteContentType?.(type.id);
  };

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsx(PageHero, {
        icon: jsx(Database, { className: "h-6 w-6 text-emerald-400" }),
        title: "إدارة الأنواع والحقول",
        description: "أنواع المحتوى والفروع والحقول المخصصة، مع دعم حقل ملف محلي يحفظ metadata فقط.",
        actions: jsxs("button", { type: "button", onClick: () => { setEditingType(null); setShowEditor(true); }, className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white", children: [jsx(Plus, { className: "h-4 w-4" }), "نوع جديد"] }),
        children: jsx("div", { className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [
          { id: "types", label: "أنواع نشطة", value: formatNumber(activeTypes.length, settings.numberSystem), icon: Layers3 },
          { id: "subtypes", label: "فروع", value: formatNumber(totalSubtypes, settings.numberSystem), icon: Workflow },
          { id: "fields", label: "حقول مخصصة", value: formatNumber(totalFields, settings.numberSystem), icon: Database },
          { id: "items", label: "عناصر مرتبطة", value: formatNumber(videoItems.length, settings.numberSystem), icon: Eye }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return jsxs(motion.div, {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.18, delay: index * 0.03 },
            className: "rounded-2xl va-surface-subtle border p-4",
            children: [
              jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                jsxs("div", { className: "min-w-0", children: [
                  jsx("p", { className: "text-xs text-gray-500", children: stat.label }),
                  jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: stat.value })
                ] }),
                jsx("span", { className: "va-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", children: jsx(Icon, { className: "h-5 w-5" }) })
              ] })
            ]
          }, stat.id);
        }) })
      }),
      jsxs("section", { className: "va-control-surface rounded-2xl va-surface-muted border p-4 text-right", children: [
        jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
          jsx(Palette, { className: "h-5 w-5 text-emerald-300" }),
          jsx("h2", { className: "text-sm font-bold text-white", children: "رحلة بناء نوع محتوى" })
        ] }),
        jsx("div", { className: "grid gap-2 md:grid-cols-4", children: [
          ["الهوية", "اسم وأيقونة ولون"],
          ["الفروع", "تقسيم داخلي واضح"],
          ["الحقول", "بيانات مخصصة لكل نوع"],
          ["الاستخدام", "ظهور منظم في الإضافة والأرشيف"]
        ].map(([label, detail], index) => jsxs("div", { className: "rounded-xl va-surface-subtle border p-3", children: [
          jsxs("div", { className: "flex items-center gap-2", children: [
            jsx("span", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-[10px] font-bold text-emerald-200", children: index + 1 }),
            jsx("p", { className: "text-sm font-semibold text-white", children: label })
          ] }),
          jsx("p", { className: "mt-1 text-xs leading-5 text-gray-500", children: detail })
        ] }, label)) })
      ] }),
      showEditor && jsx(TypeEditor, { type: editingType, onCancel: () => { setShowEditor(false); setEditingType(null); }, onSave: saveType }),
      jsxs("section", { className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]", children: [
        jsxs("div", { className: "space-y-4", children: [
          jsxs("div", { className: "va-filter-surface grid gap-3 rounded-2xl va-surface-muted border p-3 md:grid-cols-[minmax(0,1fr)_auto]", children: [
            jsxs("label", { className: "relative block", children: [
              jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
              jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "بحث في الأنواع والفروع...", className: "min-h-11 w-full va-surface-deep rounded-xl border py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40" })
            ] }),
            jsx("label", { className: "inline-flex min-h-11 items-center gap-2 va-surface-muted rounded-xl border px-3 text-sm text-gray-300", children: [
              jsx("input", { type: "checkbox", checked: includeArchived, onChange: (event) => setIncludeArchived(event.target.checked) }),
              "إظهار المؤرشف"
            ] })
          ] }),
          filteredTypes.length ? jsx("div", { className: "grid gap-3 lg:grid-cols-2", children: filteredTypes.map((type, index) => jsx(TypeCard, { type, index, count: usageCounts[type.id] || 0, active: selectedType?.id === type.id, onOpen: () => setSelectedTypeId(type.id), onEdit: () => { setEditingType(type); setShowEditor(true); }, onArchive: () => archiveType(type) }, type.id)) }) : jsx("div", { className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-900/35", children: jsx(EmptyState, {
            type: "types",
            title: "لا توجد أنواع مطابقة",
            description: "امسح البحث أو أنشئ نوعًا جديدًا."
          }) })
        ] }),
        jsxs("aside", { className: "va-preview-panel rounded-2xl va-surface-muted border p-4 text-right", children: selectedType ? [
          jsxs("div", { className: "flex items-start gap-3", children: [
            jsx("span", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl", style: { backgroundColor: `${selectedType.color || "#6366f1"}22`, color: selectedType.color || "#6366f1" }, children: selectedType.icon || "📁" }),
            jsxs("div", { className: "min-w-0", children: [
              jsx("h2", { className: "text-lg font-bold text-white", children: selectedType.name }),
              jsx("p", { className: "mt-1 text-xs text-gray-600", dir: "ltr", children: selectedType.nameEn || selectedType.id }),
              jsx("p", { className: "mt-2 text-sm text-gray-500", children: `${formatNumber(usageCounts[selectedType.id] || 0, settings.numberSystem)} عنصر يستخدم هذا النوع` })
            ] })
          ] }),
          jsxs("div", { className: "mt-5 space-y-4", children: [
            jsxs("section", { children: [
              jsx("h3", { className: "mb-2 text-sm font-bold text-white", children: "الفروع" }),
              (selectedType.subtypes || []).length ? jsx("div", { className: "flex flex-wrap gap-2", children: selectedType.subtypes.map((subtype) => jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300", children: subtype.name }, subtype.id)) }) : jsx("p", { className: "text-xs text-gray-600", children: "لا توجد فروع." })
            ] }),
            jsxs("section", { children: [
              jsx("h3", { className: "mb-2 text-sm font-bold text-white", children: "الحقول" }),
              (selectedType.fields || []).length ? jsx("div", { className: "space-y-2", children: selectedType.fields.map((field) => jsxs("div", { className: "rounded-xl va-surface-muted border p-3", children: [
                jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
                  jsx("p", { className: "text-sm font-semibold text-white", children: field.label }),
                  jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400", children: FIELD_TYPE_OPTIONS.find((type) => type.id === field.type)?.label || field.type })
                ] }),
                jsx("p", { className: "mt-1 text-xs text-gray-600", dir: "ltr", children: field.storageKey || field.name })
              ] }, field.id)) }) : jsx("p", { className: "text-xs text-gray-600", children: "لا توجد حقول مخصصة." })
            ] })
          ] })
        ] : [
          jsx("div", { className: "flex flex-col items-center justify-center py-8 text-center", children: [
            jsx(FolderOpen, { className: "h-12 w-12 text-gray-700" }),
            jsx("p", { className: "mt-3 text-sm font-medium text-gray-500", children: "اختر نوعًا لعرض تفاصيله" }),
            jsx("p", { className: "mt-1 text-xs text-gray-600", children: "انقر على أي نوع في القائمة لعرض الفروع والحقول هنا." })
          ] })
        ] })
      ] })
    ]
  });
}

TypesPage.pageId = "types";
TypesPage.migrationStatus = "native";

export default TypesPage;
