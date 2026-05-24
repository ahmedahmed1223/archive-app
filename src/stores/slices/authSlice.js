import bcrypt from "bcryptjs";
import { hashPassword } from "../../utils/passwordHash.js";
import { nowIso } from "../storeCore.js";

function getLocalStorage() {
  if (globalThis.localStorage) return globalThis.localStorage;
  const memory = new Map();
  return {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key)
  };
}

export function createAuthStore({ createStore, useAppStore }) {
  return createStore((set, get) => ({
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    failedAttempts: 0,
    lockedUntil: 0,
    mustChangePassword: false,
    initAuth: async () => {
      const token = getLocalStorage().getItem("va_session_user_id");
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
      if (rememberMe) getLocalStorage().setItem("va_session_user_id", updated.id);
      set({ currentUser: updated, isAuthenticated: true, isLoading: false, authError: null, mustChangePassword: !!updated.mustChangePassword });
      useAppStore.setState({ currentUser: updated, isLocked: false });
      return true;
    },
    logout: async () => {
      getLocalStorage().removeItem("va_session_user_id");
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
}

export function createSessionStore({ createStore }) {
  return createStore((set) => ({
    isIdleLocked: false,
    unlockFromIdle: () => set({ isIdleLocked: false }),
    createSession: async () => true,
    endSession: async () => true
  }));
}
