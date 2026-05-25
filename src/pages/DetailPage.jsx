import {
  useAppStore
} from "../stores/index.js";
import {
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Gauge,
  HardDrive,
  PenLine,
  RefreshCw,
  Tags,
  Trash2,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import {
  getHtml5VideoPreviewSource,
  isHtml5PreviewableVideo
} from "../features/archive/mediaPreview.js";
import { getFieldsForSelection } from "../features/types/viewModel.js";
import {
  createLocalFileValue,
  createVideoLocalFilePatch,
  createVideoItemValue,
  getSubtypeLabel,
  getTypeLabel,
  normalizeLocalFileValue,
  parseVideoTags
} from "../features/videos/viewModel.js";
import { formatDateTime, formatFileSize, formatNumber } from "../utils/formatting.js";


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

function EditableField({ field, value, onChange }) {
  const key = fieldKey(field);
  const commonClass = "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40";
  if (field.type === "textarea" || field.type === "transcript") return jsx("textarea", { value: value || "", onChange: (event) => onChange(key, event.target.value), rows: 3, className: `${commonClass} p-3` });
  if (field.type === "checkbox") return jsx("input", { type: "checkbox", checked: !!value, onChange: (event) => onChange(key, event.target.checked), className: "h-5 w-5" });
  if (field.type === "select" || field.type === "radio") return jsx("select", { value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass, children: [
    jsx("option", { value: "", children: "اختر..." }),
    ...(field.options || []).map((option) => jsx("option", { value: option, children: option }, option))
  ] });
  if (field.type === "tags" || field.type === "multiselect") return jsx("input", { value: Array.isArray(value) ? value.join("، ") : value || "", onChange: (event) => onChange(key, parseVideoTags(event.target.value)), className: commonClass });
  if (field.type === "localFile") return jsx(LocalFilePicker, { value, onFileSelect: (file) => onChange(key, createLocalFileValue(file)) });
  return jsx("input", { type: field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text", value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass });
}

function ReadonlyField({ field, value }) {
  if (field.type === "checkbox") return value ? "نعم" : "لا";
  if (field.type === "localFile") {
    const file = normalizeLocalFileValue(value);
    if (!file) return "—";
    return jsxs("div", { className: "space-y-1", children: [
      jsx("p", { className: "font-semibold text-gray-200", children: file.name || "ملف محلي" }),
      file.size > 0 && jsx("p", { className: "text-xs text-gray-600", children: `${formatFileSize(file.size)} - ${file.extension || "بدون امتداد"}` }),
      file.path && jsx("p", { className: "break-all text-xs text-gray-600", dir: "ltr", children: file.path })
    ] });
  }
  if (Array.isArray(value)) return value.length ? value.join("، ") : "—";
  if (value && typeof value === "object") return JSON.stringify(value);
  return value || "—";
}

export function DetailPage() {
  const {
    videoItems = [],
    contentTypes = [],
    changeHistory = [],
    selectedItemId,
    setCurrentPage,
    updateVideoItem,
    deleteVideoItem,
    restoreVideoItem,
    toggleFavorite,
    showToast
  } = useAppStore();

  const item = videoItems.find((video) => video.id === selectedItemId) || null;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(null);

  React.useEffect(() => {
    setDraft(item ? {
      ...item,
      tagsText: (item.tags || []).join("، "),
      metadata: { ...(item.metadata || {}) }
    } : null);
    setEditing(false);
  }, [item?.id]);

  const fields = React.useMemo(() => item ? getFieldsForSelection(contentTypes, draft?.type || item.type, draft?.subtype || item.subtype) : [], [contentTypes, draft?.subtype, draft?.type, item]);
  const selectedType = contentTypes.find((type) => type.id === (draft?.type || item?.type));
  const subtypes = selectedType?.subtypes || [];
  const history = React.useMemo(() => item ? changeHistory.filter((record) => record.itemId === item.id).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 10) : [], [changeHistory, item]);
  const previewSource = item?.path && isHtml5PreviewableVideo(item.path) ? getHtml5VideoPreviewSource(item.path) : null;
  const itemStats = [
    { id: "type", label: "التصنيف", value: getTypeLabel(contentTypes, item.type) || "غير محدد", icon: Tags },
    { id: "tags", label: "الوسوم", value: formatNumber(item.tags?.length || 0), icon: Tags },
    { id: "version", label: "الإصدار", value: formatNumber(item.version || 1), icon: Gauge },
    { id: "updated", label: "آخر تحديث", value: item.updatedAt ? formatDateTime(item.updatedAt) : "—", icon: Clock3 }
  ];

  if (!item) {
    return jsxs("div", { className: "va-page-shell space-y-6 p-4 text-center sm:p-6", dir: "rtl", children: [
      jsx("section", { className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-900/35 p-10", children: [
        jsx(Video, { className: "mx-auto h-12 w-12 text-gray-600" }),
        jsx("h1", { className: "mt-3 text-xl font-bold text-white", children: "لم يتم اختيار فيديو" }),
        jsx("p", { className: "mt-2 text-sm text-gray-500", children: "افتح عنصرًا من الأرشيف لعرض تفاصيله." }),
        jsx("button", { type: "button", onClick: () => setCurrentPage?.("archive"), className: "mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "فتح الأرشيف" })
      ] })
    ] });
  }

  const updateDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const updateMetadata = (key, value) => setDraft((current) => ({ ...current, metadata: { ...(current.metadata || {}), [key]: value } }));
  const applyPrimaryLocalFile = (file) => {
    const patch = createVideoLocalFilePatch(file, { currentTitle: draft?.title || item.title });
    if (!patch) return;
    setDraft((current) => ({
      ...current,
      ...(patch.title ? { title: patch.title } : {}),
      path: patch.path,
      metadata: { ...(current.metadata || {}), ...patch.metadata }
    }));
  };

  const save = async () => {
    const updated = createVideoItemValue({
      ...item,
      ...draft,
      tags: parseVideoTags(draft.tagsText),
      metadata: draft.metadata || {},
      createdAt: item.createdAt,
      version: (item.version || 1) + 1
    });
    try {
      await updateVideoItem?.(updated);
      showToast?.("تم حفظ التعديلات", "success");
      setEditing(false);
    } catch (error) {
      showToast?.("تعذر حفظ التعديلات", "error");
    }
  };

  const deleteOrRestore = async () => {
    if (item.isDeleted) {
      await restoreVideoItem?.(item.id);
      return;
    }
    const confirmed = await appConfirm(`هل تريد نقل "${item.title}" إلى سلة المحذوفات؟`, {
      title: "حذف فيديو",
      kind: "warning",
      confirmLabel: "نقل للسلة"
    });
    if (!confirmed) return;
    await deleteVideoItem?.(item.id);
  };

  const copyPath = async () => {
    if (!item.path) return;
    try {
      await navigator.clipboard?.writeText(item.path);
      showToast?.("تم نسخ المسار", "success");
    } catch (error) {
      showToast?.("تعذر نسخ المسار", "error");
    }
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", { className: "va-page-hero overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 text-right shadow-2xl shadow-black/10", children: [
        previewSource ? jsx("video", { src: previewSource, controls: true, className: "aspect-video w-full bg-black object-contain" }) : item.thumbnail ? jsx("img", { src: item.thumbnail, alt: item.title, className: "h-64 w-full object-cover" }) : jsx("div", { className: "flex h-48 items-center justify-center bg-gray-950/60", children: jsx(Video, { className: "h-16 w-16 text-gray-700" }) }),
        jsxs("div", { className: "p-5", children: [
          jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
            jsxs("div", { className: "min-w-0", children: [
              jsx("h1", { className: "text-2xl font-bold text-white", children: item.title || "بدون عنوان" }),
              jsx("p", { className: "mt-2 text-sm text-gray-500", children: [getTypeLabel(contentTypes, item.type), getSubtypeLabel(contentTypes, item.type, item.subtype)].filter(Boolean).join(" / ") }),
              item.path && jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
                jsx("p", { className: "max-w-2xl break-all text-xs text-gray-600", dir: "ltr", children: item.path }),
                jsx("button", { type: "button", onClick: copyPath, className: "inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:bg-white/5 hover:text-white", children: [jsx(Copy, { className: "h-3.5 w-3.5" }), "نسخ"] })
              ] })
            ] }),
            jsxs("div", { className: "flex flex-wrap gap-2", children: [
              jsx("button", { type: "button", onClick: () => toggleFavorite?.(item.id), className: "rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/15", children: item.isFavorite ? "إزالة المفضلة" : "مفضلة" }),
              jsx("button", { type: "button", onClick: () => setEditing((value) => !value), className: "va-secondary-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5", children: [jsx(PenLine, { className: "h-4 w-4" }), editing ? "إغلاق التحرير" : "تحرير"] }),
              jsx("button", { type: "button", onClick: deleteOrRestore, className: "inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15", children: [item.isDeleted ? jsx(RefreshCw, { className: "h-4 w-4" }) : jsx(Trash2, { className: "h-4 w-4" }), item.isDeleted ? "استعادة" : "حذف"] })
            ] })
          ] })
        ] })
      ] }),
      jsx("section", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: itemStats.map((stat, index) => {
        const Icon = stat.icon;
        return jsxs(motion.div, {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.18, delay: index * 0.035 },
          whileHover: { y: -2 },
          className: "va-metric-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right",
          children: [
            jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              jsxs("div", { className: "min-w-0", children: [
                jsx("p", { className: "text-xs text-gray-500", children: stat.label }),
                jsx("p", { className: "mt-2 truncate text-lg font-bold text-white", children: stat.value })
              ] }),
              jsx("span", { className: "va-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", children: jsx(Icon, { className: "h-5 w-5" }) })
            ] })
          ]
        }, stat.id);
      }) }),
      editing && draft && jsxs("section", { className: "va-card space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-right", children: [
        jsx("h2", { className: "text-lg font-bold text-white", children: "تحرير التفاصيل" }),
        jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "العنوان" }), jsx("input", { value: draft.title || "", onChange: (event) => updateDraft({ title: event.target.value }), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "النوع" }), jsx("select", { value: draft.type || "", onChange: (event) => updateDraft({ type: event.target.value, subtype: "" }), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", children: contentTypes.filter((type) => type.status !== "archived").map((type) => jsx("option", { value: type.id, children: type.name }, type.id)) })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الفرع" }), jsx("select", { value: draft.subtype || "", onChange: (event) => updateDraft({ subtype: event.target.value }), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", children: [jsx("option", { value: "", children: "بدون فرع" }), ...subtypes.map((subtype) => jsx("option", { value: subtype.id, children: subtype.name }, subtype.id))] })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "المسار" }), jsx("input", { value: draft.path || "", onChange: (event) => updateDraft({ path: event.target.value }), dir: "ltr", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none" })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [
            jsx("span", { children: "ملف محلي من الجهاز" }),
            jsx(LocalFilePicker, { value: draft.metadata?.localFile, onFileSelect: applyPrimaryLocalFile })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الصورة المصغرة" }), jsx("input", { value: draft.thumbnail || "", onChange: (event) => updateDraft({ thumbnail: event.target.value }), dir: "ltr", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "الوسوم" }), jsx("input", { value: draft.tagsText || "", onChange: (event) => updateDraft({ tagsText: event.target.value }), className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 lg:col-span-2", children: [jsx("span", { children: "ملاحظات" }), jsx("textarea", { value: draft.notes || "", onChange: (event) => updateDraft({ notes: event.target.value }), className: "min-h-[90px] w-full rounded-xl border border-white/10 bg-gray-950/45 p-3 text-sm text-white outline-none" })] })
        ] }),
        fields.length > 0 && jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: fields.map((field) => jsxs("label", { className: `space-y-1 text-sm text-gray-300 ${field.type === "textarea" || field.type === "localFile" ? "lg:col-span-2" : ""}`, children: [
          jsx("span", { children: field.label }),
          jsx(EditableField, { field, value: draft.metadata?.[fieldKey(field)], onChange: updateMetadata })
        ] }, field.id)) }),
        jsxs("div", { className: "flex justify-end gap-2", children: [
          jsx("button", { type: "button", onClick: () => setEditing(false), className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
          jsx("button", { type: "button", onClick: save, className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "حفظ" })
        ] })
      ] }),
      jsxs("section", { className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]", children: [
        jsxs("div", { className: "va-card space-y-4 rounded-2xl border border-white/10 bg-gray-900/45 p-5 text-right", children: [
          jsxs("h2", { className: "flex items-center gap-2 text-lg font-bold text-white", children: [jsx(FileText, { className: "h-5 w-5 text-emerald-400" }), "البيانات"] }),
          item.notes && jsx("p", { className: "rounded-xl border border-white/5 bg-gray-950/35 p-3 text-sm leading-relaxed text-gray-400", children: item.notes }),
          item.metadata?.localFile && jsxs("div", { className: "rounded-xl border border-white/5 bg-gray-950/35 p-3", children: [
            jsxs("div", { className: "flex items-center gap-2", children: [
              jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-300" }),
              jsx("p", { className: "text-xs font-semibold text-emerald-100", children: "الملف المحلي" })
            ] }),
            jsx("div", { className: "mt-2 text-sm text-gray-300", children: jsx(ReadonlyField, { field: { type: "localFile" }, value: item.metadata.localFile }) })
          ] }),
          fields.length ? jsx("div", { className: "grid gap-3 lg:grid-cols-2", children: fields.map((field) => jsxs("div", { className: "rounded-xl border border-white/5 bg-gray-950/35 p-3", children: [
            jsx("p", { className: "text-xs text-gray-600", children: field.label }),
            jsx("div", { className: "mt-1 text-sm text-gray-300", children: jsx(ReadonlyField, { field, value: item.metadata?.[fieldKey(field)] }) })
          ] }, field.id)) }) : jsx("p", { className: "text-sm text-gray-500", children: "لا توجد حقول مخصصة لهذا العنصر." })
        ] }),
        jsxs("aside", { className: "va-preview-panel space-y-4 rounded-2xl border border-white/10 bg-gray-900/45 p-5 text-right", children: [
          jsxs("section", { children: [
            jsxs("h2", { className: "flex items-center gap-2 text-lg font-bold text-white", children: [jsx(Tags, { className: "h-5 w-5 text-emerald-400" }), "الوسوم"] }),
            item.tags?.length ? jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: item.tags.map((tag) => jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300", children: tag }, tag)) }) : jsx("p", { className: "mt-3 text-sm text-gray-500", children: "لا توجد وسوم." })
          ] }),
          jsxs("section", { children: [
            jsx("h2", { className: "text-lg font-bold text-white", children: "النشاط" }),
            jsx("p", { className: "mt-2 text-xs text-gray-600", children: `أنشئ: ${item.createdAt ? formatDateTime(item.createdAt) : "—"}` }),
            jsx("p", { className: "text-xs text-gray-600", children: `آخر تحديث: ${item.updatedAt ? formatDateTime(item.updatedAt) : "—"}` }),
            jsx("p", { className: "text-xs text-gray-600", children: `الإصدار: ${formatNumber(item.version || 1)}` })
          ] }),
          history.length > 0 && jsxs("section", { children: [
            jsx("h2", { className: "text-lg font-bold text-white", children: "آخر التغييرات" }),
            jsx("div", { className: "mt-3 space-y-2", children: history.map((record) => jsxs("div", { className: "rounded-xl border border-white/5 bg-gray-950/35 p-3", children: [
              jsx("p", { className: "text-sm font-semibold text-gray-300", children: record.action || "نشاط" }),
              jsx("p", { className: "mt-1 text-xs text-gray-600", children: record.timestamp ? formatDateTime(record.timestamp) : "" })
            ] }, record.id)) })
          ] })
        ] })
      ] })
    ]
  });
}

DetailPage.pageId = "detail";
DetailPage.migrationStatus = "native";

export default DetailPage;
