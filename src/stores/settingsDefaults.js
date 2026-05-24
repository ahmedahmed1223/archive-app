export function defaultSettings() {
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

export function mergeSettings(current = {}, patch = {}) {
  return {
    ...current,
    ...patch,
    ui: { ...(current.ui || {}), ...(patch.ui || {}) },
    notifications: { ...(current.notifications || {}), ...(patch.notifications || {}) },
    systemHealth: { ...(current.systemHealth || {}), ...(patch.systemHealth || {}) }
  };
}
