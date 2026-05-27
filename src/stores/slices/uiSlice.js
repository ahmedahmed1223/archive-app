import { generateId, nowIso } from "../storeCore.js";

export const uiInitialState = {
  currentPage: "dashboard",
  selectedItemId: null,
  selectedTypeId: null,
  sidebarOpen: false,
  isLoading: true,
  isLocked: false,
  toast: null,
  notifications: [],
  notificationHistory: [],
  notificationCenterOpen: false,
  backgroundOperation: null,
  recentSearches: []
};

export const uiActionKeys = [
  "goToPage",
  "showNotification",
  "showToast",
  "toggleNotificationCenter",
  "openDataTab",
  "openHelpSection",
  "addRecentSearch",
  "clearRecentSearches"
];

function scheduleNotificationDismiss(callback, timeout) {
  const timer = globalThis.window?.setTimeout || globalThis.setTimeout;
  if (typeof timer === "function") timer(callback, timeout);
}

export function createUiActions({ set, get }) {
  return {
    showNotification: (message, options = {}) => {
      const type = options.type || "info";
      const notification = {
        id: options.id || generateId("notification"),
        title: options.title || (type === "error" ? "خطأ" : type === "warning" ? "تنبيه" : type === "success" ? "تم بنجاح" : "معلومة"),
        message: String(message || ""),
        type,
        createdAt: nowIso(),
        persistent: !!options.persistent,
        action: options.action && typeof options.action.run === "function"
          ? { label: String(options.action.label || "إجراء"), run: options.action.run, dismissOnRun: options.action.dismissOnRun !== false }
          : null
      };
      set((state) => ({
        toast: { message: notification.message, type },
        notifications: [notification, ...(state.notifications || [])].slice(0, 6),
        notificationHistory: [notification, ...(state.notificationHistory || [])].slice(0, 60)
      }));
      if (!notification.persistent) {
        scheduleNotificationDismiss(
          () => get().dismissNotification(notification.id),
          options.durationMs || get().settings.notifications?.durationMs || 5500
        );
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
    setCurrentPage: (page) => set({ currentPage: page }),
    goToPage: (page) => set({ currentPage: page, selectedItemId: null }),
    setSelectedItemId: (id) => set({ selectedItemId: id }),
    openDataTab: async (tab = "export") => {
      await get().updateSettings?.({ ui: { lastDataCenterTab: tab } });
      set({ currentPage: "backup", selectedItemId: null });
    },
    openHelpSection: async (section = "getting-started") => {
      await get().updateSettings?.({ ui: { lastHelpSection: section } });
      set({ currentPage: "help", selectedItemId: null });
    },
    setBackgroundOperation: (backgroundOperation) => set({ backgroundOperation }),
    cancelBackgroundOperation: () => set({ backgroundOperation: null }),
    addRecentSearch: (query) => {
      if (!query || !query.trim()) return;
      const normalized = query.trim();
      set((state) => {
        const filtered = (state.recentSearches || []).filter((item) => item !== normalized);
        return { recentSearches: [normalized, ...filtered].slice(0, 12) };
      });
    },
    clearRecentSearches: () => set({ recentSearches: [] })
  };
}
