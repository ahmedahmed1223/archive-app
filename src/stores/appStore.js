import {
  useAppStore,
  useAuthStore,
  useSessionStore
} from "../runtime/legacyAdapter.js";

export { useAppStore, useAuthStore, useSessionStore };

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
