import { normalizeArabicSearchText } from "../../utils/formatting.js";

export const TYPE_COLORS = ["#6366f1", "#10b981", "#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6b7280"];

export const FIELD_TYPE_OPTIONS = [
  { id: "text", label: "نص" },
  { id: "textarea", label: "فقرة" },
  { id: "number", label: "رقم" },
  { id: "date", label: "تاريخ" },
  { id: "select", label: "قائمة" },
  { id: "tags", label: "وسوم" },
  { id: "checkbox", label: "اختيار" },
  { id: "url", label: "رابط" },
  { id: "duration", label: "مدة" },
  { id: "thumbnail", label: "صورة مصغرة" },
  { id: "localFile", label: "ملف محلي" }
];

const FIELD_TYPE_IDS = new Set(FIELD_TYPE_OPTIONS.map((item) => item.id));

export function normalizeFieldStorageKey(value = "") {
  const key = String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u0600-\u06FF-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || `field_${Date.now().toString(36)}`;
}

export function createCustomFieldValue(partial = {}) {
  const name = normalizeFieldStorageKey(partial.name || partial.storageKey || partial.label || "field");
  return {
    id: partial.id || `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    storageKey: normalizeFieldStorageKey(partial.storageKey || name),
    label: String(partial.label || "حقل جديد").trim(),
    type: FIELD_TYPE_IDS.has(partial.type) ? partial.type : "text",
    required: !!partial.required,
    searchable: partial.searchable ?? true,
    hidden: !!partial.hidden,
    multiple: !!partial.multiple,
    defaultValue: partial.defaultValue,
    options: Array.isArray(partial.options) ? partial.options : parseFieldOptions(partial.options),
    placeholder: partial.placeholder || "",
    description: partial.description || "",
    order: Number.isFinite(Number(partial.order)) ? Number(partial.order) : 0,
    groupId: partial.groupId,
    status: partial.status || "active",
    archivedAt: partial.archivedAt,
    archivedBy: partial.archivedBy
  };
}

export function createSubtypeValue(partial = {}) {
  return {
    id: partial.id || `subtype_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(partial.name || "نوع فرعي جديد").trim(),
    nameEn: partial.nameEn || "",
    fields: Array.isArray(partial.fields) ? partial.fields : [],
    order: Number.isFinite(Number(partial.order)) ? Number(partial.order) : 0,
    status: partial.status || "active",
    coverImage: partial.coverImage || null,
    coverFit: partial.coverFit || "cover",
    coverSourceName: partial.coverSourceName || "",
    coverUpdatedAt: partial.coverUpdatedAt || null,
    archivedAt: partial.archivedAt,
    archivedBy: partial.archivedBy
  };
}

