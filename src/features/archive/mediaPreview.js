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

function encodeFilePathSegments(path) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function encodeWindowsFilePath(path) {
  const drive = path.slice(0, 2);
  const rest = path.slice(3);
  return rest ? `${drive}/${encodeFilePathSegments(rest)}` : `${drive}/`;
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
    return `file:///${encodeWindowsFilePath(normalized)}`;
  }
  if (normalized.startsWith("/")) {
    return `file://${encodeFilePathSegments(normalized)}`;
  }
  return null;
}
