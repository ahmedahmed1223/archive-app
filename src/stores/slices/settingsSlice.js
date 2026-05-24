import bcrypt from "bcryptjs";
import { SHORTCUT_ACTIONS, SHORTCUT_DISABLED } from "../../features/settings/keyboardShortcuts.js";
import { STORES, dbPut } from "../../services/storage/index.js";
import { hashPassword } from "../../utils/passwordHash.js";
import { nowIso } from "../storeCore.js";
import { defaultSettings, mergeSettings } from "../settingsDefaults.js";
import { normalizeUser } from "../storeModels.js";
import { persistSettings } from "../storePersistence.js";

export const INDEXEDDB_SOURCE_OF_TRUTH_MESSAGE = "SQLite غير مفعّل في هذه النسخة، التخزين المحلي يعمل عبر IndexedDB.";

export const settingsInitialState = {
  isPasswordSet: false,
  sqliteReady: false,
  sqliteError: null,
  settings: defaultSettings()
};

export const settingsActionKeys = [
  "updateSettings",
  "setMasterPassword",
  "skipPasswordSetup",
  "runSystemHealthCheck",
  "resetKeyboardShortcuts",
  "disableAllKeyboardShortcuts"
];

export function createSettingsActions({ set, get }) {
  return {
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
      const indexedDbReady = typeof indexedDB !== "undefined";
      const checks = [
        { id: "indexeddb", label: "IndexedDB", status: indexedDbReady ? "ok" : "error", message: indexedDbReady ? "جاهز ومصدر التخزين الأساسي" : "غير متاح" },
        { id: "sqlite", label: "SQLite", status: "warning", message: INDEXEDDB_SOURCE_OF_TRUTH_MESSAGE },
        { id: "items", label: "العناصر", status: "ok", message: `${get().videoItems.length} عنصر` }
      ];
      const settings = mergeSettings(get().settings, { systemHealth: { lastCheckAt: nowIso(), checks } });
      set({ settings, sqliteReady: false, sqliteError: null });
      await persistSettings(settings);
      get().showToast("اكتمل فحص النظام", "success");
      return checks;
    },
    resetKeyboardShortcuts: async () => get().updateSettings({ keyboardShortcuts: {} }),
    disableAllKeyboardShortcuts: async () => get().updateSettings({
      keyboardShortcuts: Object.fromEntries(SHORTCUT_ACTIONS.map((action) => [action.id, SHORTCUT_DISABLED]))
    })
  };
}
