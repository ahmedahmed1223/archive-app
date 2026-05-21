export const ACCENT_COLOR_TOKENS = {
  teal: { accent: "#14b8a6", strong: "#0f766e", soft: "#0f3f3b" },
  indigo: { accent: "#6366f1", strong: "#4f46e5", soft: "#27275f" },
  emerald: { accent: "#10b981", strong: "#047857", soft: "#063b32" },
  blue: { accent: "#3b82f6", strong: "#2563eb", soft: "#172554" },
  purple: { accent: "#8b5cf6", strong: "#7c3aed", soft: "#2e1065" },
  amber: { accent: "#f59e0b", strong: "#b45309", soft: "#451a03" },
  rose: { accent: "#f43f5e", strong: "#be123c", soft: "#4c0519" }
};

export function getAccentColorTokens(accentColor = "teal") {
  return ACCENT_COLOR_TOKENS[accentColor] || ACCENT_COLOR_TOKENS.teal;
}

export function applyAccentColor(accentColor = "teal", root = typeof document !== "undefined" ? document.documentElement : null) {
  if (!root) return getAccentColorTokens(accentColor);

  const tokens = getAccentColorTokens(accentColor);
  root.style.setProperty("--app-accent", tokens.accent);
  root.style.setProperty("--color-accent", tokens.accent);
  root.style.setProperty("--va-v1-accent", tokens.accent);
  root.style.setProperty("--va-v1-accent-strong", tokens.strong);
  root.style.setProperty("--va-v1-accent-soft", tokens.soft);
  return tokens;
}
