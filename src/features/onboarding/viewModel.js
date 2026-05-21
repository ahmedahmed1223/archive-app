import {
  ONBOARDING_ACCENT_OPTIONS,
  ONBOARDING_STEPS,
  ONBOARDING_THEME_OPTIONS
} from "./flow.js";

export function getOnboardingStepIndex(stepId = "welcome") {
  const index = ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

export function getOnboardingStep(stepId = "welcome") {
  return ONBOARDING_STEPS[getOnboardingStepIndex(stepId)];
}

export function getNextOnboardingStep(stepId = "welcome") {
  return ONBOARDING_STEPS[Math.min(getOnboardingStepIndex(stepId) + 1, ONBOARDING_STEPS.length - 1)];
}

export function getPreviousOnboardingStep(stepId = "welcome") {
  return ONBOARDING_STEPS[Math.max(getOnboardingStepIndex(stepId) - 1, 0)];
}

export function normalizeOnboardingSecurityMode(mode = "secure") {
  return mode === "quick" ? "quick" : "secure";
}

export function normalizeOnboardingThemeChoice(theme = "dark") {
  return ONBOARDING_THEME_OPTIONS.some((option) => option.id === theme) ? theme : "dark";
}

export function normalizeOnboardingAccentChoice(accent = "teal") {
  return ONBOARDING_ACCENT_OPTIONS.some((option) => option.id === accent) ? accent : "teal";
}

export function createOnboardingUiPatch({
  stepId = "welcome",
  securityMode = "secure",
  themeChoice = "dark",
  firstTaskChoice = "dashboard",
  completed = false,
  skipped = false,
  now = new Date().toISOString()
} = {}) {
  return {
    lastOnboardingStep: getOnboardingStep(stepId).id,
    onboardingSecurityMode: normalizeOnboardingSecurityMode(securityMode),
    onboardingThemeChoice: normalizeOnboardingThemeChoice(themeChoice),
    firstTaskChoice: firstTaskChoice || "dashboard",
    v1OnboardingCompleted: Boolean(completed),
    onboardingSkippedAt: skipped ? now : null,
    onboardingCoreUiSeenAt: completed ? now : null
  };
}

export function getFirstTaskDestination(firstTaskChoice = "dashboard") {
  const destinations = {
    "import-backup": "backup",
    "add-video": "add",
    "create-type": "types",
    dashboard: "dashboard"
  };
  return destinations[firstTaskChoice] || "dashboard";
}

export function shouldShowV1Tour({ settings = {}, currentPage = "dashboard", hasDirectRoute = false } = {}) {
  if (hasDirectRoute || currentPage !== "dashboard") return false;
  return Boolean(settings.ui?.v1OnboardingCompleted && !settings.ui?.v1TourCompleted);
}
