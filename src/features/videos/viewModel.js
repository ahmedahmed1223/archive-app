export function createVideoItemValue(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: partial.id || `video_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: partial.type || "",
    subtype: partial.subtype || "",
    title: String(partial.title || "").trim(),
    path: String(partial.path || "").trim(),
    parentId: partial.parentId,
    thumbnail: partial.thumbnail || "",
    metadata: partial.metadata && typeof partial.metadata === "object" ? partial.metadata : {},
    tags: parseVideoTags(partial.tags),
    notes: String(partial.notes || "").trim(),
    isFavorite: !!partial.isFavorite,
    isDeleted: !!partial.isDeleted,
    version: partial.version || 1,
    createdAt: partial.createdAt || now,
    updatedAt: now
  };
}

export function parseVideoTags(value = []) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  return String(value).split(/[,،#\n]/).map((tag) => tag.trim()).filter(Boolean);
}

export function createLocalFileValue(file) {
  if (!file) return null;
  const name = file.name || "";
  const extension = name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";
  return {
    name,
    path: file.path || file.webkitRelativePath || "",
    relativePath: file.webkitRelativePath || "",
    size: Number.isFinite(file.size) ? file.size : 0,
    type: file.type || "",
    lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    extension
  };
}

export function normalizeLocalFileValue(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const name = value.split(/[\\/]/).pop() || value;
    const extension = name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";
    return { name, path: value, relativePath: "", size: 0, type: "", lastModified: null, extension };
  }
  if (typeof value === "object") {
    const name = value.name || String(value.path || "").split(/[\\/]/).pop() || "";
    return {
      name,
      path: value.path || "",
      relativePath: value.relativePath || "",
      size: Number.isFinite(Number(value.size)) ? Number(value.size) : 0,
      type: value.type || "",
      lastModified: value.lastModified || null,
      extension: value.extension || (name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "")
    };
  }
  return null;
}

export function getTypeLabel(contentTypes = [], typeId = "") {
  return contentTypes.find((type) => type.id === typeId)?.name || typeId || "غير مصنف";
}

export function getSubtypeLabel(contentTypes = [], typeId = "", subtypeId = "") {
  const type = contentTypes.find((item) => item.id === typeId);
  return (type?.subtypes || []).find((subtype) => subtype.id === subtypeId)?.name || subtypeId || "";
}
