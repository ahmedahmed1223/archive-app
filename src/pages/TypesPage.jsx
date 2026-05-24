import {
  Database,
  FolderOpen,
  PenLine,
  Plus,
  Search,
  Trash2,
  legacyJsxRuntime,
  legacyMotion,
  legacyReact,
  useAppStore
} from "../runtime/legacyAdapter.js";
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

const { jsx, jsxs } = legacyJsxRuntime;
const motion = legacyMotion;

function TypeBasicsForm({ draft, setDraft }) {
  return jsxs("div", {
    className: "grid gap-3 lg:grid-cols-[0.6fr_1fr_1fr]",
    children: [
      jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
        jsx("span", { children: "الأيقونة" }),
        jsx("input", { value: draft.icon || "📁", onChange: (event) => setDraft({ ...draft, icon: event.target.value.slice(0, 4), iconSpec: { type: "emoji", value: event.target.value.slice(0, 4) || "📁" } }), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-center text-xl text-white outline-none focus:border-emerald-500/40" })
      ] }),
      jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
        jsx("span", { children: "اسم النوع" }),
        jsx("input", { value: draft.name || "", onChange: (event) => setDraft({ ...draft, name: event.target.value }), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "مثال: مقابلات" })
      ] }),
      jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
        jsx("span", { children: "اسم داخلي/إنجليزي" }),
        jsx("input", { value: draft.nameEn || "", onChange: (event) => setDraft({ ...draft, nameEn: event.target.value }), dir: "ltr", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "interviews" })
      ] }),
      jsxs("div", { className: "space-y-1 lg:col-span-3", children: [
        jsx("span", { className: "text-sm text-gray-300", children: "اللون" }),
        jsx("div", { className: "flex flex-wrap gap-2", children: TYPE_COLORS.map((color) => jsx("button", { type: "button", onClick: () => setDraft({ ...draft, color }), className: `h-8 w-8 rounded-full border ${draft.color === color ? "scale-110 border-white ring-2 ring-white/25" : "border-white/10"}`, style: { backgroundColor: color }, "aria-label": `اختيار لون ${color}` }, color)) })
      ] })
    ]
  });
}

function SubtypesEditor({ draft, setDraft }) {
  const [name, setName] = legacyReact.useState("");
  const addSubtype = () => {
    if (!name.trim()) return;
    setDraft({
      ...draft,
      subtypes: [...(draft.subtypes || []), createSubtypeValue({ name, order: draft.subtypes?.length || 0 })]
    });
    setName("");
  };

  const removeSubtype = (id) => setDraft({ ...draft, subtypes: (draft.subtypes || []).filter((item) => item.id !== id) });

  return jsxs("section", {
    className: "rounded-2xl border border-white/10 bg-gray-950/25 p-4",
    children: [
      jsx("h3", { className: "text-sm font-bold text-white", children: "الفروع" }),
      jsxs("div", { className: "mt-3 flex gap-2", children: [
        jsx("input", { value: name, onChange: (event) => setName(event.target.value), className: "min-h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", placeholder: "اسم الفرع" }),
        jsx("button", { type: "button", onClick: addSubtype, className: "rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "إضافة" })
      ] }),
      (draft.subtypes || []).length ? jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: (draft.subtypes || []).map((subtype) => jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300", children: [
        subtype.name,
        jsx("button", { type: "button", onClick: () => removeSubtype(subtype.id), className: "text-gray-500 hover:text-red-300", children: "×" })
      ] }, subtype.id)) }) : jsx("p", { className: "mt-3 text-xs text-gray-600", children: "لا توجد فروع بعد." })
    ]
  });
}

