export function parseDurationSeconds(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value || typeof value !== "string") return 0;

  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(value) || 0;
}

export function createDashboardStats({
  videoItems = [],
  contentTypes = [],
  virtualCollections = [],
  hierarchicalTags = [],
  now = Date.now()
} = {}) {
  const activeItems = videoItems.filter((item) => !item.isDeleted);
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const totalSeconds = activeItems.reduce(
    (sum, video) => sum + parseDurationSeconds(video.metadata?.duration || video.metadata?.detectedDuration || video.duration),
    0
  );

  return {
    total: activeItems.length,
    totalHours: totalSeconds ? `${Math.round(totalSeconds / 3600)} س` : "—",
    addedThisWeek: activeItems.filter((item) => new Date(item.createdAt).getTime() >= sevenDaysAgo).length,
    recentActivity: activeItems.filter((item) => new Date(item.updatedAt).getTime() >= sevenDaysAgo).length,
    favorites: activeItems.filter((item) => item.isFavorite).length,
    deleted: videoItems.filter((item) => item.isDeleted).length,
    types: contentTypes.length,
    collections: virtualCollections.length,
    tags: hierarchicalTags.length
  };
}

export function getDashboardDemoItemIds(videoItems = []) {
  return videoItems.filter((item) => item.id?.startsWith("demo-")).map((item) => item.id);
}

export function hasDashboardLayoutDraftChanges({
  draftLayout = [],
  currentLayout = [],
  draftHiddenWidgets = [],
  currentHiddenWidgets = [],
  draftActivePresetId = "",
  activePresetId = ""
} = {}) {
  return JSON.stringify(draftLayout) !== JSON.stringify(currentLayout)
    || JSON.stringify(draftHiddenWidgets) !== JSON.stringify(currentHiddenWidgets)
    || (draftActivePresetId || "") !== (activePresetId || "");
}
