const HTML5_VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".mov",
  ".m4v"
]);

function getExtension(value = "") {
  const clean = String(value).split("?")[0].split("#")[0].trim().toLowerCase();
  const dotIndex = clean.lastIndexOf(".");
  return dotIndex >= 0 ? clean.slice(dotIndex) : "";
}

function encodeFilePath(path) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function isHtml5PreviewableVideo(path = "") {
  return HTML5_VIDEO_EXTENSIONS.has(getExtension(path));
}

export function getHtml5VideoPreviewSource(path = "") {
  const value = String(path || "").trim();
  if (!value || !isHtml5PreviewableVideo(value)) return null;
  if (/^(https?:|blob:|data:|file:)/i.test(value)) return value;
  const normalized = value.replace(/\\/g, "/");
  if (/^[a-z]:\//i.test(normalized)) {
    return `file:///${encodeFilePath(normalized)}`;
  }
  if (normalized.startsWith("/")) {
    return `file://${encodeFilePath(normalized)}`;
  }
  return null;
}
