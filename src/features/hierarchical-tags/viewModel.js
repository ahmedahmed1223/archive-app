import { normalizeArabicSearchText } from "../../utils/formatting.js";

export const HIERARCHICAL_TAG_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#6b7280",
  "#84cc16",
  "#06b6d4"
];

export function createHierarchicalTagValue(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: partial.id || `htag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(partial.name || "").trim(),
    parentId: partial.parentId ?? null,
    color: partial.color || "#10b981",
    order: Number.isFinite(Number(partial.order)) ? Number(partial.order) : 0,
    createdAt: partial.createdAt || now,
    updatedAt: now
  };
}

export function buildHierarchicalTagModel(tags = []) {
  const sorted = [...tags].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name || "").localeCompare(String(b.name || ""), "ar"));
  const byId = new Map(sorted.map((tag) => [tag.id, tag]));
  const childrenByParent = new Map();
  sorted.forEach((tag) => {
    const parentId = tag.parentId || null;
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(tag);
  });
  return {
    byId,
    childrenByParent,
    roots: childrenByParent.get(null) || []
  };
}

export function getHierarchicalTagPath(tagId, tags = []) {
  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  const path = [];
  let current = byId.get(tagId);
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current.name || current.id);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return path.join(" / ");
}

export function getDescendantTagIds(parentId, childrenByParent = new Map()) {
  const ids = [];
  const visit = (id) => {
    (childrenByParent.get(id) || []).forEach((child) => {
      ids.push(child.id);
      visit(child.id);
    });
  };
  visit(parentId);
  return ids;
}

export function getNextHierarchicalTagOrder(tags = [], parentId = null) {
  const siblings = tags.filter((tag) => (tag.parentId || null) === (parentId || null));
  return siblings.length ? Math.max(...siblings.map((tag) => Number(tag.order) || 0)) + 1 : 0;
}

export function getFilteredHierarchicalTags(tags = [], query = "") {
  const normalizedQuery = normalizeArabicSearchText(query);
  if (!normalizedQuery) return tags;
  return tags.filter((tag) => normalizeArabicSearchText([
    tag.name,
    getHierarchicalTagPath(tag.id, tags)
  ].join(" ")).includes(normalizedQuery));
}