export function createContentTypeValue(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: partial.id || `type_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(partial.name || "نوع جديد").trim(),
    nameEn: partial.nameEn || "",
    icon: partial.icon || "📁",
    iconSpec: partial.iconSpec || { type: "emoji", value: partial.icon || "📁" },
    color: partial.color || "#6366f1",
    coverImage: partial.coverImage || null,
    coverFit: partial.coverFit || "cover",
    coverSourceName: partial.coverSourceName || "",
    coverUpdatedAt: partial.coverUpdatedAt || null,
    subtypes: Array.isArray(partial.subtypes) ? partial.subtypes : [],
    fields: Array.isArray(partial.fields) ? partial.fields : [],
    order: Number.isFinite(Number(partial.order)) ? Number(partial.order) : 0,
    status: partial.status || "active",
    archivedAt: partial.archivedAt,
    archivedBy: partial.archivedBy,
    createdAt: partial.createdAt || now,
    updatedAt: now
  };
}

const DEFAULT_ARCHIVE_CONTENT_TYPE_DEFINITIONS = [
  {
    id: "type_raw-footage",
    name: "مواد خام",
    nameEn: "raw-footage",
    icon: "🎞️",
    color: "#14b8a6",
    fields: [
      { id: "field_raw_local_file", label: "الملف المحلي", storageKey: "localFile", type: "localFile", order: 0, description: "اختر الملف الأصلي من الجهاز لحفظ بياناته داخل المادة." },
      { id: "field_raw_source", label: "المصدر", storageKey: "source", type: "text", order: 1 },
      { id: "field_raw_recorded_at", label: "تاريخ التسجيل", storageKey: "recordedAt", type: "date", order: 2 }
    ],
    subtypes: ["لقطة ميدانية", "B-roll", "أرشيف قديم"]
  },
  {
    id: "type_interviews",
    name: "مقابلات",
    nameEn: "interviews",
    icon: "🎙️",
    color: "#10b981",
    fields: [
      { id: "field_interview_local_file", label: "ملف المقابلة", storageKey: "localFile", type: "localFile", order: 0 },
      { id: "field_interview_guest", label: "الضيف", storageKey: "guest", type: "text", order: 1 },
      { id: "field_interview_location", label: "الموقع", storageKey: "location", type: "text", order: 2 }
    ],
    subtypes: ["كاملة", "مقتطفات", "عن بعد"]
  },
  {
    id: "type_reports",
    name: "تقارير",
    nameEn: "reports",
    icon: "🧾",
    color: "#3b82f6",
    fields: [
      { id: "field_report_local_file", label: "ملف التقرير", storageKey: "localFile", type: "localFile", order: 0 },
      { id: "field_report_subject", label: "الموضوع", storageKey: "subject", type: "text", order: 1 },
      { id: "field_report_status", label: "الحالة", storageKey: "status", type: "select", options: ["مسودة", "جاهز", "منشور"], order: 2 }
    ],
    subtypes: ["إخباري", "تحقيقي", "تحليلي"]
  },
  {
    id: "type_programs",
    name: "برامج وحلقات",
    nameEn: "programs",
    icon: "📺",
    color: "#8b5cf6",
    fields: [
      { id: "field_program_local_file", label: "ملف الحلقة", storageKey: "localFile", type: "localFile", order: 0 },
      { id: "field_program_name", label: "اسم البرنامج", storageKey: "programName", type: "text", order: 1 },
      { id: "field_episode_number", label: "رقم الحلقة", storageKey: "episodeNumber", type: "number", order: 2 }
    ],
    subtypes: ["حلقة كاملة", "برومو", "مقطع من الحلقة"]
  },
  {
    id: "type_social-clips",
    name: "مقاطع قصيرة",
    nameEn: "social-clips",
    icon: "⚡",
    color: "#f59e0b",
    fields: [
      { id: "field_clip_local_file", label: "ملف المقطع", storageKey: "localFile", type: "localFile", order: 0 },
      { id: "field_clip_platform", label: "المنصة", storageKey: "platform", type: "select", options: ["YouTube", "TikTok", "Instagram", "X"], order: 1 }
    ],
    subtypes: ["عمودي", "أفقي", "مربع"]
  },
  {
    id: "type_documents",
    name: "وثائق وملفات",
    nameEn: "documents",
    icon: "📁",
    color: "#6b7280",
    fields: [
      { id: "field_document_local_file", label: "الملف المحلي", storageKey: "localFile", type: "localFile", order: 0 },
      { id: "field_document_owner", label: "الجهة المالكة", storageKey: "owner", type: "text", order: 1 }
    ],
    subtypes: ["مستند داعم", "صورة مصغرة", "ملف مشروع"]
  }
];

export function getDefaultArchiveContentTypes() {
  return DEFAULT_ARCHIVE_CONTENT_TYPE_DEFINITIONS.map((type, typeIndex) => createContentTypeValue({
    ...type,
    order: typeIndex,
    fields: (type.fields || []).map((field) => createCustomFieldValue(field)),
    subtypes: (type.subtypes || []).map((name, subtypeIndex) => createSubtypeValue({
      id: `${type.id}_subtype_${subtypeIndex + 1}`,
      name,
      order: subtypeIndex
    }))
  }));
}

export function getMissingDefaultArchiveContentTypes(contentTypes = []) {
  const existingKeys = new Set((contentTypes || []).flatMap((type) => [
    type.id,
    normalizeArabicSearchText(type.name),
    normalizeArabicSearchText(type.nameEn)
  ].filter(Boolean)));

  return getDefaultArchiveContentTypes().filter((type) => !existingKeys.has(type.id)
    && !existingKeys.has(normalizeArabicSearchText(type.name))
    && !existingKeys.has(normalizeArabicSearchText(type.nameEn)));
}

export function parseFieldOptions(value = "") {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value).split(/[,،\n]/).map((item) => item.trim()).filter(Boolean);
}

export function getFilteredContentTypes(contentTypes = [], query = "", includeArchived = false) {
  const normalizedQuery = normalizeArabicSearchText(query);
  return [...contentTypes]
    .filter((type) => includeArchived || type.status !== "archived")
    .filter((type) => {
      if (!normalizedQuery) return true;
      return [
        type.name,
        type.nameEn,
        type.id,
        ...(type.subtypes || []).map((subtype) => subtype.name)
      ].some((value) => normalizeArabicSearchText(value).includes(normalizedQuery));
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name || "").localeCompare(String(b.name || ""), "ar"));
}

export function getTypeUsageCounts(contentTypes = [], videoItems = []) {
  return Object.fromEntries(contentTypes.map((type) => [
    type.id,
    videoItems.filter((item) => item.type === type.id && !item.isDeleted).length
  ]));
}

export function getFieldsForSelection(contentTypes = [], typeId, subtypeId) {
  const type = contentTypes.find((item) => item.id === typeId);
  if (!type) return [];
  const subtype = (type.subtypes || []).find((item) => item.id === subtypeId);
  return [
    ...(type.fields || []),
    ...((subtype?.fields || []))
  ].filter((field) => field.status !== "archived" && !field.hidden)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
