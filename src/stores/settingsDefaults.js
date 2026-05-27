export function defaultSettings() {
  return {
    theme: "system",
    accentColor: "blue",
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
      firstTaskChoiceUsed: false,
      // Device identity for multi-device sync. The real source of
      // truth lives in localStorage (so device-name edits survive a
      // settings reset), but we mirror them here so transfer packages
      // can embed them without an extra IndexedDB roundtrip.
      deviceId: null,
      deviceName: null
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

export function mergeSettings(current = {}, patch = {}) {
  return {
    ...current,
    ...patch,
    ui: { ...(current.ui || {}), ...(patch.ui || {}) },
    notifications: { ...(current.notifications || {}), ...(patch.notifications || {}) },
    systemHealth: { ...(current.systemHealth || {}), ...(patch.systemHealth || {}) }
  };
}
