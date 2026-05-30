import {
  useAppStore
} from "../stores/index.js";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Gauge,
  HardDrive,
  PenLine,
  RefreshCw,
  Star,
  Tags,
  Trash2,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import { MotionPage, UXEmptyState } from "../components/ui/V1Primitives.jsx";
import { reportError } from "../utils/errorReporting.js";
import {
  getHtml5VideoPreviewSource,
  isHtml5PreviewableVideo
} from "../features/archive/mediaPreview.js";
import { getFieldsForSelection, groupCustomFields } from "../features/types/viewModel.js";
import { StarRating } from "../components/common/StarRating.jsx";
import { computeCompleteness, COMPLETENESS_TIERS } from "../features/archive/completeness.js";
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
      jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "inline-flex min-h-9 items-center justify-center va-primary-button rounded-lg px-3 py-1.5 text-xs font-semibold text-white", children: "استعراض" })
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

/**
 * Renders custom fields, splitting them into tabs when they carry group
 * names (so items with many fields stay scannable). `renderField` returns the
 * per-field node; ungrouped fields fall into a single flat grid (no tabs).
 */
function GroupedFields({ fields, renderField, gap = "gap-4" }) {
  const groups = React.useMemo(() => groupCustomFields(fields), [fields]);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => { if (active >= groups.length) setActive(0); }, [groups.length, active]);
  if (!fields.length) return null;
  const tabbed = groups.length > 1;
  const visible = tabbed ? (groups[active]?.fields || []) : fields;
  return jsxs("div", {
    className: "space-y-3",
    children: [
      tabbed ? jsx("div", { role: "tablist", className: "flex flex-wrap gap-1 overflow-x-auto rounded-xl va-surface-muted border p-1", children: groups.map((group, index) => jsxs("button", {
        type: "button",
        role: "tab",
        "aria-selected": active === index,
        onClick: () => setActive(index),
        className: `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${active === index ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
        children: [group.name, jsx("span", { className: "rounded-full bg-white/10 px-1.5 text-[10px]", children: `${group.fields.length}` })]
      }, group.name)) }) : null,
      jsx("div", { className: `grid ${gap} md:grid-cols-2`, children: visible.map(renderField) })
    ]
  });
}

function EditableField({ field, value, onChange }) {
  const key = fieldKey(field);
  const commonClass = "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none focus:border-emerald-500/40";
  if (field.type === "textarea" || field.type === "transcript") return jsx("textarea", { value: value || "", onChange: (event) => onChange(key, event.target.value), rows: 3, className: `${commonClass} p-3` });
  if (field.type === "checkbox") return jsx("input", { type: "checkbox", checked: !!value, onChange: (event) => onChange(key, event.target.checked), className: "h-5 w-5" });
  if (field.type === "select" || field.type === "radio") return jsx("select", { value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass, children: [
    jsx("option", { value: "", children: "اختر..." }),
    ...(field.options || []).map((option) => jsx("option", { value: option, children: option }, option))
  ] });
  if (field.type === "tags" || field.type === "multiselect") return jsx("input", { value: Array.isArray(value) ? value.join("، ") : value || "", onChange: (event) => onChange(key, parseVideoTags(event.target.value)), className: commonClass });
  if (field.type === "localFile") return jsx(LocalFilePicker, { value, onFileSelect: (file) => onChange(key, createLocalFileValue(file)) });
  if (field.type === "rating") return jsx("div", { className: "flex min-h-11 items-center", children: jsx(StarRating, { value: Number(value) || 0, onChange: (val) => onChange(key, val) }) });
  return jsx("input", { type: field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text", value: value || "", onChange: (event) => onChange(key, event.target.value), className: commonClass });
}

function ReadonlyField({ field, value }) {
  if (field.type === "rating") {
    const num = Number(value) || 0;
    return num > 0 ? jsx(StarRating, { value: num, readonly: true }) : "—";
  }
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
    bookmarks = [],
    selectedItemId,
    setCurrentPage,
    updateVideoItem,
    deleteVideoItem,
    restoreVideoItem,
    toggleFavorite,
    markItemViewed,
    addBookmark,
    removeBookmark,
    showToast,
    showNotification
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
    if (item?.id && !item.isDeleted) {
      markItemViewed?.(item.id);
    }
  }, [item?.id, item?.isDeleted, markItemViewed]);

  const fields = React.useMemo(() => item ? getFieldsForSelection(contentTypes, draft?.type || item.type, draft?.subtype || item.subtype) : [], [contentTypes, draft?.subtype, draft?.type, item]);
  const selectedType = contentTypes.find((type) => type.id === (draft?.type || item?.type));
  const completeness = React.useMemo(() => item ? computeCompleteness(item, selectedType) : null, [item, selectedType]);
  const videoRef = React.useRef(null);
  const [bookmarkLabel, setBookmarkLabel] = React.useState("");
  const itemBookmarks = React.useMemo(
    () => (bookmarks || []).filter((bookmark) => bookmark.itemId === item?.id).sort((a, b) => a.timestamp - b.timestamp),
    [bookmarks, item?.id]
  );
  const subtypes = selectedType?.subtypes || [];
  const history = React.useMemo(() => item ? changeHistory.filter((record) => record.itemId === item.id).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 10) : [], [changeHistory, item]);
  const previewSource = item?.path && isHtml5PreviewableVideo(item.path) ? getHtml5VideoPreviewSource(item.path) : null;
  const itemStats = [
    { id: "type", label: "التصنيف", value: getTypeLabel(contentTypes, item.type) || "غير محدد", icon: FileText },
    { id: "tags", label: "الوسوم", value: formatNumber(item.tags?.length || 0), icon: Tags },
    { id: "version", label: "الإصدار", value: formatNumber(item.version || 1), icon: Gauge },
    { id: "updated", label: "آخر تحديث", value: item.updatedAt ? formatDateTime(item.updatedAt) : "—", icon: Clock3 }
  ];

  if (!item) {
    return jsxs(MotionPage, { className: "space-y-6 p-4 text-center sm:p-6", children: [
      jsx(UXEmptyState, {
        icon: jsx(Video, { className: "h-8 w-8" }),
        title: "لم يتم اختيار فيديو",
        description: "افتح عنصرًا من الأرشيف لعرض تفاصيله أو استخدم البحث للوصول إلى مادة محددة.",
        actions: jsx("button", { type: "button", onClick: () => setCurrentPage?.("archive"), className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white", children: "فتح الأرشيف" })
      })
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

  const formatTimecode = (seconds) => {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, "0")}`;
  };
  const addCurrentBookmark = async () => {
    await addBookmark?.({ itemId: item.id, timestamp: videoRef.current?.currentTime || 0, label: bookmarkLabel });
    setBookmarkLabel("");
  };
  const seekToBookmark = (timestamp) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Number(timestamp) || 0);
    video.play?.().catch(() => {});
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
      reportError(showNotification, error, {
        context: "حفظ التعديلات",
        recovery: { run: save }
      });
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
      reportError(showNotification, error, {
        context: "نسخ المسار",
        hint: "قد لا يدعم المتصفح الكتابة على الحافظة. جرّب نسخ المسار يدويًا.",
        recovery: { run: copyPath }
      });
    }
  };

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsxs("nav", { className: "flex items-center gap-2 text-sm text-gray-500", "aria-label": "مسار التنقل", children: [
        jsx("button", { type: "button", onClick: () => setCurrentPage?.("archive"), className: "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300", children: [jsx(ArrowRight, { className: "h-3.5 w-3.5" }), "الأرشيف"] }),
        jsx("span", { className: "text-gray-700", children: "/" }),
        jsx("span", { className: "max-w-[200px] truncate text-gray-400", children: item.title || "التفاصيل" })
      ] }),
      jsxs("section", { className: "va-page-hero overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 text-right shadow-2xl shadow-black/10", children: [
        previewSource ? jsx("video", { ref: videoRef, src: previewSource, controls: true, className: "aspect-video w-full bg-black object-contain" }) : item.thumbnail ? jsx("img", { src: item.thumbnail, alt: item.title, className: "h-64 w-full object-cover" }) : jsx("div", { className: "flex h-48 items-center justify-center bg-gray-950/60", children: jsx(Video, { className: "h-16 w-16 text-gray-700" }) }),
        previewSource && jsxs("div", { className: "border-t border-white/10 bg-gray-950/40 p-4", dir: "rtl", children: [
          jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
            jsx(Clock3, { className: "h-4 w-4 text-emerald-300" }),
            jsx("h3", { className: "text-sm font-bold text-white", children: "إشارات مرجعية" }),
            itemBookmarks.length ? jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-300", children: `${itemBookmarks.length}` }) : null
          ] }),
          jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            jsx("input", { value: bookmarkLabel, onChange: (event) => setBookmarkLabel(event.target.value), placeholder: "عنوان الإشارة (اختياري)", className: "min-h-9 flex-1 va-surface-deep rounded-lg border px-3 text-sm text-white outline-none focus:border-emerald-500/40" }),
            jsx("button", { type: "button", onClick: addCurrentBookmark, className: "va-primary-button shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white", children: "أضف عند اللحظة الحالية" })
          ] }),
          itemBookmarks.length ? jsx("ul", { className: "mt-3 space-y-1.5", children: itemBookmarks.map((bookmark) => jsxs("li", { className: "flex items-center gap-2 rounded-lg va-surface-muted border p-2", children: [
            jsx("button", { type: "button", onClick: () => seekToBookmark(bookmark.timestamp), dir: "ltr", className: "shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-200 transition-colors hover:bg-emerald-500/20", children: formatTimecode(bookmark.timestamp) }),
            jsx("button", { type: "button", onClick: () => seekToBookmark(bookmark.timestamp), className: "min-w-0 flex-1 truncate text-right text-sm text-gray-200 transition-colors hover:text-white", children: bookmark.label }),
            jsx("button", { type: "button", onClick: () => removeBookmark?.(bookmark.id), "aria-label": "حذف الإشارة", className: "shrink-0 rounded-md p-1 text-red-300 transition-colors hover:bg-red-500/10", children: jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }, bookmark.id)) }) : jsx("p", { className: "mt-2 text-xs text-gray-500", children: "لا توجد إشارات بعد. شغّل الفيديو واضغط «أضف عند اللحظة الحالية»." })
        ] }),
        jsxs("div", { className: "p-5", children: [
          jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
            jsxs("div", { className: "min-w-0 flex-1", children: [
              jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                jsx("h1", { className: "text-2xl font-bold text-white", children: item.title || "بدون عنوان" }),
                item.isFavorite && jsx("span", { className: "inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-0.5 text-xs text-amber-200", children: [jsx(Star, { className: "h-3 w-3 fill-current" }), "مفضلة"] })
              ] }),
              jsx("p", { className: "mt-2 text-sm text-gray-500", children: [getTypeLabel(contentTypes, item.type), getSubtypeLabel(contentTypes, item.type, item.subtype)].filter(Boolean).join(" / ") || "غير مصنف" }),
              item.path && jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
                jsx("p", { className: "max-w-2xl break-all text-xs text-gray-600", dir: "ltr", children: item.path }),
                jsx("button", { type: "button", onClick: copyPath, className: "inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors", children: [jsx(Copy, { className: "h-3.5 w-3.5" }), "نسخ"] })
              ] }),
              item.isDeleted && jsx("span", { className: "mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs text-red-300", children: "محذوف — في سلة المحذوفات" })
            ] }),
            jsxs("div", { className: "flex flex-wrap gap-2", children: [
              jsx("button", { type: "button", onClick: () => toggleFavorite?.(item.id), className: `inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${item.isFavorite ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15" : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-amber-200"}`, children: [jsx(Star, { className: `h-4 w-4 ${item.isFavorite ? "fill-current" : ""}` }), item.isFavorite ? "إزالة المفضلة" : "مفضلة"] }),
              jsx("button", { type: "button", onClick: () => setEditing((value) => !value), className: `va-secondary-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition-colors ${editing ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "text-gray-300 hover:bg-white/5"}`, children: [jsx(PenLine, { className: "h-4 w-4" }), editing ? "إغلاق التحرير" : "تحرير"] }),
              jsx("button", { type: "button", onClick: deleteOrRestore, className: "inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/15", children: [item.isDeleted ? jsx(RefreshCw, { className: "h-4 w-4" }) : jsx(Trash2, { className: "h-4 w-4" }), item.isDeleted ? "استعادة" : "حذف"] })
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
          className: "va-metric-card rounded-2xl va-surface-muted border p-4 text-right",
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
        jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 md:col-span-2", children: [jsx("span", { children: "العنوان" }), jsx("input", { value: draft.title || "", onChange: (event) => updateDraft({ title: event.target.value }), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "النوع" }), jsx("select", { value: draft.type || "", onChange: (event) => updateDraft({ type: event.target.value, subtype: "" }), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none", children: contentTypes.filter((type) => type.status !== "archived").map((type) => jsx("option", { value: type.id, children: type.name }, type.id)) })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الفرع" }), jsx("select", { value: draft.subtype || "", onChange: (event) => updateDraft({ subtype: event.target.value }), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none", children: [jsx("option", { value: "", children: "بدون فرع" }), ...subtypes.map((subtype) => jsx("option", { value: subtype.id, children: subtype.name }, subtype.id))] })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "المسار" }), jsx("input", { value: draft.path || "", onChange: (event) => updateDraft({ path: event.target.value }), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none" })] }),
          jsxs("div", { className: "space-y-1 text-sm text-gray-300 md:col-span-2", children: [
            jsx("span", { children: "ملف محلي من الجهاز" }),
            jsx(LocalFilePicker, { value: draft.metadata?.localFile, onFileSelect: applyPrimaryLocalFile })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [jsx("span", { children: "الصورة المصغرة" }), jsx("input", { value: draft.thumbnail || "", onChange: (event) => updateDraft({ thumbnail: event.target.value }), dir: "ltr", className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 md:col-span-2", children: [jsx("span", { children: "الوسوم" }), jsx("input", { value: draft.tagsText || "", onChange: (event) => updateDraft({ tagsText: event.target.value }), className: "min-h-11 w-full va-surface-deep rounded-xl border px-3 text-sm text-white outline-none" })] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300 md:col-span-2", children: [jsx("span", { children: "ملاحظات" }), jsx("textarea", { value: draft.notes || "", onChange: (event) => updateDraft({ notes: event.target.value }), className: "min-h-[90px] w-full va-surface-deep rounded-xl border p-3 text-sm text-white outline-none" })] })
        ] }),
        fields.length > 0 && jsx(GroupedFields, { fields, gap: "gap-4", renderField: (field) => jsxs("label", { className: `space-y-1 text-sm text-gray-300 ${field.type === "textarea" || field.type === "localFile" ? "md:col-span-2" : ""}`, children: [
          jsx("span", { children: field.label }),
          jsx(EditableField, { field, value: draft.metadata?.[fieldKey(field)], onChange: updateMetadata })
        ] }, field.id) }),
        jsxs("div", { className: "flex justify-end gap-2", children: [
          jsx("button", { type: "button", onClick: () => setEditing(false), className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
          jsx("button", { type: "button", onClick: save, className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white", children: "حفظ" })
        ] })
      ] }),
      jsxs("section", { className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]", children: [
        jsxs("div", { className: "va-card space-y-4 rounded-2xl va-surface-muted border p-5 text-right", children: [
          jsxs("h2", { className: "flex items-center gap-2 text-lg font-bold text-white", children: [jsx(FileText, { className: "h-5 w-5 text-emerald-400" }), "البيانات"] }),
          completeness && jsxs("div", { className: "rounded-xl va-surface-muted border p-3", children: [
            jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              jsxs("span", { className: "flex items-center gap-2 text-sm font-semibold", style: { color: COMPLETENESS_TIERS[completeness.tier].color }, children: [
                jsx("span", { "aria-hidden": "true", style: { width: "8px", height: "8px", borderRadius: "9999px", background: COMPLETENESS_TIERS[completeness.tier].color, display: "inline-block" } }),
                `جودة التوصيف: ${COMPLETENESS_TIERS[completeness.tier].label}`
              ] }),
              jsx("span", { dir: "ltr", className: "font-mono text-sm text-gray-300", children: `${completeness.percent}%` })
            ] }),
            jsx("div", { className: "mt-2 h-1.5 overflow-hidden rounded-full bg-white/10", children: jsx("div", { className: "h-full rounded-full", style: { width: `${completeness.percent}%`, background: COMPLETENESS_TIERS[completeness.tier].color } }) }),
            completeness.missing.length ? jsxs("p", { className: "mt-2 text-xs leading-6 text-gray-500", children: ["ينقص: ", completeness.missing.join("، ")] }) : jsx("p", { className: "mt-2 text-xs text-gray-500", children: "كل الحقول الأساسية والمطلوبة مكتملة." })
          ] }),
          item.notes && jsx("p", { className: "rounded-xl va-surface-muted border p-3 text-sm leading-relaxed text-gray-400", children: item.notes }),
          item.metadata?.localFile && jsxs("div", { className: "rounded-xl va-surface-muted border p-3", children: [
            jsxs("div", { className: "flex items-center gap-2", children: [
              jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-300" }),
              jsx("p", { className: "text-xs font-semibold text-emerald-100", children: "الملف المحلي" })
            ] }),
            jsx("div", { className: "mt-2 text-sm text-gray-300", children: jsx(ReadonlyField, { field: { type: "localFile" }, value: item.metadata.localFile }) })
          ] }),
          fields.length ? jsx(GroupedFields, { fields, gap: "gap-3", renderField: (field) => jsxs("div", { className: "rounded-xl va-surface-muted border p-3", children: [
            jsx("p", { className: "text-xs text-gray-600", children: field.label }),
            jsx("div", { className: "mt-1 text-sm text-gray-300", children: jsx(ReadonlyField, { field, value: item.metadata?.[fieldKey(field)] }) })
          ] }, field.id) }) : jsx("p", { className: "text-sm text-gray-500", children: "لا توجد حقول مخصصة لهذا العنصر." })
        ] }),
        jsxs("aside", { className: "va-preview-panel space-y-5 rounded-2xl va-surface-muted border p-5 text-right", children: [
          jsxs("section", { children: [
            jsxs("h2", { className: "flex items-center gap-2 text-base font-bold text-white", children: [jsx(Tags, { className: "h-4 w-4 text-emerald-400" }), "الوسوم", item.tags?.length ? jsx("span", { className: "mr-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400", children: item.tags.length }) : null] }),
            item.tags?.length ? jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: item.tags.map((tag) => jsx("span", { className: "va-tag-chip inline-flex items-center rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:border-emerald-500/25 hover:text-emerald-200", children: tag }, tag)) }) : jsx("p", { className: "mt-3 text-sm text-gray-600", children: "لا توجد وسوم." })
          ] }),
          jsxs("section", { className: "rounded-xl va-surface-subtle border p-3 space-y-2", children: [
            jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-gray-600", children: "معلومات العنصر" }),
            jsxs("div", { className: "space-y-1.5", children: [
              jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                jsx("span", { className: "text-xs text-gray-600", children: "أنشئ" }),
                jsx("span", { className: "text-xs text-gray-400", children: item.createdAt ? formatDateTime(item.createdAt) : "—" })
              ] }),
              jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                jsx("span", { className: "text-xs text-gray-600", children: "آخر تحديث" }),
                jsx("span", { className: "text-xs text-gray-400", children: item.updatedAt ? formatDateTime(item.updatedAt) : "—" })
              ] }),
              jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                jsx("span", { className: "text-xs text-gray-600", children: "الإصدار" }),
                jsx("span", { className: "text-xs text-gray-400", children: `v${formatNumber(item.version || 1)}` })
              ] })
            ] })
          ] }),
          history.length > 0 && jsxs("section", { children: [
            jsx("h2", { className: "text-base font-bold text-white", children: "آخر التغييرات" }),
            jsx("div", { className: "mt-3 space-y-2", children: history.slice(0, 5).map((record) => jsxs("div", { className: "rounded-xl va-surface-subtle border p-3", children: [
              jsx("p", { className: "text-xs font-semibold text-gray-300", children: record.action === "create" ? "إنشاء" : record.action === "update" ? "تعديل" : record.action === "delete" ? "حذف" : record.action === "restore" ? "استعادة" : record.action || "نشاط" }),
              jsx("p", { className: "mt-0.5 text-xs text-gray-600", children: record.timestamp ? formatDateTime(record.timestamp) : "" })
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
