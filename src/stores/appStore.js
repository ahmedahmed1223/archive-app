import bcrypt from "bcryptjs";
import * as React from "react";
import { createVideoItemValue } from "../features/videos/viewModel.js";
import { createContentTypeValue } from "../features/types/viewModel.js";
import { createVirtualCollectionValue } from "../features/collections/viewModel.js";
import {
  STORES,
  dbClear,
  dbDelete,
  dbGet,
  dbGetAll,
  dbPut,
  dbPutBatch,
  getIndexedDbDataSnapshot,
  writeNormalizedDataToIndexedDb
} from "../services/storage/index.js";
import { createPortableArchivePayload } from "../services/data-portability/payload.js";
import { hashPassword } from "../utils/passwordHash.js";

function createStore(initializer) {
  let state;
  const listeners = new Set();

  const setState = (partial) => {
    const patch = typeof partial === "function" ? partial(state) : partial;
    if (!patch || typeof patch !== "object") return;
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const getState = () => state;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = (selector = (value) => value) => {
    const snapshot = React.useSyncExternalStore(subscribe, getState, getState);
    return selector(snapshot);
  };

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;
  state = initializer(setState, getState);
  return useStore;
}

function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function defaultSettings() {
  return {
    theme: "dark",
    accentColor: "teal",
    numberSystem: "arabic",
    dateFormat: "gregorian",
    backupSchedule: "manual",
    lastBackupAt: null,
    keyboardShortcuts: {},
    ui: {
      v1OnboardingCompleted: false,
      v1TourCompleted: false,
      onboardingSkippedAt: null,
      lastOnboardingStep: "welcome",
      onboardingSecurityMode: "secure",
      onboardingThemeChoice: "dark",
      visualDensity: "comfortable",
      startupMode: "balanced",
      lastSettingsTab: "general",
      lastDataCenterTab: "export",
      lastImportMode: "merge",
      transferLastMode: "merge",
      firstTaskChoice: "dashboard",
      firstTaskChoiceUsed: false
    },
    notifications: {
      durationMs: 5500,
      persistImportant: true,
      desktopEnabled: false
    },
    systemHealth: {
      lastCheckAt: null,
      startupLastStatus: null
    }
  };
}

function mergeSettings(current = {}, patch = {}) {
  return {
    ...current,
    ...patch,
    ui: { ...(current.ui || {}), ...(patch.ui || {}) },
    notifications: { ...(current.notifications || {}), ...(patch.notifications || {}) },
    systemHealth: { ...(current.systemHealth || {}), ...(patch.systemHealth || {}) }
  };
}

function normalizeUser(user = {}) {
  const createdAt = user.createdAt || nowIso();
  return {
    id: user.id || generateId("user"),
    username: String(user.username || "admin").trim(),
    displayName: String(user.displayName || user.username || "المدير").trim(),
    passwordHash: user.passwordHash || "",
    role: user.role || "viewer",
    customPermissions: user.customPermissions,
    isActive: user.isActive !== false,
    lastLoginAt: user.lastLoginAt || null,
    mustChangePassword: !!user.mustChangePassword,
    createdAt,
    updatedAt: user.updatedAt || createdAt
  };
}

function normalizeChangeRecord(record = {}) {
  return {
    ...record,
    id: record.id || generateId("history"),
    timestamp: record.timestamp || nowIso()
  };
}

function uniqueById(records = []) {
  const map = new Map();
  records.filter(Boolean).forEach((record) => map.set(record.id, record));
  return [...map.values()];
}

async function persistSettings(settings) {
  await dbPut(STORES.SETTINGS, { ...settings, key: "app_settings" });
}

async function persistList(storeName, records) {
  await dbPutBatch(storeName, records);
}

function makeExportPayload(state, options = {}) {
  let videoItems = state.videoItems || [];
  if (options.typeFilter && options.typeFilter !== "all") {
    videoItems = videoItems.filter((item) => item.type === options.typeFilter);
  }
  if (options.collectionFilter && options.collectionFilter !== "all") {
    const collection = state.virtualCollections.find((item) => item.id === options.collectionFilter);
    const ids = new Set(collection?.itemIds || []);
    videoItems = videoItems.filter((item) => ids.has(item.id));
  }
  if (options.favoritesOnly) videoItems = videoItems.filter((item) => item.isFavorite);
  return createPortableArchivePayload({ ...state, videoItems });
}

export const useAppStore = createStore((set, get) => ({
  videoItems: [],
  contentTypes: [],
  changeHistory: [],
  bookmarks: [],
  relations: [],
  virtualCollections: [],
  vocabulary: [],
  hierarchicalTags: [],
  users: [],
  auditLogs: [],
  currentUser: null,
  currentPage: "dashboard",
  selectedItemId: null,
  selectedTypeId: null,
  searchQuery: "",
  filterType: "all",
  filterSubtype: "all",
  viewMode: "grid",
  sidebarOpen: true,
  isLoading: true,
  isLocked: false,
  isPasswordSet: false,
  toast: null,
  notifications: [],
  notificationHistory: [],
  notificationCenterOpen: false,
  selectedItems: [],
  backgroundOperation: null,
  sqliteReady: false,
  sqliteError: null,
  settings: defaultSettings(),

  showNotification: (message, options = {}) => {
    const type = options.type || "info";
    const notification = {
      id: options.id || generateId("notification"),
      title: options.title || (type === "error" ? "خطأ" : type === "warning" ? "تنبيه" : type === "success" ? "تم بنجاح" : "معلومة"),
      message: String(message || ""),
      type,
      createdAt: nowIso(),
      persistent: !!options.persistent
    };
    set((state) => ({
      toast: { message: notification.message, type },
      notifications: [notification, ...(state.notifications || [])].slice(0, 6),
      notificationHistory: [notification, ...(state.notificationHistory || [])].slice(0, 60)
    }));
    if (!notification.persistent) {
      window.setTimeout(() => get().dismissNotification(notification.id), options.durationMs || get().settings.notifications?.durationMs || 5500);
    }
    return notification.id;
  },
  showToast: (message, type = "info") => get().showNotification(message, { type }),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((item) => item.id !== id),
    toast: state.notifications.length <= 1 ? null : state.toast
  })),
  clearNotifications: () => set({ notifications: [], toast: null }),
  clearNotificationHistory: () => set({ notificationHistory: [] }),
  toggleNotificationCenter: () => set((state) => ({ notificationCenterOpen: !state.notificationCenterOpen })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  loadAllData: async () => {
    set({ isLoading: true });
    try {
      const settingsDoc = await dbGet(STORES.SETTINGS, "app_settings").catch(() => null);
      const settings = mergeSettings(defaultSettings(), settingsDoc || {});
      const users = (await dbGetAll(STORES.USERS).catch(() => [])).map(normalizeUser);
      set({
        contentTypes: await dbGetAll(STORES.TYPES).catch(() => []),
        videoItems: await dbGetAll(STORES.ITEMS).catch(() => []),
        changeHistory: await dbGetAll(STORES.HISTORY).catch(() => []),
        bookmarks: await dbGetAll(STORES.BOOKMARKS).catch(() => []),
        relations: await dbGetAll(STORES.RELATIONS).catch(() => []),
        virtualCollections: await dbGetAll(STORES.COLLECTIONS).catch(() => []),
        vocabulary: await dbGetAll(STORES.VOCABULARY).catch(() => []),
        hierarchicalTags: await dbGetAll(STORES.HTAGS).catch(() => []),
        users,
        auditLogs: await dbGetAll(STORES.AUDIT_LOGS).catch(() => []),
        settings,
        isPasswordSet: users.some((user) => !!user.passwordHash) || !!settings.masterPasswordHash,
        isLocked: users.some((user) => !!user.passwordHash) || !!settings.masterPasswordHash,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, sqliteError: error?.message || "تعذر تحميل البيانات" });
      get().showToast(error?.message || "تعذر تحميل البيانات", "error");
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  goToPage: (page) => set({ currentPage: page, selectedItemId: null }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterSubtype: (filterSubtype) => set({ filterSubtype }),
  setViewMode: (viewMode) => set({ viewMode }),
  addRecentSearch: (query) => set((state) => ({
    recentSearches: [query, ...(state.recentSearches || []).filter((item) => item !== query)].slice(0, 12)
  })),
  toggleBulkSelect: (id) => set((state) => ({
    selectedItems: state.selectedItems.includes(id) ? state.selectedItems.filter((item) => item !== id) : [...state.selectedItems, id]
  })),
  selectAllItems: () => set((state) => ({ selectedItems: state.videoItems.filter((item) => !item.isDeleted).map((item) => item.id) })),
  clearSelection: () => set({ selectedItems: [] }),

  addAuditLog: async (eventType, targetId, targetType, details) => {
    const authState = useAuthStore.getState();
    const log = {
      id: generateId("audit"),
      userId: authState.currentUser?.id || "system",
      username: authState.currentUser?.username || "النظام",
      eventType,
      targetId,
      targetType,
      details,
      timestamp: nowIso()
    };
    set((state) => ({ auditLogs: [log, ...state.auditLogs].slice(0, 1000) }));
    await dbPut(STORES.AUDIT_LOGS, log).catch(() => {});
    return log;
  },

  addVideoItem: async (item) => {
    const value = createVideoItemValue(item);
    const record = normalizeChangeRecord({ itemId: value.id, action: "create", title: value.title, timestamp: nowIso() });
    set((state) => ({ videoItems: [value, ...state.videoItems], changeHistory: [record, ...state.changeHistory] }));
    await dbPut(STORES.ITEMS, value);
    await dbPut(STORES.HISTORY, record);
    return value;
  },
  updateVideoItem: async (item) => {
    const updated = createVideoItemValue({ ...item, updatedAt: nowIso(), id: item.id });
    const record = normalizeChangeRecord({ itemId: updated.id, action: "update", title: updated.title, timestamp: nowIso() });
    set((state) => ({
      videoItems: state.videoItems.map((current) => current.id === updated.id ? updated : current),
      changeHistory: [record, ...state.changeHistory]
    }));
    await dbPut(STORES.ITEMS, updated);
    await dbPut(STORES.HISTORY, record);
    return updated;
  },
  deleteVideoItem: async (id) => {
    const target = get().videoItems.find((item) => item.id === id);
    if (!target) return false;
    const updated = { ...target, isDeleted: true, updatedAt: nowIso() };
    set((state) => ({ videoItems: state.videoItems.map((item) => item.id === id ? updated : item) }));
    await dbPut(STORES.ITEMS, updated);
    return true;
  },
  restoreVideoItem: async (id) => {
    const target = get().videoItems.find((item) => item.id === id);
    if (!target) return false;
    const updated = { ...target, isDeleted: false, updatedAt: nowIso() };
    set((state) => ({ videoItems: state.videoItems.map((item) => item.id === id ? updated : item) }));
    await dbPut(STORES.ITEMS, updated);
    return true;
  },
  toggleFavorite: async (id) => {
    const target = get().videoItems.find((item) => item.id === id);
    if (!target) return false;
    const updated = { ...target, isFavorite: !target.isFavorite, updatedAt: nowIso() };
    set((state) => ({ videoItems: state.videoItems.map((item) => item.id === id ? updated : item) }));
    await dbPut(STORES.ITEMS, updated);
    return true;
  },
  bulkDeleteItems: async (ids = []) => {
    const idSet = new Set(ids);
    const updated = get().videoItems.map((item) => idSet.has(item.id) ? { ...item, isDeleted: true, updatedAt: nowIso() } : item);
    set({ videoItems: updated, selectedItems: [] });
    await persistList(STORES.ITEMS, updated.filter((item) => idSet.has(item.id)));
  },
  bulkRestoreItems: async (ids = []) => {
    const idSet = new Set(ids);
    const updated = get().videoItems.map((item) => idSet.has(item.id) ? { ...item, isDeleted: false, updatedAt: nowIso() } : item);
    set({ videoItems: updated, selectedItems: [] });
    await persistList(STORES.ITEMS, updated.filter((item) => idSet.has(item.id)));
  },
  emptyTrash: async () => {
    const deleted = get().videoItems.filter((item) => item.isDeleted);
    set((state) => ({ videoItems: state.videoItems.filter((item) => !item.isDeleted) }));
    for (const item of deleted) await dbDelete(STORES.ITEMS, item.id);
  },

  addContentType: async (type) => {
    const value = createContentTypeValue(type);
    set((state) => ({ contentTypes: [...state.contentTypes, value] }));
    await dbPut(STORES.TYPES, value);
    return value;
  },
  updateContentType: async (type) => {
    const updated = createContentTypeValue({ ...type, id: type.id, createdAt: type.createdAt });
    set((state) => ({ contentTypes: state.contentTypes.map((item) => item.id === updated.id ? updated : item) }));
    await dbPut(STORES.TYPES, updated);
    return updated;
  },
  deleteContentType: async (id) => {
    const updated = get().contentTypes.map((item) => item.id === id ? { ...item, status: "archived", archivedAt: nowIso(), updatedAt: nowIso() } : item);
    set({ contentTypes: updated });
    const target = updated.find((item) => item.id === id);
    if (target) await dbPut(STORES.TYPES, target);
    return true;
  },

  addVirtualCollection: async (collection) => {
    const value = createVirtualCollectionValue(collection);
    set((state) => ({ virtualCollections: [value, ...state.virtualCollections] }));
    await dbPut(STORES.COLLECTIONS, value);
    return value;
  },
  updateVirtualCollection: async (collection) => {
    const updated = createVirtualCollectionValue({ ...collection, id: collection.id, createdAt: collection.createdAt });
    set((state) => ({ virtualCollections: state.virtualCollections.map((item) => item.id === updated.id ? updated : item) }));
    await dbPut(STORES.COLLECTIONS, updated);
    return updated;
  },
  deleteVirtualCollection: async (id) => {
    set((state) => ({ virtualCollections: state.virtualCollections.filter((item) => item.id !== id) }));
    await dbDelete(STORES.COLLECTIONS, id);
  },
  addItemsToCollection: async (collectionId, itemIds = []) => {
    const collection = get().virtualCollections.find((item) => item.id === collectionId);
    if (!collection) return false;
    const updated = { ...collection, itemIds: [...new Set([...(collection.itemIds || []), ...itemIds])], updatedAt: nowIso() };
    return get().updateVirtualCollection(updated);
  },
  removeItemsFromCollection: async (collectionId, itemIds = []) => {
    const ids = new Set(itemIds);
    const collection = get().virtualCollections.find((item) => item.id === collectionId);
    if (!collection) return false;
    const updated = { ...collection, itemIds: (collection.itemIds || []).filter((id) => !ids.has(id)), updatedAt: nowIso() };
    return get().updateVirtualCollection(updated);
  },

  addVocabularyEntry: async (entry) => {
    const value = { ...entry, id: entry.id || generateId("vocab"), updatedAt: nowIso(), createdAt: entry.createdAt || nowIso() };
    set((state) => ({ vocabulary: [value, ...state.vocabulary] }));
    await dbPut(STORES.VOCABULARY, value);
    return value;
  },
  updateVocabularyEntry: async (entry) => {
    const updated = { ...entry, updatedAt: nowIso() };
    set((state) => ({ vocabulary: state.vocabulary.map((item) => item.id === updated.id ? updated : item) }));
    await dbPut(STORES.VOCABULARY, updated);
    return updated;
  },
  deleteVocabularyEntry: async (id) => {
    set((state) => ({ vocabulary: state.vocabulary.filter((item) => item.id !== id) }));
    await dbDelete(STORES.VOCABULARY, id);
  },

  addHierarchicalTag: async (tag) => {
    const value = { ...tag, id: tag.id || generateId("htag"), updatedAt: nowIso(), createdAt: tag.createdAt || nowIso() };
    set((state) => ({ hierarchicalTags: [value, ...state.hierarchicalTags] }));
    await dbPut(STORES.HTAGS, value);
    return value;
  },
  updateHierarchicalTag: async (tag) => {
    const updated = { ...tag, updatedAt: nowIso() };
    set((state) => ({ hierarchicalTags: state.hierarchicalTags.map((item) => item.id === updated.id ? updated : item) }));
    await dbPut(STORES.HTAGS, updated);
    return updated;
  },
  deleteHierarchicalTag: async (id) => {
    const childIds = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const tag of get().hierarchicalTags) {
        if (tag.parentId && childIds.has(tag.parentId) && !childIds.has(tag.id)) {
          childIds.add(tag.id);
          changed = true;
        }
      }
    }
    set((state) => ({ hierarchicalTags: state.hierarchicalTags.filter((item) => !childIds.has(item.id)) }));
    for (const tagId of childIds) await dbDelete(STORES.HTAGS, tagId);
  },
  getTagUsageCount: (tagId) => {
    const tag = get().hierarchicalTags.find((item) => item.id === tagId);
    if (!tag) return 0;
    const names = new Set([tag.name, tag.path, tag.fullPath].filter(Boolean));
    return get().videoItems.filter((item) => (item.tags || []).some((value) => names.has(value))).length;
  },

  addUser: async (user) => {
    const value = normalizeUser(user);
    if (get().users.some((item) => item.username.toLowerCase() === value.username.toLowerCase())) return false;
    set((state) => ({ users: [...state.users, value] }));
    await dbPut(STORES.USERS, value);
    return value;
  },
  updateUser: async (user) => {
    const updated = normalizeUser(user);
    set((state) => ({
      users: state.users.map((item) => item.id === updated.id ? updated : item),
      currentUser: state.currentUser?.id === updated.id ? updated : state.currentUser
    }));
    await dbPut(STORES.USERS, updated);
    if (useAuthStore.getState().currentUser?.id === updated.id) useAuthStore.setState({ currentUser: updated });
    return updated;
  },
  deleteUser: async (id) => {
    const target = get().users.find((item) => item.id === id);
    if (!target) return false;
    const updated = { ...target, isActive: false, updatedAt: nowIso() };
    return get().updateUser(updated);
  },

  updateSettings: async (patch = {}) => {
    const settings = mergeSettings(get().settings, patch);
    set({ settings, isPasswordSet: get().isPasswordSet || !!settings.masterPasswordHash });
    await persistSettings(settings);
    return settings;
  },
  setMasterPassword: async (password) => {
    const passwordHashValue = await bcrypt.hash(password, 10);
    const settings = mergeSettings(get().settings, { masterPasswordHash: hashPassword(password), onboardingRequired: false, initialAdminPassword: null });
    let users = get().users;
    let admin = users.find((user) => user.username === "admin");
    if (admin) {
      admin = { ...admin, passwordHash: passwordHashValue, role: "admin", isActive: true, mustChangePassword: false, updatedAt: nowIso() };
      users = users.map((user) => user.id === admin.id ? admin : user);
    } else {
      admin = normalizeUser({ username: "admin", displayName: "المدير", role: "admin", passwordHash: passwordHashValue, isActive: true });
      users = [admin, ...users];
    }
    set({ settings, users, isPasswordSet: true, isLocked: false });
    await persistSettings(settings);
    await dbPut(STORES.USERS, admin);
    return true;
  },
  skipPasswordSetup: async () => {
    const settings = mergeSettings(get().settings, { ui: { onboardingSecurityMode: "quick", v1OnboardingCompleted: true }, onboardingRequired: false });
    let users = get().users;
    if (!users.some((user) => user.username === "admin")) {
      users = [normalizeUser({ username: "admin", displayName: "المدير", role: "admin", passwordHash: "", isActive: true }), ...users];
      await dbPut(STORES.USERS, users[0]);
    }
    set({ settings, users, isPasswordSet: false, isLocked: false });
    await persistSettings(settings);
    return true;
  },
  unlockApp: (password) => {
    const masterHash = get().settings.masterPasswordHash;
    const ok = !masterHash || hashPassword(password) === masterHash;
    if (ok) set({ isLocked: false });
    return ok;
  },
  lockApp: () => set({ isLocked: true }),

  runSystemHealthCheck: async () => {
    const checks = [
      { id: "indexeddb", label: "IndexedDB", status: typeof indexedDB === "undefined" ? "error" : "ok", message: typeof indexedDB === "undefined" ? "غير متاح" : "جاهز" },
      { id: "sqlite", label: "SQLite", status: get().sqliteReady ? "ok" : "warning", message: get().sqliteReady ? "جاهز" : get().sqliteError || "يعمل التطبيق عبر IndexedDB" },
      { id: "items", label: "العناصر", status: "ok", message: `${get().videoItems.length} عنصر` }
    ];
    const settings = mergeSettings(get().settings, { systemHealth: { lastCheckAt: nowIso(), checks } });
    set({ settings });
    await persistSettings(settings);
    get().showToast("اكتمل فحص النظام", "success");
    return checks;
  },

  buildExportPayload: (options = {}) => makeExportPayload(get(), options),
  estimateExportSize: (options = {}) => new Blob([JSON.stringify(makeExportPayload(get(), options))]).size,
  exportData: (options = {}) => JSON.stringify(makeExportPayload(get(), options), null, options.pretty ? 2 : 0),
  createBackup: async (name = "نسخة احتياطية") => {
    const payload = makeExportPayload(get());
    const backup = {
      id: generateId("backup"),
      name,
      timestamp: nowIso(),
      size: new Blob([JSON.stringify(payload)]).size,
      itemCount: payload.videoItems.length,
      data: payload
    };
    await dbPut(STORES.BACKUPS, backup);
    const settings = mergeSettings(get().settings, { lastBackupAt: backup.timestamp });
    set({ settings });
    await persistSettings(settings);
    return backup;
  },
  restoreBackup: async (id) => {
    const backup = await dbGet(STORES.BACKUPS, id);
    if (!backup?.data) return false;
    await writeNormalizedDataToIndexedDb(backup.data);
    await get().loadAllData();
    return true;
  },
  deleteBackup: async (id) => {
    await dbDelete(STORES.BACKUPS, id);
    return true;
  },
  importData: async (data) => {
    await writeNormalizedDataToIndexedDb(data);
    await get().loadAllData();
    return true;
  },
  exportTransferPackage: () => makeExportPayload(get()),
  importTransferPackage: async (payload) => get().importData(payload),

  clearHistory: async () => {
    set({ changeHistory: [] });
    await dbClear(STORES.HISTORY);
  },
  getStats: () => ({
    totalItems: get().videoItems.length,
    activeItems: get().videoItems.filter((item) => !item.isDeleted).length,
    deletedItems: get().videoItems.filter((item) => item.isDeleted).length,
    favoriteItems: get().videoItems.filter((item) => item.isFavorite).length,
    contentTypes: get().contentTypes.length,
    collections: get().virtualCollections.length
  }),
  refreshData: async () => get().loadAllData(),
  getVideoItemById: (id) => get().videoItems.find((item) => item.id === id),
  getSmartSuggestions: () => [],
  bulkAddTags: async () => false,
  bulkMoveItems: async () => false,
  bulkExportItems: async () => false,
  setBackgroundOperation: (backgroundOperation) => set({ backgroundOperation }),
  cancelBackgroundOperation: () => set({ backgroundOperation: null })
}));

