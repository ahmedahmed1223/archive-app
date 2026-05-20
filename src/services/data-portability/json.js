export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function sanitizePlainData(value, seen = new WeakSet()) {
  if (value === null || value === void 0) return value;
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitizePlainData(item, seen));
  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "function" || child === void 0) continue;
    clean[key] = sanitizePlainData(child, seen);
  }
  return clean;
}
