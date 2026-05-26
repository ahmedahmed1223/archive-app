import { createVideoItemValue } from "../../features/videos/viewModel.js";
import {
  createContentTypeValue,
  getMissingDefaultArchiveContentTypes
} from "../../features/types/viewModel.js";
import { createVirtualCollectionValue } from "../../features/collections/viewModel.js";
import {
  STORES,
  dbClear,
  dbDelete,
  dbGet,
  dbGetAll,
  dbPut
} from "../../services/storage/index.js";
import { generateId, nowIso } from "../storeCore.js";
import { defaultSettings, mergeSettings } from "../settingsDefaults.js";
import { normalizeChangeRecord, normalizeUser } from "../storeModels.js";
import { persistList, persistSettings } from "../storePersistence.js";
import { undoRedoManager } from "../../components/common/undoManager.js";

export const archiveInitialState = {
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
  searchQuery: "",
  filterType: "all",
  filterSubtype: "all",
  viewMode: "grid",
  selectedItems: []
};

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

export function createArchiveActions({ set, get, getAuthStore }) {
  return {
    loadAllData: async () => {
      set({ isLoading: true });
      try {
        const settingsDoc = await dbGet(STORES.SETTINGS, "app_settings").catch(() => null);
        const settings = mergeSettings(defaultSettings(), settingsDoc || {});
        const users = (await dbGetAll(STORES.USERS).catch(() => [])).map(normalizeUser);
        const storedContentTypes = await dbGetAll(STORES.TYPES).catch(() => []);
        const missingDefaultTypes = getMissingDefaultArchiveContentTypes(storedContentTypes);
        for (const type of missingDefaultTypes) {
          await dbPut(STORES.TYPES, type).catch(() => {});
        }

        set({
          contentTypes: [...storedContentTypes, ...missingDefaultTypes],
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
        set({ isLoading: false, sqliteError: error?.message || "تعذر تحميل البيانات من IndexedDB" });
        get().showToast(error?.message || "تعذر تحميل البيانات", "error");
      }
    },
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilterType: (filterType) => set({ filterType }),
    setFilterSubtype: (filterSubtype) => set({ filterSubtype }),
    setViewMode: (viewMode) => set({ viewMode }),
    toggleBulkSelect: (id) => set((state) => ({
      selectedItems: state.selectedItems.includes(id) ? state.selectedItems.filter((item) => item !== id) : [...state.selectedItems, id]
    })),
    selectAllItems: () => set((state) => ({ selectedItems: state.videoItems.filter((item) => !item.isDeleted).map((item) => item.id) })),
    clearSelection: () => set({ selectedItems: [] }),
    addAuditLog: async (eventType, targetId, targetType, details) => {
      const authState = getAuthStore().getState();
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
    deleteVideoItem: async (id, options = {}) => {
      const target = get().videoItems.find((item) => item.id === id);
      if (!target) return false;
      const updated = { ...target, isDeleted: true, updatedAt: nowIso() };
      set((state) => ({ videoItems: state.videoItems.map((item) => item.id === id ? updated : item) }));
      await dbPut(STORES.ITEMS, updated);
      if (!options.skipUndo) {
        undoRedoManager.push({
          label: `حذف ${target.title || "فيديو"}`,
          undo: () => get().restoreVideoItem(id, { skipUndo: true }),
          redo: () => get().deleteVideoItem(id, { skipUndo: true })
        });
        get().showNotification?.(`تم حذف ${target.title || "الفيديو"}`, {
          type: "info",
          title: "تم الحذف",
          action: { label: "تراجع", run: () => undoRedoManager.undo() }
        });
      }
      return true;
    },
    restoreVideoItem: async (id, options = {}) => {
      const target = get().videoItems.find((item) => item.id === id);
      if (!target) return false;
      const updated = { ...target, isDeleted: false, updatedAt: nowIso() };
      set((state) => ({ videoItems: state.videoItems.map((item) => item.id === id ? updated : item) }));
      await dbPut(STORES.ITEMS, updated);
      if (!options.skipUndo) {
        undoRedoManager.push({
          label: `استعادة ${target.title || "فيديو"}`,
          undo: () => get().deleteVideoItem(id, { skipUndo: true }),
          redo: () => get().restoreVideoItem(id, { skipUndo: true })
        });
      }
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
    deleteContentType: async (id, options = {}) => {
      const previous = get().contentTypes.find((item) => item.id === id);
      const updated = get().contentTypes.map((item) => item.id === id ? { ...item, status: "archived", archivedAt: nowIso(), updatedAt: nowIso() } : item);
      set({ contentTypes: updated });
      const target = updated.find((item) => item.id === id);
      if (target) await dbPut(STORES.TYPES, target);
      if (!options.skipUndo && previous && previous.status !== "archived") {
        const restored = { ...previous, status: previous.status || "active", archivedAt: null, updatedAt: nowIso() };
        const label = `أرشفة نوع ${previous.name || ""}`.trim();
        undoRedoManager.push({
          label,
          undo: async () => {
            set((state) => ({ contentTypes: state.contentTypes.map((item) => item.id === id ? restored : item) }));
            await dbPut(STORES.TYPES, restored);
          },
          redo: () => get().deleteContentType(id, { skipUndo: true })
        });
        get().showNotification?.(label, {
          type: "info",
          title: "تمت الأرشفة",
          action: { label: "تراجع", run: () => undoRedoManager.undo() }
        });
      }
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
    deleteVirtualCollection: async (id, options = {}) => {
      const target = get().virtualCollections.find((item) => item.id === id);
      if (!target) return false;
      set((state) => ({ virtualCollections: state.virtualCollections.filter((item) => item.id !== id) }));
      await dbDelete(STORES.COLLECTIONS, id);
      if (!options.skipUndo) {
        undoRedoManager.push({
          label: `حذف مجموعة ${target.name || ""}`.trim(),
          undo: async () => {
            await get().addVirtualCollection(target);
          },
          redo: () => get().deleteVirtualCollection(id, { skipUndo: true })
        });
        get().showNotification?.(`تم حذف المجموعة "${target.name || ""}"`.trim(), {
          type: "info",
          title: "تم الحذف",
          action: { label: "تراجع", run: () => undoRedoManager.undo() }
        });
      }
      return true;
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
    deleteVocabularyEntry: async (id, options = {}) => {
      const target = get().vocabulary.find((item) => item.id === id);
      if (!target) return false;
      set((state) => ({ vocabulary: state.vocabulary.filter((item) => item.id !== id) }));
      await dbDelete(STORES.VOCABULARY, id);
      if (!options.skipUndo) {
        undoRedoManager.push({
          label: `حذف مصطلح ${target.term || ""}`.trim(),
          undo: async () => {
            await get().addVocabularyEntry(target);
          },
          redo: () => get().deleteVocabularyEntry(id, { skipUndo: true })
        });
        get().showNotification?.(`تم حذف المصطلح "${target.term || ""}"`.trim(), {
          type: "info",
          title: "تم الحذف",
          action: { label: "تراجع", run: () => undoRedoManager.undo() }
        });
      }
      return true;
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
    deleteHierarchicalTag: async (id, options = {}) => {
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
      const removed = get().hierarchicalTags.filter((item) => childIds.has(item.id));
      const rootTag = removed.find((item) => item.id === id);
      set((state) => ({ hierarchicalTags: state.hierarchicalTags.filter((item) => !childIds.has(item.id)) }));
      for (const tagId of childIds) await dbDelete(STORES.HTAGS, tagId);
      if (!options.skipUndo && removed.length > 0) {
        const label = removed.length > 1
          ? `حذف ${rootTag?.name || "وسم"} وفروعه (${removed.length})`
          : `حذف وسم ${rootTag?.name || ""}`.trim();
        undoRedoManager.push({
          label,
          undo: async () => {
            for (const tag of removed) {
              await get().addHierarchicalTag(tag);
            }
          },
          redo: () => get().deleteHierarchicalTag(id, { skipUndo: true })
        });
        get().showNotification?.(label, {
          type: "info",
          title: "تم الحذف",
          action: { label: "تراجع", run: () => undoRedoManager.undo() }
        });
      }
      return true;
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
      if (getAuthStore().getState().currentUser?.id === updated.id) getAuthStore().setState({ currentUser: updated });
      return updated;
    },
    deleteUser: async (id, options = {}) => {
      const target = get().users.find((item) => item.id === id);
      if (!target) return false;
      const wasActive = target.isActive !== false;
      const updated = { ...target, isActive: false, updatedAt: nowIso() };
      const result = await get().updateUser(updated);
      if (!options.skipUndo && wasActive) {
        const label = `تعطيل ${target.displayName || target.username || "المستخدم"}`;
        undoRedoManager.push({
          label,
          undo: async () => {
            await get().updateUser({ ...target, isActive: true });
          },
          redo: () => get().deleteUser(id, { skipUndo: true })
        });
        get().showNotification?.(label, {
          type: "info",
          title: "تم التعطيل",
          action: { label: "تراجع", run: () => undoRedoManager.undo() }
        });
      }
      return result;
    },
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
    bulkExportItems: async () => false
  };
}
