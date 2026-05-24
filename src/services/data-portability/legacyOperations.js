import { validateBackupData } from "./validation.js";
import { sanitizePlainData } from "./json.js";
import {
  STORES,
  dbGet,
  dbPut,
  dbPutBatch,
  getIndexedDbDataSnapshot,
  writeNormalizedDataToIndexedDb,
  writeStorageManifest
} from "../storage/index.js";

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeContentType(type = {}) {
  return {
    ...type,
    id: String(type.id || `type_${Date.now().toString(36)}`),
    name: String(type.name || type.label || "نوع محتوى").trim(),
    fields: Array.isArray(type.fields) ? type.fields : [],
    subtypes: Array.isArray(type.subtypes) ? type.subtypes : [],
    status: type.status || "active",
    iconSpec: type.iconSpec || undefined,
    coverImage: type.coverImage || ""
  };
}

function normalizeVideoItem(item = {}) {
  const now = new Date().toISOString();
  return {
    ...item,
    id: String(item.id || `video_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`),
    type: String(item.type || ""),
    subtype: String(item.subtype || ""),
    title: String(item.title || "بدون عنوان").trim(),
    path: String(item.path || item.filePath || item.url || "").trim(),
    metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {},
    tags: Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [],
    isFavorite: !!item.isFavorite,
    isDeleted: !!item.isDeleted,
    version: Number(item.version || 1),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || item.createdAt || now
  };
}

function normalizePortableUser(user = {}) {
  return {
    ...user,
    id: String(user.id || `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`),
    username: String(user.username || "imported-user").trim(),
    displayName: String(user.displayName || user.username || "مستخدم مستورد").trim(),
    passwordHash: "",
    role: user.role === "admin" ? "viewer" : user.role || "viewer",
    customPermissions: undefined,
    isActive: false,
    mustChangePassword: true,
    updatedAt: new Date().toISOString()
  };
}

export function normalizeBackupData(data = {}) {
  const plain = sanitizePlainData(data) || {};
  return {
    contentTypes: normalizeArray(plain.contentTypes).map(normalizeContentType),
    videoItems: normalizeArray(plain.videoItems).map(normalizeVideoItem),
    settings: plain.settings && typeof plain.settings === "object"
      ? { ...plain.settings, masterPasswordHash: undefined, initialAdminPassword: undefined, key: "app_settings" }
      : undefined,
    changeHistory: normalizeArray(plain.changeHistory),
    bookmarks: normalizeArray(plain.bookmarks),
    relations: normalizeArray(plain.relations),
    virtualCollections: normalizeArray(plain.virtualCollections),
    vocabulary: normalizeArray(plain.vocabulary),
    hierarchicalTags: normalizeArray(plain.hierarchicalTags),
    users: normalizeArray(plain.users).map(normalizePortableUser),
    auditLogs: normalizeArray(plain.auditLogs),
    exportedAt: plain.exportedAt || new Date().toISOString(),
    version: "2.0"
  };
}

async function mergeNormalizedPayload(data) {
  await dbPutBatch(STORES.TYPES, data.contentTypes);
  await dbPutBatch(STORES.ITEMS, data.videoItems);
  await dbPutBatch(STORES.HISTORY, data.changeHistory);
  await dbPutBatch(STORES.BOOKMARKS, data.bookmarks);
  await dbPutBatch(STORES.RELATIONS, data.relations);
  await dbPutBatch(STORES.COLLECTIONS, data.virtualCollections);
  await dbPutBatch(STORES.VOCABULARY, data.vocabulary);
  await dbPutBatch(STORES.HTAGS, data.hierarchicalTags);
  await dbPutBatch(STORES.AUDIT_LOGS, data.auditLogs);

  if (data.users.length) {
    await dbPutBatch(STORES.USERS, data.users);
  }

  if (data.settings) {
    const current = await dbGet(STORES.SETTINGS, "app_settings").catch(() => ({ key: "app_settings" }));
    await dbPut(STORES.SETTINGS, {
      ...(current || { key: "app_settings" }),
      ...data.settings,
      key: "app_settings",
      masterPasswordHash: current?.masterPasswordHash,
      initialAdminPassword: undefined
    });
  }

  const snapshot = await getIndexedDbDataSnapshot();
  await writeStorageManifest("دمج ملف مستورد", snapshot);
  return snapshot;
}

export async function importNormalizedPayload(payload, mode = "merge") {
  const normalizedPayload = normalizeBackupData(payload);
  const validation = validateBackupData(normalizedPayload);
  if (!validation.valid) return { success: false, errors: validation.errors };

  const previousSnapshot = await getIndexedDbDataSnapshot();
  try {
    if (mode === "replace") {
      await writeNormalizedDataToIndexedDb(normalizedPayload);
      await writeStorageManifest("استبدال كامل للبيانات", normalizedPayload);
    } else {
      await mergeNormalizedPayload(normalizedPayload);
    }
    return { success: true, errors: [], data: normalizedPayload };
  } catch (error) {
    try {
      await writeNormalizedDataToIndexedDb(previousSnapshot);
      await writeStorageManifest("استرجاع قبل فشل الاستيراد", previousSnapshot);
    } catch {
      // Keep the original import failure visible to the caller.
    }
    return { success: false, errors: [error?.message || "فشل استيراد البيانات وتمت محاولة التراجع"] };
  }
}
