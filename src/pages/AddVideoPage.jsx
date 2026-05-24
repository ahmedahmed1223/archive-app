import {
  Database,
  FileText,
  Tags,
  Video,
  legacyJsxRuntime,
  legacyMotion,
  legacyReact,
  useAppStore
} from "../runtime/legacyAdapter.js";
import { getFieldsForSelection } from "../features/types/viewModel.js";
import {
  createLocalFileValue,
  createVideoItemValue,
  parseVideoTags
} from "../features/videos/viewModel.js";

const { jsx, jsxs } = legacyJsxRuntime;
const motion = legacyMotion;

const STEPS = [
  { id: "basic", label: "الأساسيات", icon: Video },
  { id: "classify", label: "التصنيف", icon: Database },
  { id: "fields", label: "الحقول", icon: FileText },
  { id: "review", label: "المراجعة", icon: Tags }
];

function fieldKey(field) {
  return field.storageKey || field.name || field.id;
}

function FieldInput({ field, value, onChange }) {
  const key = fieldKey(field);
  const commonClass = "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40";
  if (field.type === "textarea" || field.type === "transcript") {
    return jsx("textarea", { value: value || "", onChange: (event) => onChange(key, event.target.value), rows: 3, className: `${commonClass} p-3`, placeholder: field.placeholder || field.label });
  }
  if (field.type === "checkbox") {
    return jsx("label", { className: "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-gray-950/35 px-3 text-sm text-gray-300", children: [
      jsx("input", { type: "checkbox", checked: !!value, onChange: (event) => onChange(key, event.target.checked) }),
      "نعم"
    ] });
  }
  if (field.type === "select" || field.type === "radio") {
    return jsx("select", { value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass, children: [
      jsx("option", { value: "", children: "اختر..." }),
      ...(field.options || []).map((option) => jsx("option", { value: option, children: option }, option))
    ] });
  }
  if (field.type === "tags" || field.type === "multiselect") {
    return jsx("input", { value: Array.isArray(value) ? value.join("، ") : value || "", onChange: (event) => onChange(key, parseVideoTags(event.target.value)), className: commonClass, placeholder: "قيم مفصولة بفاصلة" });
  }
  if (field.type === "localFile") {
    return jsxs("div", { className: "space-y-2", children: [
      jsx("input", { type: "file", onChange: (event) => onChange(key, createLocalFileValue(event.target.files?.[0])), className: "block w-full rounded-xl border border-dashed border-white/10 bg-gray-950/35 p-3 text-sm text-gray-300 file:ml-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-white" }),
      value?.name && jsx("p", { className: "truncate rounded-lg bg-gray-950/45 px-3 py-2 text-xs text-gray-400", children: value.name })
    ] });
  }
  return jsx("input", { type: field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text", value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass, placeholder: field.placeholder || field.label });
}

export function AddVideoPage() {
  const {
    contentTypes = [],
    addVideoItem,
    setCurrentPage,
    setSelectedItemId,
    showToast
  } = useAppStore();

  const firstType = contentTypes.find((type) => type.status !== "archived") || contentTypes[0];
  const [stepIndex, setStepIndex] = legacyReact.useState(0);
  const [title, setTitle] = legacyReact.useState("");
  const [path, setPath] = legacyReact.useState("");
  const [thumbnail, setThumbnail] = legacyReact.useState("");
  const [notes, setNotes] = legacyReact.useState("");
  const [tags, setTags] = legacyReact.useState("");
  const [typeId, setTypeId] = legacyReact.useState(firstType?.id || "");
  const [subtypeId, setSubtypeId] = legacyReact.useState("");
  const [metadata, setMetadata] = legacyReact.useState({});

  const selectedType = contentTypes.find((type) => type.id === typeId);
  const subtypes = selectedType?.subtypes || [];
  const fields = legacyReact.useMemo(() => getFieldsForSelection(contentTypes, typeId, subtypeId), [contentTypes, subtypeId, typeId]);
  const currentStep = STEPS[stepIndex];
  const canSave = title.trim() && typeId;

  legacyReact.useEffect(() => {
    if (subtypeId && !subtypes.some((subtype) => subtype.id === subtypeId)) setSubtypeId("");
  }, [subtypeId, subtypes]);

  const updateMetadata = (key, value) => setMetadata((current) => ({ ...current, [key]: value }));

  const save = async (addAnother = false) => {
    if (!canSave) return;
    const item = createVideoItemValue({
      title,
      path,
      thumbnail,
      notes,
      tags,
      type: typeId,
      subtype: subtypeId,
      metadata
    });
    try {
      await addVideoItem?.(item);
      showToast?.("تمت إضافة الفيديو", "success");
      if (addAnother) {
        setTitle("");
        setPath("");
        setThumbnail("");
        setNotes("");
        setTags("");
        setMetadata({});
        setStepIndex(0);
        return;
      }
      setSelectedItemId?.(item.id);
      setCurrentPage?.("detail");
    } catch (error) {
      showToast?.("تعذر إضافة الفيديو", "error");
    }
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
    className: "space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", { className: "rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10", children: [
        jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Video, { className: "h-6 w-6 text-emerald-400" }), "إضافة فيديو"] }),
        jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "نموذج متعدد الخطوات لإضافة مادة أرشيفية بدون عرض كل الحقول دفعة واحدة." }),
        jsx("div", { className: "mt-5 grid gap-2 sm:grid-cols-4", children: STEPS.map((step, index) => {
          const Icon = step.icon;
          return jsxs("button", { type: "button", onClick: () => setStepIndex(index), className: `rounded-xl border p-3 text-right transition-colors ${stepIndex === index ? "border-emerald-500/35 bg-emerald-500/10 text-white" : "border-white/10 bg-gray-950/35 text-gray-500 hover:bg-white/5"}`, children: [
            jsx(Icon, { className: "mb-2 h-5 w-5 text-emerald-400" }),
            jsx("span", { className: "text-sm font-semibold", children: step.label })
          ] }, step.id);
        }) })
      ] }),
      jsxs("section", { className: "rounded-2xl border border-white/10 bg-gray-900/45 p-5 text-right", children: [
        jsx("h2", { className: "mb-4 text-lg font-bold text-white", children: currentStep.label }),
        currentStep.id === "basic" && jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "العنوان" }), jsx("input", { value: title, onChange: (event) => setTitle(event.target.value), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "عنوان الفيديو" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الرابط أو المسار" }), jsx("input", { value: path, onChange: (event) => setPath(event.target.value), dir: "ltr", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "https:// أو D:\\..." })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الصورة المصغرة" }), jsx("input", { value: thumbnail, onChange: (event) => setThumbnail(event.target.value), dir: "ltr", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "رابط صورة اختياري" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "ملاحظات" }), jsx("textarea", { value: notes, onChange: (event) => setNotes(event.target.value), className: "min-h-[100px] w-full rounded-xl border border-white/10 bg-gray-950/45 p-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "ملخص أو ملاحظات أرشيفية" })] })
        ] }),
        currentStep.id === "classify" && jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "نوع المحتوى" }), jsx("select", { value: typeId, onChange: (event) => setTypeId(event.target.value), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", children: contentTypes.filter((type) => type.status !== "archived").map((type) => jsx("option", { value: type.id, children: type.name }, type.id)) })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الفرع" }), jsx("select", { value: subtypeId, onChange: (event) => setSubtypeId(event.target.value), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", children: [jsx("option", { value: "", children: "بدون فرع" }), ...subtypes.map((subtype) => jsx("option", { value: subtype.id, children: subtype.name }, subtype.id))] })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "الوسوم" }), jsx("input", { value: tags, onChange: (event) => setTags(event.target.value), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "وسوم مفصولة بفاصلة، ويمكن استخدام مسارات الوسوم الهرمية" })] })
        ] }),
        currentStep.id === "fields" && (fields.length ? jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: fields.map((field) => jsxs("label", { className: `space-y-1 text-sm text-gray-300 ${field.type === "textarea" || field.type === "localFile" ? "lg:col-span-2" : ""}`, children: [
          jsxs("span", { children: [field.label, field.required && jsx("span", { className: "text-red-300", children: " *" })] }),
          jsx(FieldInput, { field, value: metadata[fieldKey(field)], onChange: updateMetadata }),
          field.description && jsx("span", { className: "text-xs text-gray-600", children: field.description })
        ] }, field.id)) }) : jsx("p", { className: "rounded-xl border border-dashed border-white/10 bg-gray-950/35 p-6 text-center text-sm text-gray-500", children: "لا توجد حقول مخصصة لهذا النوع." })),
        currentStep.id === "review" && jsxs("div", { className: "grid gap-3 lg:grid-cols-2", children: [
          jsx("p", { className: "rounded-xl border border-white/10 bg-gray-950/35 p-3 text-sm text-gray-300", children: `العنوان: ${title || "غير محدد"}` }),
          jsx("p", { className: "rounded-xl border border-white/10 bg-gray-950/35 p-3 text-sm text-gray-300", children: `النوع: ${selectedType?.name || "غير محدد"}` }),
          jsx("p", { className: "rounded-xl border border-white/10 bg-gray-950/35 p-3 text-sm text-gray-300", children: `عدد الوسوم: ${parseVideoTags(tags).length}` }),
          jsx("p", { className: "rounded-xl border border-white/10 bg-gray-950/35 p-3 text-sm text-gray-300", children: `حقول مخصصة: ${Object.keys(metadata).length}` })
        ] })
      ] }),
      jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gray-950/35 p-3", children: [
        jsx("button", { type: "button", disabled: stepIndex <= 0, onClick: () => setStepIndex((value) => Math.max(0, value - 1)), className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "السابق" }),
        jsxs("div", { className: "flex flex-wrap gap-2", children: [
          stepIndex < STEPS.length - 1 && jsx("button", { type: "button", onClick: () => setStepIndex((value) => Math.min(STEPS.length - 1, value + 1)), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "التالي" }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave, onClick: () => save(false), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وفتح التفاصيل" }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave, onClick: () => save(true), className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وإضافة آخر" })
        ] })
      ] })
    ]
  });
}

AddVideoPage.pageId = "add";
AddVideoPage.migrationStatus = "native";

export default AddVideoPage;