export const useAuthStore = createStore((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  failedAttempts: 0,
  lockedUntil: 0,
  mustChangePassword: false,

  initAuth: async () => {
    const token = localStorage.getItem("va_session_user_id");
    if (!token) return false;
    const user = useAppStore.getState().users.find((item) => item.id === token && item.isActive);
    if (!user) return false;
    set({ currentUser: user, isAuthenticated: true, authError: null, mustChangePassword: !!user.mustChangePassword });
    useAppStore.setState({ currentUser: user, isLocked: false });
    return true;
  },
  login: async (username, password, rememberMe = false) => {
    set({ isLoading: true, authError: null });
    const user = useAppStore.getState().users.find((item) => item.username.trim().toLowerCase() === String(username || "").trim().toLowerCase());
    if (!user || user.isActive === false) {
      set({ isLoading: false, authError: "تعذر تسجيل الدخول. تحقق من بيانات الدخول." });
      return false;
    }
    let ok = false;
    try {
      if (!user.passwordHash) ok = !password;
      else if (user.passwordHash.startsWith("$2")) ok = await bcrypt.compare(password, user.passwordHash);
      else ok = hashPassword(password) === user.passwordHash;
    } catch {
      ok = false;
    }
    if (!ok) {
      set({ isLoading: false, authError: "كلمة المرور غير صحيحة." });
      return false;
    }
    const updated = { ...user, lastLoginAt: nowIso(), updatedAt: nowIso() };
    await useAppStore.getState().updateUser(updated);
    if (rememberMe) localStorage.setItem("va_session_user_id", updated.id);
    set({ currentUser: updated, isAuthenticated: true, isLoading: false, authError: null, mustChangePassword: !!updated.mustChangePassword });
    useAppStore.setState({ currentUser: updated, isLocked: false });
    return true;
  },
  logout: async () => {
    localStorage.removeItem("va_session_user_id");
    set({ currentUser: null, isAuthenticated: false, authError: null, mustChangePassword: false });
    useAppStore.setState({ currentUser: null });
  },
  forceChangePassword: async (newPassword) => {
    const user = get().currentUser;
    if (!user || String(newPassword || "").length < 8) return false;
    const updated = { ...user, passwordHash: await bcrypt.hash(newPassword, 10), mustChangePassword: false, updatedAt: nowIso() };
    await useAppStore.getState().updateUser(updated);
    set({ currentUser: updated, mustChangePassword: false });
    return true;
  },
  changePassword: async (_currentPassword, newPassword) => get().forceChangePassword(newPassword),
  resetLockout: () => set({ failedAttempts: 0, lockedUntil: 0, authError: null }),
  isLockedOut: () => false,
  getLockoutRemainingSeconds: () => 0,
  hasPermission: () => true
}));