function FieldsEditor({ draft, setDraft }) {
  const [fieldDraft, setFieldDraft] = legacyReact.useState({ label: "", type: "text", options: "", required: false });

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

  return jsxs("section", {
    className: "rounded-2xl border border-white/10 bg-gray-950/25 p-4",
    children: [
      jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        jsx("h3", { className: "text-sm font-bold text-white", children: "الحقول المخصصة" }),
        jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200", children: "يدعم ملف محلي" })
      ] }),
      jsxs("div", { className: "mt-3 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]", children: [
        jsx("input", { value: fieldDraft.label, onChange: (event) => setFieldDraft({ ...fieldDraft, label: event.target.value }), className: "min-h-10 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", placeholder: "اسم الحقل" }),
        jsx("select", { value: fieldDraft.type, onChange: (event) => setFieldDraft({ ...fieldDraft, type: event.target.value }), className: "min-h-10 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", children: FIELD_TYPE_OPTIONS.map((type) => jsx("option", { value: type.id, children: type.label }, type.id)) }),
        jsx("label", { className: "inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-3 text-sm text-gray-300", children: [
          jsx("input", { type: "checkbox", checked: fieldDraft.required, onChange: (event) => setFieldDraft({ ...fieldDraft, required: event.target.checked }) }),
          "مطلوب"
        ] }),
        jsx("button", { type: "button", onClick: addField, className: "rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "إضافة" })
      ] }),
      ["select", "tags"].includes(fieldDraft.type) && jsx("input", { value: fieldDraft.options, onChange: (event) => setFieldDraft({ ...fieldDraft, options: event.target.value }), className: "mt-2 min-h-10 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", placeholder: "خيارات مفصولة بفاصلة" }),
      (draft.fields || []).length ? jsx("div", { className: "mt-3 space-y-2", children: (draft.fields || []).map((field) => jsxs("div", { className: "grid gap-2 rounded-xl border border-white/5 bg-gray-950/35 p-3 sm:grid-cols-[1fr_auto_auto_auto]", children: [
        jsxs("div", { className: "min-w-0", children: [
          jsx("p", { className: "truncate text-sm font-semibold text-white", children: field.label }),
          jsx("p", { className: "truncate text-xs text-gray-600", dir: "ltr", children: field.storageKey || field.name })
        ] }),
        jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-400", children: FIELD_TYPE_OPTIONS.find((type) => type.id === field.type)?.label || field.type }),
        jsx("button", { type: "button", onClick: () => toggleField(field.id, "required"), className: `rounded-lg px-3 py-1 text-xs ${field.required ? "bg-amber-500/10 text-amber-200" : "bg-white/5 text-gray-500"}`, children: field.required ? "مطلوب" : "اختياري" }),
        jsx("button", { type: "button", onClick: () => removeField(field.id), className: "rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10", children: "حذف" })
      ] }, field.id)) }) : jsx("p", { className: "mt-3 text-xs text-gray-600", children: "لا توجد حقول مخصصة بعد." })
    ]
  });
}

function TypeEditor({ type, onCancel, onSave }) {
  const [draft, setDraft] = legacyReact.useState(() => createContentTypeValue(type || { name: "", icon: "📁", color: "#6366f1" }));

  const save = () => {
    if (!draft.name.trim()) return;
    onSave(createContentTypeValue(draft));
  };

  return jsxs("section", {
    className: "space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-right",
    dir: "rtl",
    children: [
      jsx("h2", { className: "text-base font-bold text-white", children: type ? "تعديل نوع محتوى" : "نوع محتوى جديد" }),
      jsx(TypeBasicsForm, { draft, setDraft }),
      jsx(SubtypesEditor, { draft, setDraft }),
      jsx(FieldsEditor, { draft, setDraft }),
      jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
        jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
        jsx("button", { type: "button", onClick: save, disabled: !draft.name.trim(), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: type ? "حفظ النوع" : "إنشاء النوع" })
      ] })
    ]
  });
}

