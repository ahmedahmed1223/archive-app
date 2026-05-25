import {
  useAppStore
} from "../stores/index.js";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  HardDrive,
  Tags,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { getFieldsForSelection } from "../features/types/viewModel.js";
import {
  createLocalFileValue,
  createVideoLocalFilePatch,
  createVideoItemValue,
  normalizeLocalFileValue,
  parseVideoTags
} from "../features/videos/viewModel.js";
import { formatFileSize } from "../utils/formatting.js";


const STEPS = [
  { id: "basic", label: "الأساسيات", icon: Video },
  { id: "classify", label: "التصنيف", icon: Database },
  { id: "fields", label: "الحقول", icon: FileText },
  { id: "review", label: "المراجعة", icon: Tags }
];

function fieldKey(field) {
  return field.storageKey || field.name || field.id;
}

function LocalFilePicker({ value, onFileSelect }) {
  const file = normalizeLocalFileValue(value);
  const inputRef = React.useRef(null);
  return jsxs("div", { className: "rounded-xl border border-dashed border-white/10 bg-gray-950/35 p-3", children: [
    jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      jsxs("div", { className: "flex min-w-0 items-center gap-2 text-sm text-gray-300", children: [
        jsx(HardDrive, { className: "h-4 w-4 shrink-0 text-emerald-300" }),
        jsx("span", { className: "truncate", children: file?.name || "لم يتم اختيار ملف" })
      ] }),
      jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600", children: "استعراض" })
    ] }),
    file && jsxs("div", { className: "mt-2 space-y-1 text-xs text-gray-600", children: [
      file.size > 0 && jsx("p", { children: formatFileSize(file.size) }),
      (file.relativePath || file.path) && jsx("p", { dir: "ltr", className: "truncate text-left", children: file.relativePath || file.path })
    ] }),
    jsx("input", {
      ref: inputRef,
      type: "file",
      onChange: (event) => {
        onFileSelect(event.target.files?.[0]);
        event.target.value = "";
      },
      style: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }
    })
  ] });
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
    return jsx(LocalFilePicker, { value, onFileSelect: (file) => onChange(key, createLocalFileValue(file)) });
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
  const [stepIndex, setStepIndex] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [path, setPath] = React.useState("");
  const [thumbnail, setThumbnail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [typeId, setTypeId] = React.useState(firstType?.id || "");
  const [subtypeId, setSubtypeId] = React.useState("");
  const [metadata, setMetadata] = React.useState({});

  const selectedType = contentTypes.find((type) => type.id === typeId);
  const subtypes = selectedType?.subtypes || [];
  const fields = React.useMemo(() => getFieldsForSelection(contentTypes, typeId, subtypeId), [contentTypes, subtypeId, typeId]);
  const currentStep = STEPS[stepIndex];
  const canSave = title.trim() && typeId;

  React.useEffect(() => {
    if (subtypeId && !subtypes.some((subtype) => subtype.id === subtypeId)) setSubtypeId("");
  }, [subtypeId, subtypes]);

  const updateMetadata = (key, value) => setMetadata((current) => ({ ...current, [key]: value }));
  const applyPrimaryLocalFile = (file) => {
    const patch = createVideoLocalFilePatch(file, { currentTitle: title });
    if (!patch) return;
    if (patch.title) setTitle(patch.title);
    setPath(patch.path);
    setMetadata((current) => ({ ...current, ...patch.metadata }));
  };

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
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", { className: "va-page-hero rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10", children: [
        jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Video, { className: "h-6 w-6 text-emerald-400" }), "إضافة فيديو"] }),
        jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "نموذج متعدد الخطوات لإضافة مادة أرشيفية بدون عرض كل الحقول دفعة واحدة." }),
        jsx("div", { className: "mt-5 grid gap-2 sm:grid-cols-4", children: STEPS.map((step, index) => {
          const Icon = step.icon;
          return jsxs("button", { type: "button", onClick: () => setStepIndex(index), "aria-pressed": stepIndex === index, className: `va-tool-button rounded-xl border p-3 text-right transition-colors ${stepIndex === index ? "border-emerald-500/35 bg-emerald-500/10 text-white" : "border-white/10 bg-gray-950/35 text-gray-500 hover:bg-white/5"}`, children: [
            jsx(Icon, { className: "mb-2 h-5 w-5 text-emerald-400" }),
            jsx("span", { className: "text-sm font-semibold", children: step.label })
          ] }, step.id);
        }) })
      ] }),
      jsxs("section", { className: "va-card rounded-2xl border border-white/10 bg-gray-900/45 p-5 text-right", children: [
        jsx("h2", { className: "mb-4 text-lg font-bold text-white", children: currentStep.label }),
        currentStep.id === "basic" && jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "العنوان" }), jsx("input", { value: title, onChange: (event) => setTitle(event.target.value), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "عنوان الفيديو" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الرابط أو المسار" }), jsx("input", { value: path, onChange: (event) => setPath(event.target.value), dir: "ltr", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "https:// أو D:\\..." })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("span", { children: "ملف محلي من الجهاز" }),
            jsx(LocalFilePicker, { value: metadata.localFile, onFileSelect: applyPrimaryLocalFile })
          ] }),
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
      jsxs("div", { className: "va-control-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gray-950/35 p-3", children: [
        jsx("button", { type: "button", disabled: stepIndex <= 0, onClick: () => setStepIndex((value) => Math.max(0, value - 1)), className: "va-secondary-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: [jsx(ChevronRight, { className: "h-4 w-4" }), "السابق"] }),
        jsxs("div", { className: "flex flex-wrap gap-2", children: [
          stepIndex < STEPS.length - 1 && jsx("button", { type: "button", onClick: () => setStepIndex((value) => Math.min(STEPS.length - 1, value + 1)), className: "va-primary-button inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: ["التالي", jsx(ChevronLeft, { className: "h-4 w-4" })] }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave, onClick: () => save(false), className: "va-primary-button rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وفتح التفاصيل" }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave, onClick: () => save(true), className: "va-secondary-button rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وإضافة آخر" })
        ] })
      ] })
    ]
  });
}

AddVideoPage.pageId = "add";
AddVideoPage.migrationStatus = "native";

export default AddVideoPage;
