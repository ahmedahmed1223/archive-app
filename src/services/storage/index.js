import { DB_NAME, DB_VERSION, STORES } from "./schema.js";

export { DB_NAME, DB_VERSION, STORES } from "./schema.js";

const DATA_STORES = [
  STORES.TYPES,
  STORES.ITEMS,
  STORES.HISTORY,
  STORES.BOOKMARKS,
  STORES.RELATIONS,
  STORES.COLLECTIONS,
  STORES.VOCABULARY,
  STORES.HTAGS,
  STORES.AUDIT_LOGS
];

const STORE_KEY_PATHS = {
  [STORES.SETTINGS]: "key"
};

let dbPromise = null;

function getKeyPath(storeName) {
  return STORE_KEY_PATHS[storeName] || "id";
}

function ensureObjectStores(db) {
  Object.values(STORES).forEach((storeName) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: getKeyPath(storeName) });
    }
  });
}

export function openStorageDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB غير متاح في هذه البيئة."));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => ensureObjectStores(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("تعذر فتح IndexedDB"));
    request.onblocked = () => reject(new Error("قاعدة البيانات مشغولة في تبويب آخر."));
  });

  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("تم إلغاء معاملة IndexedDB"));
  });
}

export async function dbGet(storeName, key) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readonly");
  return requestToPromise(tx.objectStore(storeName).get(key));
}

export async function dbGetAll(storeName) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readonly");
  return requestToPromise(tx.objectStore(storeName).getAll());
}

export async function dbPut(storeName, record) {
  if (!record) return record;
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).put(record);
  await transactionDone(tx);
  return record;
}

export async function dbAdd(storeName, record) {
  if (!record) return record;
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).add(record);
  await transactionDone(tx);
  return record;
}

export async function dbDelete(storeName, key) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).delete(key);
  await transactionDone(tx);
}

export async function dbClear(storeName) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).clear();
  await transactionDone(tx);
}

export async function dbPutBatch(storeName, items = []) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  for (const item of items || []) {
    if (item) store.put(item);
  }
  await transactionDone(tx);
  return items;
}

export async function dbDeleteBatch(storeName, keys = []) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  for (const key of keys || []) {
    if (key !== undefined && key !== null) store.delete(key);
  }
  await transactionDone(tx);
  return keys;
}

export async function getIndexedDbDataSnapshot() {
  const settingsDoc = await dbGet(STORES.SETTINGS, "app_settings").catch(() => null);
  return {
    contentTypes: await dbGetAll(STORES.TYPES).catch(() => []),
    videoItems: await dbGetAll(STORES.ITEMS).catch(() => []),
    settings: settingsDoc || undefined,
    changeHistory: await dbGetAll(STORES.HISTORY).catch(() => []),
    bookmarks: await dbGetAll(STORES.BOOKMARKS).catch(() => []),
    relations: await dbGetAll(STORES.RELATIONS).catch(() => []),
    virtualCollections: await dbGetAll(STORES.COLLECTIONS).catch(() => []),
    vocabulary: await dbGetAll(STORES.VOCABULARY).catch(() => []),
    hierarchicalTags: await dbGetAll(STORES.HTAGS).catch(() => []),
    users: await dbGetAll(STORES.USERS).catch(() => []),
    auditLogs: await dbGetAll(STORES.AUDIT_LOGS).catch(() => []),
    exportedAt: new Date().toISOString(),
    version: "2.0"
  };
}

export async function writeNormalizedDataToIndexedDb(data = {}) {
  const db = await openStorageDb();
  const storeNames = Array.from(new Set([...DATA_STORES, STORES.USERS, STORES.SETTINGS]));
  const tx = db.transaction(storeNames, "readwrite");

  for (const storeName of DATA_STORES) tx.objectStore(storeName).clear();
  if (Array.isArray(data.users) && data.users.length) tx.objectStore(STORES.USERS).clear();

  const putMany = (storeName, records = []) => {
    const store = tx.objectStore(storeName);
    for (const record of records || []) {
      if (record) store.put(record);
    }
  };

  putMany(STORES.TYPES, data.contentTypes);
  putMany(STORES.ITEMS, data.videoItems);
  putMany(STORES.HISTORY, data.changeHistory);
  putMany(STORES.BOOKMARKS, data.bookmarks);
  putMany(STORES.RELATIONS, data.relations);
  putMany(STORES.COLLECTIONS, data.virtualCollections);
  putMany(STORES.VOCABULARY, data.vocabulary);
  putMany(STORES.HTAGS, data.hierarchicalTags);
  putMany(STORES.AUDIT_LOGS, data.auditLogs);
  if (Array.isArray(data.users) && data.users.length) putMany(STORES.USERS, data.users);
  if (data.settings) tx.objectStore(STORES.SETTINGS).put({ ...data.settings, key: "app_settings" });

  await transactionDone(tx);
}

export async function writeStorageManifest(reason, data = {}) {
  const currentSettings = await dbGet(STORES.SETTINGS, "app_settings").catch(() => ({ key: "app_settings" }));
  const manifest = {
    commitId: `manifest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    reason,
    updatedAt: new Date().toISOString(),
    counts: {
      contentTypes: data.contentTypes?.length || 0,
      videoItems: data.videoItems?.length || 0,
      bookmarks: data.bookmarks?.length || 0,
      relations: data.relations?.length || 0,
      virtualCollections: data.virtualCollections?.length || 0,
      vocabulary: data.vocabulary?.length || 0,
      hierarchicalTags: data.hierarchicalTags?.length || 0,
      auditLogs: data.auditLogs?.length || 0
    }
  };
  await dbPut(STORES.SETTINGS, { ...(currentSettings || { key: "app_settings" }), storageManifest: manifest });
  return manifest;
}

export async function persistEntityAcrossStores(storeName, record, beforePersist, options = {}) {
  try {
    await beforePersist?.();
  } catch (error) {
    if (!options.allowIndexedDbFallback) throw error;
  }
  if (options.deleteKey !== undefined) {
    await dbDelete(storeName, options.deleteKey);
    return null;
  }
  if (options.add) return dbAdd(storeName, record);
  return dbPut(storeName, record);
}

export async function withStoreOperation(_context, operation) {
  return operation();
}