function TypeCard({ type, count, active, index, onOpen, onEdit, onArchive }) {
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    onClick: onOpen,
    className: `cursor-pointer rounded-2xl border p-4 text-right transition-colors ${active ? "border-emerald-500/35 bg-emerald-500/10" : "border-white/10 bg-gray-900/45 hover:border-emerald-500/25"}`,
    children: [
      jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
          jsx("span", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl", style: { backgroundColor: `${type.color || "#6366f1"}22`, color: type.color || "#6366f1" }, children: type.icon || "📁" }),
          jsxs("div", { className: "min-w-0", children: [
            jsx("h3", { className: "truncate text-base font-bold text-white", children: type.name || "نوع بدون اسم" }),
            jsx("p", { className: "mt-1 text-xs text-gray-600", children: `${formatNumber(count)} عنصر، ${formatNumber(type.subtypes?.length || 0)} فرع، ${formatNumber(type.fields?.length || 0)} حقل` }),
            type.status === "archived" && jsx("span", { className: "mt-2 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200", children: "مؤرشف" })
          ] })
        ] }),
        jsxs("div", { className: "flex shrink-0 gap-1", onClick: (event) => event.stopPropagation(), children: [
          jsx("button", { type: "button", onClick: onEdit, className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", children: jsx(PenLine, { className: "h-4 w-4" }) }),
          jsx("button", { type: "button", onClick: onArchive, className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300", children: jsx(Trash2, { className: "h-4 w-4" }) })
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

  const [query, setQuery] = legacyReact.useState("");
  const [includeArchived, setIncludeArchived] = legacyReact.useState(false);
  const [selectedTypeId, setSelectedTypeId] = legacyReact.useState(contentTypes.find((type) => type.status !== "archived")?.id || contentTypes[0]?.id || null);
  const [editingType, setEditingType] = legacyReact.useState(null);
  const [showEditor, setShowEditor] = legacyReact.useState(false);

  const filteredTypes = legacyReact.useMemo(() => getFilteredContentTypes(contentTypes, query, includeArchived), [contentTypes, includeArchived, query]);
  const usageCounts = legacyReact.useMemo(() => getTypeUsageCounts(contentTypes, videoItems), [contentTypes, videoItems]);
  const selectedType = contentTypes.find((type) => type.id === selectedTypeId) || filteredTypes[0] || null;

  legacyReact.useEffect(() => {
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
    if (!window.confirm(`هل تريد أرشفة نوع المحتوى "${type.name}"؟ لن يتم حذف عناصر الفيديو.`)) return;
    await deleteContentType?.(type.id);
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
    className: "space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", { className: "rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10", children: [
        jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
          jsxs("div", { className: "min-w-0", children: [
            jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Database, { className: "h-6 w-6 text-emerald-400" }), "إدارة الأنواع والحقول"] }),
            jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "أنواع المحتوى والفروع والحقول المخصصة، مع دعم حقل ملف محلي يحفظ metadata فقط." })
          ] }),
          jsx("button", { type: "button", onClick: () => { setEditingType(null); setShowEditor(true); }, className: "inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: [jsx(Plus, { className: "h-4 w-4" }), "نوع جديد"] })
        ] })
      ] }),
      showEditor && jsx(TypeEditor, { type: editingType, onCancel: () => { setShowEditor(false); setEditingType(null); }, onSave: saveType }),
      jsxs("section", { className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]", children: [
        jsxs("div", { className: "space-y-4", children: [
          jsxs("div", { className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]", children: [
            jsxs("label", { className: "relative block", children: [
              jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
              jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "بحث في الأنواع والفروع...", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40" })
            ] }),
            jsx("label", { className: "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-3 text-sm text-gray-300", children: [
              jsx("input", { type: "checkbox", checked: includeArchived, onChange: (event) => setIncludeArchived(event.target.checked) }),
              "إظهار المؤرشف"
            ] })
          ] }),
          filteredTypes.length ? jsx("div", { className: "grid gap-3 lg:grid-cols-2", children: filteredTypes.map((type, index) => jsx(TypeCard, { type, index, count: usageCounts[type.id] || 0, active: selectedType?.id === type.id, onOpen: () => setSelectedTypeId(type.id), onEdit: () => { setEditingType(type); setShowEditor(true); }, onArchive: () => archiveType(type) }, type.id)) }) : jsxs("div", { className: "rounded-2xl border border-dashed border-white/10 bg-gray-900/35 p-10 text-center", children: [
            jsx(FolderOpen, { className: "mx-auto h-12 w-12 text-gray-600" }),
            jsx("h2", { className: "mt-3 text-lg font-bold text-white", children: "لا توجد أنواع مطابقة" }),
            jsx("p", { className: "mt-2 text-sm text-gray-500", children: "امسح البحث أو أنشئ نوعًا جديدًا." })
          ] })
        ] }),
        jsxs("aside", { className: "rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right", children: selectedType ? [
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
              (selectedType.fields || []).length ? jsx("div", { className: "space-y-2", children: selectedType.fields.map((field) => jsxs("div", { className: "rounded-xl border border-white/5 bg-gray-950/35 p-3", children: [
                jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
                  jsx("p", { className: "text-sm font-semibold text-white", children: field.label }),
                  jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400", children: FIELD_TYPE_OPTIONS.find((type) => type.id === field.type)?.label || field.type })
                ] }),
                jsx("p", { className: "mt-1 text-xs text-gray-600", dir: "ltr", children: field.storageKey || field.name })
              ] }, field.id)) }) : jsx("p", { className: "text-xs text-gray-600", children: "لا توجد حقول مخصصة." })
            ] })
          ] })
        ] : [
          jsx(FolderOpen, { className: "mx-auto h-12 w-12 text-gray-600" }),
          jsx("p", { className: "mt-3 text-center text-sm text-gray-500", children: "اختر نوعًا لعرض تفاصيله." })
        ] })
      ] })
    ]
  });
}

TypesPage.pageId = "types";
TypesPage.migrationStatus = "native";

export default TypesPage;
