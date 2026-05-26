import {
  useAppStore
} from "../stores/index.js";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Database,
  Eye,
  FileText,
  HardDrive,
  Sparkles,
  Tags,
  UploadCloud,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion } from "framer-motion";

import { getFieldsForSelection } from "../features/types/viewModel.js";
import {
  createLocalFileValue,
  createVideoLocalFilePatch,
  createVideoItemValue,
  normalizeLocalFileValue,
  parseVideoTags
} from "../features/videos/viewModel.js";
import { formatFileSize } from "../utils/formatting.js";
import { MotionPage, PageHero, WorkflowStepper } from "../components/ui/V1Primitives.jsx";


const STEPS = [
  { id: "basic", label: "الأساسيات", detail: "العنوان والمسار أو الملف", icon: Video },
  { id: "classify", label: "التصنيف", detail: "النوع والفرع والوسوم", icon: Database },
  { id: "fields", label: "الحقول", detail: "حقول النوع المختار", icon: FileText },
  { id: "review", label: "المراجعة", detail: "تأكيد سريع قبل الحفظ", icon: Tags }
];

function fieldKey(field) {
  return field.storageKey || field.name || field.id;
}

function LocalFilePicker({ value, onFileSelect }) {
  const file = normalizeLocalFileValue(value);
  const inputRef = React.useRef(null);
  const [dragActive, setDragActive] = React.useState(false);
  const readFile = (nextFile) => {
    if (nextFile) onFileSelect(nextFile);
  };
  return jsxs(motion.div, {
    whileHover: { y: -1 },
    className: `rounded-xl border border-dashed p-3 transition-colors ${dragActive ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/10 bg-gray-950/35"}`,
    onDragOver: (event) => {
      event.preventDefault();
      setDragActive(true);
    },
    onDragLeave: () => setDragActive(false),
    onDrop: (event) => {
      event.preventDefault();
      setDragActive(false);
      readFile(event.dataTransfer?.files?.[0]);
    },
    children: [
    jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      jsxs("div", { className: "flex min-w-0 items-center gap-2 text-sm text-gray-300", children: [
        jsx(file ? HardDrive : UploadCloud, { className: "h-4 w-4 shrink-0 text-emerald-300" }),
        jsx("span", { className: "truncate", children: file?.name || "لم يتم اختيار ملف" })
      ] }),
      jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "inline-flex min-h-9 items-center justify-center va-primary-button rounded-lg px-3 py-1.5 text-xs font-semibold text-white", children: "استعراض" })
    ] }),
    !file && jsx("p", { className: "mt-2 text-xs leading-5 text-gray-500", children: "يمكنك سحب ملف فيديو هنا وسيتم ملء الاسم والمسار تلقائيًا قدر الإمكان." }),
    file && jsxs("div", { className: "mt-2 space-y-1 text-xs text-gray-600", children: [
      file.size > 0 && jsx("p", { children: formatFileSize(file.size) }),
      (file.relativePath || file.path) && jsx("p", { dir: "ltr", className: "truncate text-left", children: file.relativePath || file.path })
    ] }),
    jsx("input", {
      ref: inputRef,
      type: "file",
      onChange: (event) => {
        readFile(event.target.files?.[0]);
        event.target.value = "";
      },
      style: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }
    })
  ] });
}

