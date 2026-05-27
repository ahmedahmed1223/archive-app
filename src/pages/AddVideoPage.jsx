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
import { MotionPage, PageHero, SaveIndicator, WorkflowStepper } from "../components/ui/V1Primitives.jsx";
import { useFormSaveState } from "../components/common/useFormSaveState.js";


const STEPS = [
  { id: "basic", label: "الأساسيات", detail: "العنوان والمسار أو الملف", icon: Video },
  { id: "classify", label: "التصنيف", detail: "النوع والفرع والوسوم", icon: Database },
  { id: "fields", label: "الحقول", detail: "حقول النوع المختار", icon: FileText },
  { id: "review", label: "المراجعة", detail: "تأكيد سريع قبل الحفظ", icon: Tags }
];

// Draft persistence: writes to localStorage on every change so a refresh,
// accidental navigation, or crash never loses in-progress data.
const DRAFT_STORAGE_KEY = "videoArchive:addVideoDraft";
const DRAFT_AUTO_SAVE_DELAY_MS = 600;

function readStoredDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistDraft(draft) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

function clearStoredDraft() {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// Each step decides whether the user can advance forward. The basic step
// requires a title, the classify step a typeId, the fields step that all
// required custom fields are filled, and review is always advanceable
// (advancing = submitting).
function getStepErrors(stepId, snapshot) {
  const errors = [];
  if (stepId === "basic") {
    if (!snapshot.title.trim()) errors.push("أدخل عنوان الفيديو قبل المتابعة");
  }
  if (stepId === "classify") {
    if (!snapshot.typeId) errors.push("اختر نوع المحتوى");
  }
  if (stepId === "fields") {
    const missing = snapshot.fields.filter((field) => {
      if (!field.required) return false;
      const value = snapshot.metadata[fieldKey(field)];
      return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    });
    if (missing.length) {
      errors.push(`أكمل الحقول المطلوبة: ${missing.map((field) => field.label).join("، ")}`);
    }
  }
  return errors;
}

function fieldKey(field) {
  return field.storageKey || field.name || field.id;
}

function LocalFilePicker({ value, onFileSelect, inputId }) {
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
      id: inputId,
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

function FieldInput({ field, value, onChange, inputId }) {
  const key = fieldKey(field);
  const commonClass = "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40";
  if (field.type === "textarea" || field.type === "transcript") {
    return jsx("textarea", { id: inputId, value: value || "", onChange: (event) => onChange(key, event.target.value), rows: 3, className: `${commonClass} p-3`, placeholder: field.placeholder || field.label });
  }
  if (field.type === "checkbox") {
    return jsxs("label", { className: "inline-flex min-h-11 items-center gap-2 va-surface-muted rounded-xl border px-3 text-sm text-gray-300", children: [
      jsx("input", { id: inputId, type: "checkbox", checked: !!value, onChange: (event) => onChange(key, event.target.checked) }),
      "نعم"
    ] });
  }
  if (field.type === "select" || field.type === "radio") {
    return jsxs("select", { id: inputId, value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass, children: [
      jsx("option", { value: "", children: "اختر..." }),
      ...(field.options || []).map((option) => jsx("option", { value: option, children: option }, option))
    ] });
  }
  if (field.type === "tags" || field.type === "multiselect") {
    return jsx("input", { id: inputId, value: Array.isArray(value) ? value.join("، ") : value || "", onChange: (event) => onChange(key, parseVideoTags(event.target.value)), className: commonClass, placeholder: "قيم مفصولة بفاصلة" });
  }
  if (field.type === "localFile") {
    return jsx(LocalFilePicker, { value, onFileSelect: (file) => onChange(key, createLocalFileValue(file)) });
  }
  return jsx("input", { id: inputId, type: field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text", value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass, placeholder: field.placeholder || field.label });
}

// Renders a custom-type field row with an explicit htmlFor/id binding so
// screen readers announce each control by its visible Arabic label.
function FieldRow({ field, value, onChange }) {
  const inputId = React.useId();
  const isWide = field.type === "textarea" || field.type === "localFile";
  return jsxs("div", {
    className: `space-y-1 text-sm text-gray-300 ${isWide ? "lg:col-span-2" : ""}`,
    children: [
      jsxs("label", { htmlFor: inputId, className: "block", children: [
        field.label,
        field.required && jsx("span", { className: "text-red-300", children: " *" })
      ] }),
      jsx(FieldInput, { field, value, onChange, inputId }),
      field.description && jsx("span", { className: "text-xs text-gray-400", children: field.description })
    ]
  }, field.id);
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

  // Hydrate from any pending draft from a previous session so users
  // never lose progress to a refresh or accidental navigation.
  const initialDraft = React.useMemo(() => readStoredDraft(), []);
  const [stepIndex, setStepIndex] = React.useState(initialDraft?.stepIndex ?? 0);
  const [title, setTitle] = React.useState(initialDraft?.title ?? "");
  const [path, setPath] = React.useState(initialDraft?.path ?? "");
  const [thumbnail, setThumbnail] = React.useState(initialDraft?.thumbnail ?? "");
  const [notes, setNotes] = React.useState(initialDraft?.notes ?? "");
  const [tags, setTags] = React.useState(initialDraft?.tags ?? "");
  const [typeId, setTypeId] = React.useState(initialDraft?.typeId ?? firstType?.id ?? "");
  const [subtypeId, setSubtypeId] = React.useState(initialDraft?.subtypeId ?? "");
  const [metadata, setMetadata] = React.useState(initialDraft?.metadata ?? {});
  const [draftRestored, setDraftRestored] = React.useState(!!initialDraft);
  const [stepError, setStepError] = React.useState(null);
  const draftSave = useFormSaveState();
  const submitSave = useFormSaveState();

  // Explicit ids for each visible control so screen readers can
  // announce label+input pairs even when the layout splits them.
  const titleId = React.useId();
  const pathId = React.useId();
  const localFileId = React.useId();
  const thumbnailId = React.useId();
  const notesId = React.useId();
  const typeSelectId = React.useId();
  const subtypeSelectId = React.useId();
  const tagsId = React.useId();

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

  // Debounced auto-save of the current draft so a refresh or crash
  // never costs the user their in-progress work. We skip empty drafts
  // so we don't litter localStorage on first visit.
  React.useEffect(() => {
    const isDirty = title || path || thumbnail || notes || tags || subtypeId || Object.keys(metadata).length > 0;
    if (!isDirty) return undefined;
    const timer = window.setTimeout(() => {
      const ok = persistDraft({
        stepIndex, title, path, thumbnail, notes, tags, typeId, subtypeId, metadata,
        savedAt: new Date().toISOString()
      });
      if (ok) draftSave.succeed();
      else draftSave.fail(new Error("تعذّر حفظ المسودة محليًا"));
    }, DRAFT_AUTO_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draftSave, metadata, notes, path, stepIndex, subtypeId, tags, thumbnail, title, typeId]);

  // Surface a one-shot toast confirming the restored draft, then clear
  // the flag so it doesn't fire again on every re-render.
  React.useEffect(() => {
    if (draftRestored) {
      showToast?.("تمت استعادة مسودة سابقة", "info");
      setDraftRestored(false);
    }
  }, [draftRestored, showToast]);

  // Clear validation errors as soon as the user moves to a new step.
  React.useEffect(() => {
    setStepError(null);
  }, [stepIndex]);

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
      submitSave.begin();
      await addVideoItem?.(item);
      submitSave.succeed();
      // Successful submit invalidates the draft so the next AddVideo
      // visit starts clean.
      clearStoredDraft();
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
      submitSave.fail(error);
      showToast?.("تعذر إضافة الفيديو", "error");
    }
  };

  const tryAdvance = () => {
    const errors = getStepErrors(currentStep.id, { title, typeId, fields, metadata });
    if (errors.length) {
      setStepError(errors.join(" — "));
      return;
    }
    setStepError(null);
    setStepIndex((value) => Math.min(STEPS.length - 1, value + 1));
  };

  const resetDraft = () => {
    clearStoredDraft();
    setTitle("");
    setPath("");
    setThumbnail("");
    setNotes("");
    setTags("");
    setTypeId(firstType?.id || "");
    setSubtypeId("");
    setMetadata({});
    setStepIndex(0);
    setStepError(null);
    draftSave.reset();
    showToast?.("تم مسح المسودة", "info");
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
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("label", { htmlFor: titleId, className: "block", children: "العنوان" }), jsx("input", { id: titleId, value: title, onChange: (event) => setTitle(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "عنوان الفيديو" })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300", children: [jsx("label", { htmlFor: pathId, className: "block", children: "الرابط أو المسار" }), jsx("input", { id: pathId, value: path, onChange: (event) => setPath(event.target.value), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "https:// أو D:\\..." })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("label", { htmlFor: localFileId, className: "block", children: "ملف محلي من الجهاز" }),
            jsx(LocalFilePicker, { value: metadata.localFile, onFileSelect: applyPrimaryLocalFile, inputId: localFileId })
          ] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300", children: [jsx("label", { htmlFor: thumbnailId, className: "block", children: "الصورة المصغرة" }), jsx("input", { id: thumbnailId, value: thumbnail, onChange: (event) => setThumbnail(event.target.value), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "رابط صورة اختياري" })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("label", { htmlFor: notesId, className: "block", children: "ملاحظات" }), jsx("textarea", { id: notesId, value: notes, onChange: (event) => setNotes(event.target.value), className: "min-h-[100px] w-full va-surface-deep rounded-xl border p-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "ملخص أو ملاحظات أرشيفية" })] })
        ] }),
        currentStep.id === "classify" && jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("div", { className: "space-y-1 text-sm text-gray-300", children: [jsx("label", { htmlFor: typeSelectId, className: "block", children: "نوع المحتوى" }), jsxs("select", { id: typeSelectId, value: typeId, onChange: (event) => setTypeId(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none", children: contentTypes.filter((type) => type.status !== "archived").map((type) => jsx("option", { value: type.id, children: type.name }, type.id)) })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300", children: [jsx("label", { htmlFor: subtypeSelectId, className: "block", children: "الفرع" }), jsxs("select", { id: subtypeSelectId, value: subtypeId, onChange: (event) => setSubtypeId(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none", children: [jsx("option", { value: "", children: "بدون فرع" }), ...subtypes.map((subtype) => jsx("option", { value: subtype.id, children: subtype.name }, subtype.id))] })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("label", { htmlFor: tagsId, className: "block", children: "الوسوم" }), jsx("input", { id: tagsId, value: tags, onChange: (event) => setTags(event.target.value), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40", placeholder: "وسوم مفصولة بفاصلة، ويمكن استخدام مسارات الوسوم الهرمية" })] })
        ] }),
        currentStep.id === "fields" && (fields.length ? jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: fields.map((field) => jsx(FieldRow, { field, value: metadata[fieldKey(field)], onChange: updateMetadata }, field.id)) }) : jsx("p", { className: "rounded-xl border border-dashed border-white/10 bg-gray-950/35 p-6 text-center text-sm text-gray-400", children: "لا توجد حقول مخصصة لهذا النوع." })),
        currentStep.id === "review" && jsxs("div", { className: "grid gap-3 lg:grid-cols-2", children: [
          jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `العنوان: ${title || "غير محدد"}` }),
          jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `النوع: ${selectedType?.name || "غير محدد"}` }),
              jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `عدد الوسوم: ${parsedTags.length}` }),
          jsx("p", { className: "va-surface-muted rounded-xl border p-3 text-sm text-gray-300", children: `حقول مخصصة: ${Object.keys(metadata).length}` })
        ] })
      ] }),
      stepError && jsx("div", { role: "alert", className: "rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200", children: stepError }),
      jsxs("div", { className: "va-control-surface flex flex-wrap items-center justify-between gap-3 va-surface-muted rounded-2xl border p-3", children: [
        jsxs("div", { className: "flex items-center gap-3", children: [
          jsx("button", { type: "button", disabled: stepIndex <= 0, onClick: () => setStepIndex((value) => Math.max(0, value - 1)), className: "va-secondary-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: [jsx(ChevronRight, { className: "h-4 w-4" }), "السابق"] }),
          jsx(SaveIndicator, {
            state: submitSave.state !== "idle" ? submitSave.state : draftSave.state,
            message: submitSave.state !== "idle"
              ? (submitSave.isSaving ? "يحفظ الفيديو..." : submitSave.isSaved ? "تم الحفظ" : "تعذر الحفظ")
              : (draftSave.isSaving ? "يحفظ المسودة..." : draftSave.isSaved ? "تم حفظ المسودة" : null)
          })
        ] }),
        jsxs("div", { className: "flex flex-wrap gap-2", children: [
          jsx("button", { type: "button", onClick: resetDraft, className: "rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5", title: "مسح المسودة المحفوظة محليًا", children: "إعادة تعيين" }),
          stepIndex < STEPS.length - 1 && jsxs("button", { type: "button", onClick: tryAdvance, className: "va-primary-button inline-flex items-center gap-2  rounded-xl px-4 py-2 text-sm font-semibold text-white", children: ["التالي", jsx(ChevronLeft, { className: "h-4 w-4" })] }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave || submitSave.isSaving, onClick: () => save(false), className: "va-primary-button  rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وفتح التفاصيل" }),
          stepIndex === STEPS.length - 1 && jsx("button", { type: "button", disabled: !canSave || submitSave.isSaving, onClick: () => save(true), className: "va-secondary-button rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: "حفظ وإضافة آخر" })
        ] })
      ] })
    ]
  });
}

AddVideoPage.pageId = "add";
AddVideoPage.migrationStatus = "native";

export default AddVideoPage;