export const useSessionStore = createStore((set) => ({
  isIdleLocked: false,
  unlockFromIdle: () => set({ isIdleLocked: false }),
  createSession: async () => true,
  endSession: async () => true
}));

export function getAppStoreState() {
  return useAppStore.getState?.();
}

export function subscribeAppStore(listener) {
  return useAppStore.subscribe?.(listener);
}

export const archiveActionKeys = [
  "addVideoItem",
  "updateVideoItem",
  "deleteVideoItem",
  "restoreVideoItem",
  "toggleFavorite",
  "bulkDeleteItems",
  "bulkRestoreItems",
  "emptyTrash",
  "setSearchQuery",
  "setFilterType",
  "setFilterSubtype",
  "setViewMode",
  "setSelectedItemId",
  "toggleBulkSelect",
  "selectAllItems",
  "clearSelection"
];

export const settingsActionKeys = [
  "updateSettings",
  "setMasterPassword",
  "skipPasswordSetup",
  "runSystemHealthCheck",
  "resetKeyboardShortcuts",
  "disableAllKeyboardShortcuts"
];

export const dataTransferActionKeys = [
  "createBackup",
  "restoreBackup",
  "exportData",
  "importData",
  "exportTransferPackage",
  "importTransferPackage"
];

export const uiActionKeys = [
  "goToPage",
  "showNotification",
  "showToast",
  "toggleNotificationCenter",
  "openDataTab",
  "openHelpSection"
];

export function pickStoreActions(state, keys) {
  return keys.reduce((actions, key) => {
    if (typeof state?.[key] === "function") actions[key] = state[key];
    return actions;
  }, {});
}