function FieldInput({ field, value, onChange }) {
  const key = fieldKey(field);
  const commonClass = "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40";
  if (field.type === "textarea" || field.type === "transcript") {
    return jsx("textarea", { value: value || "", onChange: (event) => onChange(key, event.target.value), rows: 3, className: `${commonClass} p-3`, placeholder: field.placeholder || field.label });
  }
  if (field.type === "checkbox") {
    return jsx("label", { className: "inline-flex min-h-11 items-center gap-2 va-surface-muted rounded-xl border px-3 text-sm text-gray-300", children: [
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
  const parsedTags = React.useMemo(() => parseVideoTags(tags), [tags]);
  const readyChecks = React.useMemo(() => [
    { id: "title", label: "عنوان واضح", ok: !!title.trim() },
    { id: "type", label: "تصنيف محدد", ok: !!typeId },
    { id: "source", label: "مصدر أو ملف", ok: !!(path.trim() || metadata.localFile) },
    { id: "fields", label: "حقول جاهزة", ok: fields.every((field) => !field.required || metadata[fieldKey(field)] !== undefined && metadata[fieldKey(field)] !== "") }
  ], [fields, metadata, path, title, typeId]);
  const readyCount = readyChecks.filter((check) => check.ok).length;
  const readyPercent = Math.round((readyCount / readyChecks.length) * 100);

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

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsx(PageHero, {
        icon: jsx(Video, { className: "h-6 w-6 text-emerald-400" }),
        title: "إضافة فيديو",
        description: "نموذج متعدد الخطوات لإضافة مادة أرشيفية بدون عرض كل الحقول دفعة واحدة.",
        children: jsx(WorkflowStepper, {
          steps: STEPS,
          activeStepId: currentStep.id,
          completedStepIds: STEPS.slice(0, stepIndex).map((step) => step.id),
          onStepClick: (stepId) => setStepIndex(Math.max(0, STEPS.findIndex((step) => step.id === stepId))),
          className: "mt-5 sm:grid-cols-4",
          compact: true
        })
      }),
      jsxs("section", { className: "grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]", children: [
        jsxs("div", { className: "va-card rounded-2xl va-surface-muted border p-4 text-right", children: [
          jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            jsxs("div", { className: "flex items-center gap-2", children: [
              jsx(ClipboardCheck, { className: "h-5 w-5 text-emerald-300" }),
              jsx("h2", { className: "text-sm font-bold text-white", children: "جاهزية الحفظ" })
            ] }),
            jsx("span", { dir: "ltr", className: "font-mono text-sm text-emerald-200", children: `${readyPercent}%` })
          ] }),
          jsx("div", { className: "mt-3 h-2 overflow-hidden rounded-full bg-white/10", dir: "rtl", children: jsx(motion.div, { className: "h-full rounded-full bg-emerald-400", initial: false, animate: { width: `${readyPercent}%` }, transition: { duration: 0.28 } }) }),
          jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: readyChecks.map((check) => jsxs("span", { className: `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${check.ok ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-gray-950/35 text-gray-500"}`, children: [
            check.ok ? jsx(CheckCircle2, { className: "h-3.5 w-3.5" }) : jsx(Circle, { className: "h-3.5 w-3.5" }),
            check.label
          ] }, check.id)) })
        ] }),
        jsxs("div", { className: "va-card rounded-2xl va-surface-muted border p-4 text-right", children: [
          jsxs("div", { className: "flex items-center gap-2", children: [
            jsx(Sparkles, { className: "h-5 w-5 text-amber-300" }),
            jsx("h2", { className: "text-sm font-bold text-white", children: "ملخص مباشر" })
          ] }),
          jsx("div", { className: "mt-3 grid gap-2 text-sm text-gray-400", children: [
            ["العنوان", title || "بانتظار الإدخال"],
            ["التصنيف", selectedType?.name || "غير محدد"],
            ["الوسوم", parsedTags.length ? `${parsedTags.length} وسم` : "لا توجد"],
            ["المصدر", path || metadata.localFile?.name || "غير محدد"]
          ].map(([label, value]) => jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl va-surface-subtle border px-3 py-2", children: [
            jsx("span", { className: "text-gray-500", children: label }),
            jsx("span", { className: "min-w-0 truncate text-gray-200", children: value })
          ] }, label)) })
        ] }),
        jsxs("div", { className: "va-card rounded-2xl va-surface-muted border p-4 text-right", children: [
          jsxs("div", { className: "flex items-center gap-2", children: [
            jsx(Eye, { className: "h-5 w-5 text-cyan-300" }),
            jsx("h2", { className: "text-sm font-bold text-white", children: "الخطوة الحالية" })
          ] }),
          jsx("p", { className: "mt-3 text-lg font-bold text-white", children: currentStep.label }),
          jsx("p", { className: "mt-1 text-sm leading-7 text-gray-500", children: currentStep.detail }),
          jsx("p", { className: "mt-3 rounded-xl va-surface-subtle border p-3 text-xs leading-6 text-gray-500", children: stepIndex === STEPS.length - 1 ? "راجع الملخص ثم احفظ، أو استخدم حفظ وإضافة آخر للعمل المتكرر." : "يمكنك الانتقال بين الخطوات بحرية؛ لن يتم الحفظ إلا من خطوة المراجعة." })
        ] })
      ] }),
      jsxs("section", { className: "va-card rounded-2xl va-surface-muted border p-5 text-right", children: [
        jsx("h2", { className: "mb-4 text-lg font-bold text-white", children: currentStep.label }),
        currentStep.id === "basic" && jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "العنوان" }), jsx("input", { value: title, onChange: (event) => setTitle(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "عنوان الفيديو" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الرابط أو المسار" }), jsx("input", { value: path, onChange: (event) => setPath(event.target.value), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "https:// أو D:\\..." })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("span", { children: "ملف محلي من الجهاز" }),
            jsx(LocalFilePicker, { value: metadata.localFile, onFileSelect: applyPrimaryLocalFile })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الصورة المصغرة" }), jsx("input", { value: thumbnail, onChange: (event) => setThumbnail(event.target.value), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "رابط صورة اختياري" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "ملاحظات" }), jsx("textarea", { value: notes, onChange: (event) => setNotes(event.target.value), className: "min-h-[100px] w-full va-surface-deep rounded-xl border p-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "ملخص أو ملاحظات أرشيفية" })] })
        ] }),
        currentStep.id === "classify" && jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "نوع المحتوى" }), jsx("select", { value: typeId, onChange: (event) => setTypeId(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none", children: contentTypes.filter((type) => type.status !== "archived").map((type) => jsx("option", { value: type.id, children: type.name }, type.id)) })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الفرع" }), jsx("select", { value: subtypeId, onChange: (event) => setSubtypeId(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none", children: [jsx("option", { value: "", children: "بدون فرع" }), ...subtypes.map((subtype) => jsx("option", { value: subtype.id, children: subtype.name }, subtype.id))] })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "الوسوم" }), jsx("input", { value: tags, onChange: (event) => setTags(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "وسوم مفصولة بفاصلة، ويمكن استخدام مسارات الوسوم الهرمية" })] })
        ] }),
        currentStep.id === "fields" && (fields.length ? jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: fields.map((field) => jsxs("label", { className: `space-y-1 text-sm text-gray-300 ${field.type === "textarea" || field.type === "localFile" ? "lg:col-span-2" : ""}`, children: [
          jsxs("span", { children: [field.label, field.required && jsx("span", { className: "text-red-300", children: " *" })] }),
          jsx(FieldInput, { field, value: metadata[fieldKey(field)], onChange: updateMetadata }),
          field.description && jsx("span", { className: "text-xs text-gray-600", children: field.description })
        ] }, field.id)) }) : jsx("p", { className: "rounded-xl border border-dashed border-white/10 bg-gray-950/35 p-6 text-center text-sm text-gray-500", children: "لا توجد حقول مخصصة لهذا النوع." })),
        currentStep.id === "review" && jsxs("div", { className: "grid gap-3 lg:grid-cols-2", children: [
          jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `العنوان: ${title || "غير محدد"}` }),
          jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `النوع: ${selectedType?.name || "غير محدد"}` }),
              jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `عدد الوسوم: ${parsedTags.length}` }),
          jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `حقول مخصصة: ${Object.keys(metadata).length}` })
        ] })
      ] }),
      jsxs("div", { className: "va-control-surface flex flex-wrap items-center justify-between gap-3 va-surface-muted rounded-2xl border p-3", children: [
        jsx("button", { type: "button", disabled: stepIndex <= 0, onClick: () => setStepIndex((value) => Math.max(0, value - 1)), className: "va-secondary-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: [jsx(ChevronRight, { className: "h-4 w-4" }), "السابق"] }),
        jsxs("div", { className: "flex flex-wrap gap-2", children: [
          stepIndex < STEPS.length - 1 && jsx("button", { type: "button", onClick: () => setStepIndex((value) => Math.min(STEPS.length - 1, value + 1)), className: "va-primary-button inline-flex items-center gap-2  rounded-xl px-4 py-2 text-sm font-semibold text-white", children: ["التالي", jsx(ChevronLeft, { className: "h-4 w-4" })] }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave, onClick: () => save(false), className: "va-primary-button  rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وفتح التفاصيل" }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave, onClick: () => save(true), className: "va-secondary-button rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وإضافة آخر" })
        ] })
      ] })
    ]
  });
}

AddVideoPage.pageId = "add";
AddVideoPage.migrationStatus = "native";

export default AddVideoPage;
