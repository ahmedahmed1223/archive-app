import assert from "node:assert/strict";

import {
  getHtml5VideoPreviewSource,
  isHtml5PreviewableVideo
} from "../src/features/archive/mediaPreview.js";
import {
  filterCommandPaletteCommands
} from "../src/components/common/commandPaletteViewModel.js";
import {
  createShortcutDialogItems,
  filterShortcutDialogItems,
  getShortcutDialogCategories,
  getShortcutDialogItemsForCategory
} from "../src/components/common/shortcutDialogViewModel.js";
import {
  createArchiveRouteParams,
  getArchiveActiveFilterCount,
  getArchiveResultRangeText,
  getFilteredArchiveItems,
  hasArchiveContentFilters,
  normalizeArchiveItemSize,
  normalizeArchivePage,
  normalizeArchivePageSize,
  parseArchiveRouteParams
} from "../src/features/archive/viewModel.js";
import {
  findShortcutConflict,
  getDefaultKeyboardShortcuts,
  getEffectiveKeyboardShortcuts,
  isTextEntryTarget,
  shortcutMatches
} from "../src/features/settings/keyboardShortcuts.js";
import {
  createSearchRouteParams,
  getSearchActiveFilterCount,
  getSearchResults,
  parseSearchRouteParams
} from "../src/features/search/viewModel.js";
import {
  createHistoryRouteParams,
  getFilteredHistoryRecords,
  getHistoryActionCounts,
  parseHistoryRouteParams
} from "../src/features/history/viewModel.js";
import {
  createVocabularyEntryValue,
  createVocabularyRouteParams,
  getFilteredVocabularyEntries,
  getVocabularyCategoryCounts,
  parseVocabularyAliases,
  parseVocabularyRouteParams
} from "../src/features/vocabulary/viewModel.js";
import {
  buildHierarchicalTagModel,
  createHierarchicalTagValue,
  getDescendantTagIds,
  getFilteredHierarchicalTags,
  getHierarchicalTagPath,
  getNextHierarchicalTagOrder
} from "../src/features/hierarchical-tags/viewModel.js";
import {
  createVirtualCollectionValue,
  getAvailableCollectionItems,
  getCollectionSummary,
  getFilteredCollections,
  resolveCollectionItems
} from "../src/features/collections/viewModel.js";
import {
  canDeactivateUser,
  createUserValue,
  getFilteredUsers,
  getUserSummary,
  normalizeUserRole
} from "../src/features/users/viewModel.js";
import {
  createContentTypeValue,
  createCustomFieldValue,
  createSubtypeValue,
  getFieldsForSelection,
  getFilteredContentTypes,
  getTypeUsageCounts,
  normalizeFieldStorageKey,
  parseFieldOptions
} from "../src/features/types/viewModel.js";
import {
  createLocalFileValue,
  createVideoItemValue,
  getSubtypeLabel,
  getTypeLabel,
  normalizeLocalFileValue,
  parseVideoTags
} from "../src/features/videos/viewModel.js";
import {
  HELP_FAQ_ITEMS,
  HELP_QUICK_SECTION_LINKS
} from "../src/features/help/content.js";
import {
  createHelpShortcutList,
  filterHelpFaqItems,
  filterHelpSections,
  normalizeHelpSectionId
} from "../src/features/help/viewModel.js";
import {
  createSettingsTabUiPatch,
  getSettingsTabState,
  hasMeaningfulSettingsDraftChanges,
  normalizeSettingsTab
} from "../src/features/settings/viewModel.js";
import {
  createOnboardingUiPatch,
  createOnboardingCompletionPatch,
  getOnboardingDestination,
  getFirstTaskDestination,
  getNextOnboardingStep,
  getOnboardingStepIndex,
  shouldShowStartupOnboarding,
  shouldShowV1Tour
} from "../src/features/onboarding/viewModel.js";
import {
  getPageContextBarModel,
  getPrimaryPageAction,
  getSidebarNavigationGroups
} from "../src/components/navigation/viewModel.js";
import {
  getPageMigrationStatus,
  getPageMigrationSummary
} from "../src/pages/migrationStatus.js";
import {
  createDataCenterExportFilters,
  createDataCenterExportSummary,
  formatTimeUntilBackup,
  getNextBackupTime
} from "../src/features/data-center/viewModel.js";
import {
  createDashboardStats,
  getDashboardDemoItemIds,
  hasDashboardLayoutDraftChanges,
  parseDurationSeconds
} from "../src/features/dashboard/viewModel.js";
import {
  createImportPreviewSummary,
  formatImportPreviewSummary
} from "../src/services/data-portability/importPreview.js";
import {
  getGlobalShortcutAction
} from "../src/stores/globalShortcuts.js";
import {
  isArchiveExcelImportFile,
  readArchiveImportFile
} from "../src/services/data-portability/importReader.js";
import { createArchiveCsvExportFiles } from "../src/services/data-portability/csvExport.js";
import {
  createArchiveExcelPackagePayload,
  createTransferPackage,
  readTransferPackage
} from "../src/services/data-portability/packageOperations.js";
import { createArchiveExcelWorkbook } from "../src/services/data-portability/excelWorkbook.js";
import {
  safeJsonParse,
  sanitizePlainData
} from "../src/services/data-portability/json.js";
import {
  createOperationSizeCheck,
  createSqliteReadinessCheck,
  createStorageEstimateCheck,
  formatPreflightSummary
} from "../src/services/health/preflight.js";
import {
  buildAppRoute,
  normalizeRoutePage,
  parseAppRoute
} from "../src/services/router/index.js";
import {
  applyAccentColor,
  getAccentColorTokens
} from "../src/theme/accentColor.js";

function run(name, test) {
  test();
  console.log(`ok - ${name}`);
}

async function runAsync(name, test) {
  await test();
  console.log(`ok - ${name}`);
}

run("archive media preview URLs", () => {
  assert.equal(isHtml5PreviewableVideo("clip.MP4?download=1"), true);
  assert.equal(isHtml5PreviewableVideo("clip.txt"), false);
  assert.equal(
    getHtml5VideoPreviewSource("C:\\Videos\\New Folder\\clip 1.mp4"),
    "file:///C:/Videos/New%20Folder/clip%201.mp4"
  );
  assert.equal(
    getHtml5VideoPreviewSource("/mnt/archive/clip 1.webm"),
    "file:///mnt/archive/clip%201.webm"
  );
  assert.equal(getHtml5VideoPreviewSource("relative/clip.mp4"), null);
});

run("archive view model", () => {
  const items = getFilteredArchiveItems({
    videoItems: [
      { id: "1", title: "حلقة خاصة", type: "show", subtype: "episode", tags: ["أخبار"], notes: "", updatedAt: "2026-01-02" },
      { id: "2", title: "مقطع محذوف", type: "show", tags: [], isDeleted: true, updatedAt: "2026-01-03" },
      { id: "3", title: "فيلم", type: "movie", tags: ["وثائقي"], isFavorite: true, updatedAt: "2026-01-01" }
    ],
    filterType: "show",
    searchQuery: "حلقه"
  });
  assert.deepEqual(items.map((item) => item.id), ["1"]);
  assert.equal(getArchiveActiveFilterCount({ searchQuery: "x", filterType: "show", showDeleted: true }), 3);
  assert.equal(hasArchiveContentFilters({ showDeleted: true }), false);
  assert.equal(getArchiveResultRangeText({ total: 55, page: 3, itemsPerPage: 20 }), "عرض 41-55 من 55");

  const params = createArchiveRouteParams({ searchQuery: "test", filterType: "movie", showFavoritesOnly: true, sortDirection: "asc", viewMode: "table", openImport: true, page: 3, pageSize: 48, itemSize: "compact" });
  const parsed = parseArchiveRouteParams(params);
  assert.equal(parsed.searchQuery, "test");
  assert.equal(parsed.filterType, "movie");
  assert.equal(parsed.showFavoritesOnly, true);
  assert.equal(parsed.sortDirection, "asc");
  assert.equal(parsed.viewMode, "table");
  assert.equal(parsed.openImport, true);
  assert.equal(parsed.page, 3);
  assert.equal(parsed.pageSize, 48);
  assert.equal(parsed.itemSize, "compact");
  assert.equal(parseArchiveRouteParams(new URLSearchParams("view=missing")).viewMode, "grid");
  assert.equal(normalizeArchiveItemSize("huge"), "comfortable");
  assert.equal(normalizeArchivePageSize(999), 24);
  assert.equal(normalizeArchivePage("-1"), 1);
});

run("keyboard shortcut helpers", () => {
  const defaults = getDefaultKeyboardShortcuts();
  assert.equal(defaults.openSearch, "Ctrl+K");

  const shortcuts = getEffectiveKeyboardShortcuts({
    keyboardShortcuts: {
      openSearch: "Alt+K",
      openBackup: "Alt+K"
    }
  });
  assert.equal(findShortcutConflict(shortcuts, "openSearch", "Alt+K")?.id, "openBackup");
  assert.equal(shortcutMatches({ ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, key: "k" }, "Ctrl+K"), true);
  assert.equal(shortcutMatches({ ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, key: "k" }, "Ctrl+K"), false);
  assert.equal(isTextEntryTarget({ tagName: "INPUT" }), true);
});

run("search view model", () => {
  const params = createSearchRouteParams({
    query: "لقطة",
    type: "clip",
    subtype: "social",
    favoritesOnly: true,
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
    page: 2,
    pageSize: 48
  });
  const parsed = parseSearchRouteParams(params);
  assert.deepEqual(parsed, {
    query: "لقطة",
    type: "clip",
    subtype: "social",
    favoritesOnly: true,
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
    page: 2,
    pageSize: 48
  });
  assert.equal(getSearchActiveFilterCount(parsed), 6);

  const results = getSearchResults({
    videoItems: [
      { id: "1", title: "لقطة مؤتمر", type: "clip", subtype: "social", isFavorite: true, createdAt: "2026-01-15", updatedAt: "2026-01-16" },
      { id: "2", title: "لقطة قديمة", type: "clip", subtype: "social", isFavorite: true, createdAt: "2025-12-20", updatedAt: "2026-01-16" },
      { id: "3", title: "مؤتمر", type: "clip", subtype: "social", isFavorite: false, createdAt: "2026-01-15" }
    ],
    query: "لقطة",
    type: "clip",
    subtype: "social",
    favoritesOnly: true,
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31"
  });
  assert.deepEqual(results.map((item) => item.id), ["1"]);
});

run("history view model", () => {
  const params = createHistoryRouteParams({ query: "عنوان", action: "update", page: 2, pageSize: 100 });
  assert.deepEqual(parseHistoryRouteParams(params), {
    query: "عنوان",
    action: "update",
    page: 2,
    pageSize: 100
  });

  const records = getFilteredHistoryRecords({
    changeHistory: [
      { id: "1", itemId: "v1", action: "create", timestamp: "2026-01-01T00:00:00.000Z" },
      { id: "2", itemId: "v2", action: "update", field: "title", newValue: "عنوان جديد", timestamp: "2026-01-03T00:00:00.000Z" },
      { id: "3", itemId: "v3", action: "delete", timestamp: "2026-01-02T00:00:00.000Z" }
    ],
    query: "عنوان",
    action: "update",
    itemTitleById: new Map([["v2", "مادة قديمة"]])
  });
  assert.deepEqual(records.map((record) => record.id), ["2"]);
  assert.equal(getHistoryActionCounts(records).update, 1);
});

run("vocabulary view model", () => {
  const aliases = parseVocabularyAliases("القدس, بيت المقدس، أورشليم");
  assert.deepEqual(aliases, ["القدس", "بيت المقدس", "أورشليم"]);
  const entry = createVocabularyEntryValue({ term: "القدس", category: "city", aliases });
  assert.equal(entry.category, "city");

  const params = createVocabularyRouteParams({ query: "قدس", category: "city", page: 3, pageSize: 96 });
  assert.deepEqual(parseVocabularyRouteParams(params), {
    query: "قدس",
    category: "city",
    page: 3,
    pageSize: 96
  });

  const vocabulary = [
    entry,
    createVocabularyEntryValue({ term: "رام الله", category: "city" }),
    createVocabularyEntryValue({ term: "وكالة", category: "organization" })
  ];
  assert.deepEqual(getFilteredVocabularyEntries({ vocabulary, query: "بيت", category: "city" }).map((item) => item.term), ["القدس"]);
  assert.equal(getVocabularyCategoryCounts(vocabulary).city, 2);
});

run("hierarchical tags view model", () => {
  const root = createHierarchicalTagValue({ id: "root", name: "الأصل", order: 0 });
  const child = createHierarchicalTagValue({ id: "child", name: "الفرع", parentId: "root", order: 0 });
  const grandchild = createHierarchicalTagValue({ id: "grandchild", name: "التفصيل", parentId: "child", order: 0 });
  const tags = [grandchild, child, root];
  const model = buildHierarchicalTagModel(tags);
  assert.deepEqual(model.roots.map((tag) => tag.id), ["root"]);
  assert.deepEqual(getDescendantTagIds("root", model.childrenByParent), ["child", "grandchild"]);
  assert.equal(getHierarchicalTagPath("grandchild", tags), "الأصل / الفرع / التفصيل");
  assert.equal(getNextHierarchicalTagOrder(tags, "root"), 1);
  assert.deepEqual(getFilteredHierarchicalTags(tags, "فرع").map((tag) => tag.id), ["grandchild", "child"]);
});

run("collections view model", () => {
  const items = [
    { id: "v1", title: "مقابلة خاصة", tags: ["مهم"], updatedAt: "2026-01-01" },
    { id: "v2", title: "خبر عاجل", isDeleted: true },
    { id: "v3", title: "تقرير", tags: [] }
  ];
  const manual = createVirtualCollectionValue({ id: "c1", name: "مختارات", itemIds: ["v1", "v2"] });
  const smart = createVirtualCollectionValue({ id: "c2", name: "بحث", type: "smart", filterRules: { query: "مقابلة" } });

  assert.deepEqual(resolveCollectionItems(manual, items).map((item) => item.id), ["v1"]);
  assert.deepEqual(resolveCollectionItems(smart, items).map((item) => item.id), ["v1"]);
  assert.deepEqual(getAvailableCollectionItems(manual, items).map((item) => item.id), ["v3"]);
  assert.deepEqual(getFilteredCollections([manual, smart], "بحث").map((collection) => collection.id), ["c2"]);
  assert.deepEqual(getCollectionSummary([manual, smart], items), {
    total: 2,
    manual: 1,
    smart: 1,
    linkedItems: 1
  });
});

run("users view model", () => {
  const admin = createUserValue({ id: "admin", username: "admin", displayName: "المدير", role: "admin", isActive: true });
  const editor = createUserValue({ id: "editor", username: "editor", displayName: "محرر", role: "editor", isActive: true });
  const viewer = createUserValue({ id: "viewer", username: "viewer", displayName: "مشاهد", role: "missing", isActive: false });
  const users = [viewer, editor, admin];

  assert.equal(normalizeUserRole("missing"), "viewer");
  assert.equal(viewer.role, "viewer");
  assert.deepEqual(getFilteredUsers(users, "محرر", "all").map((user) => user.id), ["editor"]);
  assert.equal(getUserSummary(users).activeAdmins, 1);
  assert.equal(canDeactivateUser(admin, users), false);
  assert.equal(canDeactivateUser(editor, users), true);
});

run("types view model", () => {
  assert.equal(normalizeFieldStorageKey("اسم الحقل !"), "اسم_الحقل");
  assert.deepEqual(parseFieldOptions("أ، ب, ج"), ["أ", "ب", "ج"]);

  const type = createContentTypeValue({
    id: "interview",
    name: "مقابلات",
    fields: [
      createCustomFieldValue({ id: "guest", label: "الضيف", type: "text", order: 0 }),
      createCustomFieldValue({ id: "file", label: "ملف", type: "localFile", order: 1 })
    ],
    subtypes: [
      createSubtypeValue({ id: "full", name: "كاملة", fields: [createCustomFieldValue({ id: "season", label: "الموسم", order: 0 })] })
    ]
  });
  const archived = createContentTypeValue({ id: "old", name: "قديم", status: "archived" });
  assert.deepEqual(getFilteredContentTypes([archived, type], "مقاب", false).map((item) => item.id), ["interview"]);
  assert.equal(getTypeUsageCounts([type], [{ id: "v1", type: "interview" }, { id: "v2", type: "interview", isDeleted: true }]).interview, 1);
  assert.deepEqual(getFieldsForSelection([type], "interview", "full").map((field) => field.id), ["guest", "season", "file"]);
});

run("videos view model", () => {
  assert.deepEqual(parseVideoTags("أ، ب,#ج"), ["أ", "ب", "ج"]);
  const file = createLocalFileValue({ name: "clip.mp4", size: 1024, type: "video/mp4", lastModified: Date.UTC(2026, 0, 1), webkitRelativePath: "clips/clip.mp4" });
  assert.equal(file.extension, "mp4");
  assert.equal(normalizeLocalFileValue("D:\\clips\\clip.mp4").name, "clip.mp4");
  const item = createVideoItemValue({ title: "فيديو", type: "movie", tags: "أ، ب", metadata: { local: file } });
  assert.deepEqual(item.tags, ["أ", "ب"]);
  assert.equal(getTypeLabel([{ id: "movie", name: "أفلام", subtypes: [{ id: "full", name: "كامل" }] }], "movie"), "أفلام");
  assert.equal(getSubtypeLabel([{ id: "movie", subtypes: [{ id: "full", name: "كامل" }] }], "movie", "full"), "كامل");
});

run("global shortcut action resolver", () => {
  const ctrlK = { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, key: "k", target: { tagName: "BODY" } };
  const ctrlSlashInInput = { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, key: "/", target: { tagName: "INPUT" } };
  const ctrlKInInput = { ...ctrlK, target: { tagName: "INPUT" } };
  assert.equal(getGlobalShortcutAction(ctrlK, {}), "openSearch");
  assert.equal(getGlobalShortcutAction(ctrlSlashInInput, {}), "showShortcuts");
  assert.equal(getGlobalShortcutAction(ctrlKInInput, {}), null);
  assert.equal(getGlobalShortcutAction(ctrlK, { keyboardShortcuts: { openSearch: "disabled" } }), null);
});

run("shortcut and command dialog view models", () => {
  const actions = [
    { id: "openSearch", label: "فتح البحث المتقدم", category: "التنقل", defaultKeys: "Ctrl+K" },
    { id: "lockApp", label: "قفل التطبيق", category: "الأمان", defaultKeys: "Ctrl+Shift+L" }
  ];
  const items = createShortcutDialogItems(actions);
  const visible = filterShortcutDialogItems(items, "قفل", { lockApp: "Alt+L" });
  assert.deepEqual(visible.map((item) => item.id), ["lockApp"]);
  assert.deepEqual(getShortcutDialogCategories(items), ["التنقل", "الأمان"]);
  assert.deepEqual(getShortcutDialogItemsForCategory(actions, visible, "الأمان").map((item) => item.id), ["lockApp"]);

  const commands = filterCommandPaletteCommands([
    { id: "backup", label: "فتح مركز البيانات", detail: "نسخ احتياطي واستيراد", keys: "Ctrl+B" },
    { id: "help", label: "فتح مركز المساعدة", detail: "تعليمات", keys: "Ctrl+/" }
  ], "استيراد");
  assert.deepEqual(commands.map((command) => command.id), ["backup"]);
});

run("help view model", () => {
  assert.equal(HELP_QUICK_SECTION_LINKS.some(([sectionId]) => sectionId === "shortcuts"), true);
  assert.equal(HELP_FAQ_ITEMS.some((faq) => faq.question.includes("فيديو")), true);
  assert.equal(normalizeHelpSectionId("keyboard"), "shortcuts");
  assert.equal(normalizeHelpSectionId(""), "getting-started");
  assert.deepEqual(filterHelpSections([
    { id: "getting-started", title: "البدء" },
    { id: "backup-import", title: "النسخ الاحتياطي", searchText: "استيراد نقل" }
  ], "نقل").map((section) => section.id), ["backup-import"]);
  assert.deepEqual(filterHelpFaqItems([
    { question: "كيف أبحث؟", answer: "استخدم الأرشيف" },
    { question: "كيف أنقل البيانات؟", answer: "استخدم ملف النقل" }
  ], "النقل").map((faq) => faq.question), ["كيف أنقل البيانات؟"]);

  const shortcutList = createHelpShortcutList([
    { id: "openSearch", label: "فتح البحث", category: "التنقل", defaultKeys: "Ctrl+K" },
    { id: "openBackup", label: "مركز البيانات", category: "التنقل", defaultKeys: "Ctrl+B" }
  ], { openBackup: "disabled" });
  assert.deepEqual(shortcutList[0].keys, ["Ctrl", "K"]);
  assert.equal(shortcutList[1].disabled, true);
});

run("settings view model", () => {
  assert.equal(normalizeSettingsTab("shortcuts"), "shortcuts");
  assert.equal(normalizeSettingsTab("missing"), "general");
  assert.equal(getSettingsTabState("security").activeLabel, "الأمان");
  assert.deepEqual(createSettingsTabUiPatch({ ui: { lastSettingsTab: "general", lastHelpSection: "x" } }, "data"), {
    ui: { lastSettingsTab: "data", lastHelpSection: "x" }
  });
  assert.equal(
    hasMeaningfulSettingsDraftChanges(
      { ui: { lastSettingsTab: "general" }, theme: "dark" },
      { ui: { lastSettingsTab: "security" }, theme: "dark" },
      "dark"
    ),
    false
  );
});

run("onboarding view model", () => {
  assert.equal(getOnboardingStepIndex("appearance"), 3);
  assert.equal(getNextOnboardingStep("appearance").id, "interface");
  assert.equal(getFirstTaskDestination("import-backup"), "backup");
  assert.equal(getOnboardingDestination("create-type"), "types");
  assert.equal(shouldShowStartupOnboarding({ authState: "setup", settings: { ui: { v1OnboardingCompleted: false } } }), true);
  assert.equal(shouldShowStartupOnboarding({ authState: "login", settings: { ui: { v1OnboardingCompleted: false } } }), false);
  assert.equal(shouldShowV1Tour({ settings: { ui: { v1OnboardingCompleted: true, v1TourCompleted: false } }, currentPage: "dashboard" }), true);
  assert.deepEqual(createOnboardingUiPatch({
    stepId: "interface",
    securityMode: "quick",
    themeChoice: "system",
    firstTaskChoice: "add-video",
    completed: true,
    now: "2026-01-01T00:00:00.000Z"
  }), {
    lastOnboardingStep: "interface",
    onboardingSecurityMode: "quick",
    onboardingThemeChoice: "system",
    firstTaskChoice: "add-video",
    v1OnboardingCompleted: true,
    onboardingSkippedAt: null,
    onboardingCoreUiSeenAt: "2026-01-01T00:00:00.000Z"
  });
  assert.deepEqual(createOnboardingCompletionPatch({
    securityMode: "quick",
    themeChoice: "light",
    accentColor: "indigo",
    visualDensity: "compact",
    firstTaskChoice: "create-type",
    now: "2026-01-01T00:00:00.000Z"
  }).ui, {
    onboardingCompleted: true,
    v1OnboardingCompleted: true,
    onboardingSecurityMode: "quick",
    onboardingThemeChoice: "light",
    onboardingCoreUiSeenAt: "2026-01-01T00:00:00.000Z",
    onboardingSkippedAt: "2026-01-01T00:00:00.000Z",
    firstTaskChoice: "create-type",
    lastOnboardingStep: "completed",
    visualDensity: "compact",
    onboardingReplayCompletedAt: null,
    firstTaskChoiceUsed: false
  });
});

run("navigation view model", () => {
  const groups = getSidebarNavigationGroups();
  assert.equal(groups.some((group) => group.id === "daily"), true);
  assert.equal(getPageContextBarModel("archive").title, "الأرشيف");
  assert.equal(getPrimaryPageAction("backup").dataTab, "import");
});

run("page migration wrappers", () => {
  const status = getPageMigrationStatus();
  const summary = getPageMigrationSummary(status);
  assert.equal(summary.total, 15);
  assert.equal(summary.native, 15);
  assert.equal(summary.legacyWrapped, 0);
  assert.equal(status.find((page) => page.id === "archive")?.status, "native");
  assert.equal(status.find((page) => page.id === "dashboard")?.status, "native");
  assert.equal(status.find((page) => page.id === "backup")?.status, "native");
  assert.equal(status.find((page) => page.id === "reports")?.status, "native");
  assert.equal(status.find((page) => page.id === "help")?.status, "native");
  assert.equal(status.find((page) => page.id === "settings")?.status, "native");
  assert.equal(status.find((page) => page.id === "search")?.status, "native");
  assert.equal(status.find((page) => page.id === "history")?.status, "native");
  assert.equal(status.find((page) => page.id === "collections")?.status, "native");
  assert.equal(status.find((page) => page.id === "vocabulary")?.status, "native");
  assert.equal(status.find((page) => page.id === "htags")?.status, "native");
  assert.equal(status.find((page) => page.id === "users")?.status, "native");
  assert.equal(status.find((page) => page.id === "types")?.status, "native");
  assert.equal(status.find((page) => page.id === "add")?.status, "native");
  assert.equal(status.find((page) => page.id === "detail")?.status, "native");
});

run("data portability JSON safety", () => {
  let sawParseError = false;
  assert.deepEqual(safeJsonParse("{\"ok\":true}", null), { ok: true });
  assert.equal(safeJsonParse("{", "fallback", { onError: () => { sawParseError = true; } }), "fallback");
  assert.equal(sawParseError, true);

  const unsafe = { keep: 1, nested: { ok: 2 }, skip: undefined, fn: () => {} };
  Object.defineProperty(unsafe, "__proto__", { value: { polluted: true }, enumerable: true });
  unsafe.constructor = "blocked";
  unsafe.prototype = "blocked";
  unsafe.self = unsafe;

  const clean = sanitizePlainData(unsafe);
  assert.equal(Object.hasOwn(clean, "__proto__"), false);
  assert.equal(Object.hasOwn(clean, "constructor"), false);
  assert.equal(Object.hasOwn(clean, "prototype"), false);
  assert.equal(Object.hasOwn(clean, "skip"), false);
  assert.equal(Object.hasOwn(clean, "fn"), false);
  assert.deepEqual(clean.nested, { ok: 2 });
  assert.equal(clean.self, null);
});

run("transfer package normalization hook", () => {
  const packageData = createTransferPackage({
    contentTypes: [{ id: "type", name: "نوع", fields: [], subtypes: [] }],
    videoItems: [{ id: "video", type: "type", title: "فيديو" }]
  }, "test");

  const result = readTransferPackage(JSON.stringify(packageData), {
    normalizePayload: (payload) => ({
      ...payload,
      videoItems: payload.videoItems.map((item) => ({ ...item, title: `${item.title} معدل` }))
    })
  });

  assert.equal(result.valid, true);
  assert.equal(result.payload.videoItems[0].title, "فيديو معدل");
  assert.equal(result.package.payload.videoItems[0].title, "فيديو معدل");
});

await runAsync("archive import file reader", async () => {
  const baseState = {
    contentTypes: [{ id: "type", name: "نوع", fields: [], subtypes: [] }],
    videoItems: [{ id: "video", type: "type", title: "فيديو" }]
  };

  const jsonResult = await readArchiveImportFile({
    name: "archive.json",
    type: "application/json",
    text: async () => JSON.stringify(baseState)
  }, {
    normalizePayload: (payload) => ({ ...payload, version: payload.version || "2.0" })
  });
  assert.equal(jsonResult.valid, true);
  assert.equal(jsonResult.sourceType, "json");

  const transferPackage = createTransferPackage(baseState, "test");
  const transferResult = await readArchiveImportFile({
    name: "transfer.json",
    type: "application/json",
    text: async () => JSON.stringify(transferPackage)
  });
  assert.equal(transferResult.valid, true);
  assert.equal(transferResult.sourceType, "transfer");
  assert.equal(transferResult.packageInfo.packageType, "video-archive-transfer");

  const excelPackage = createArchiveExcelPackagePayload(baseState);
  const fakeXlsx = {
    read: () => ({ Sheets: { __archive_payload: {} } }),
    utils: {
      sheet_to_json: () => excelPackage.rows
    }
  };
  const excelResult = await readArchiveImportFile({
    name: "archive.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    arrayBuffer: async () => new ArrayBuffer(0)
  }, {
    loadXlsx: async () => fakeXlsx
  });
  assert.equal(isArchiveExcelImportFile({ name: "archive.xlsx" }), true);
  assert.equal(excelResult.valid, true);
  assert.equal(excelResult.sourceType, "excel");
});

run("data center view model", () => {
  const filters = createDataCenterExportFilters({
    typeFilter: "video",
    collectionFilter: "collection-1",
    dateFrom: "2026-01-01",
    favoritesOnly: true
  });
  assert.deepEqual(filters, {
    filters: {
      type: "video",
      collectionId: "collection-1",
      dateFrom: "2026-01-01",
      dateTo: "",
      favoriteOnly: true
    },
    compact: true
  });

  const summary = createDataCenterExportSummary({
    data: {
      videoItems: [{ id: "v1" }],
      contentTypes: [{ id: "type" }],
      users: [],
      auditLogs: [{ id: "log" }]
    },
    estimatedSize: 2048,
    filters: { typeFilter: "video", collectionFilter: "all", dateFrom: "", dateTo: "", favoritesOnly: false },
    formatFileSize: (value) => `${value}B`
  });
  assert.equal(summary.find((item) => item.label === "العناصر").value, 1);
  assert.equal(summary.find((item) => item.label === "الفلاتر").value, "نوع محدد");

  const now = Date.UTC(2026, 0, 1, 0, 0, 0);
  assert.equal(getNextBackupTime("daily", null, now).toISOString(), "2026-01-02T00:00:00.000Z");
  assert.equal(formatTimeUntilBackup(new Date(now + 90 * 60000), now), "بعد 1 ساعة و30 دقيقة");
});

run("archive Excel workbook service", () => {
  const fakeXlsx = {
    utils: {
      book_new: () => ({ SheetNames: [], Sheets: {} }),
      json_to_sheet: (rows) => ({ rows }),
      aoa_to_sheet: (rows) => ({ rows }),
      encode_range: () => "A1:B2",
      book_append_sheet: (workbook, sheet, name) => {
        workbook.SheetNames.push(name);
        workbook.Sheets[name] = sheet;
      }
    }
  };
  const state = {
    contentTypes: [
      { id: "type", name: "نوع", fields: [{ id: "duration", label: "المدة", type: "text" }], subtypes: [] }
    ],
    videoItems: [
      { id: "video", type: "type", title: "فيديو", tags: ["وسم"], metadata: { duration: "10:00" }, createdAt: "2026-01-01", updatedAt: "2026-01-02" }
    ],
    settings: {},
    users: []
  };
  const { workbook, checksum } = createArchiveExcelWorkbook(fakeXlsx, state);

  assert.equal(workbook.SheetNames[0], "00_الفهرس");
  assert.equal(workbook.SheetNames.includes("__archive_payload"), true);
  assert.equal(Boolean(checksum), true);
  assert.equal(workbook.Workbook.Sheets.find((sheet) => sheet.name === "__archive_payload")?.Hidden, 1);
});

run("archive CSV export files", () => {
  const files = createArchiveCsvExportFiles({
    contentTypes: [{ id: "type", name: "نوع", archivedAt: "2026-01-01" }],
    videoItems: [{ id: "video", type: "type", title: "فيديو", tags: ["وسم"], isFavorite: true }],
    virtualCollections: [{ id: "collection", name: "مجموعة", itemIds: ["video"], isSmart: true }],
    users: [{ id: "user", username: "admin", displayName: "مدير", role: "admin", isActive: true }]
  }, {
    isArchivedRecord: (record) => Boolean(record.archivedAt)
  });

  assert.deepEqual(files.map((file) => file.slug), ["items", "content-types", "collections", "users"]);
  assert.equal(files[0].rows[0]["النوع"], "نوع");
  assert.equal(files[1].rows[0]["مؤرشف"], "نعم");
  assert.equal(files[2].rows[0]["ذكية"], "نعم");
});

run("dashboard view model", () => {
  assert.equal(parseDurationSeconds("01:02:03"), 3723);
  assert.equal(parseDurationSeconds("12:30"), 750);

  const now = Date.UTC(2026, 0, 8);
  const stats = createDashboardStats({
    now,
    videoItems: [
      { id: "demo-1", createdAt: new Date(now - 2 * 86400000).toISOString(), updatedAt: new Date(now - 86400000).toISOString(), metadata: { duration: "01:00:00" }, isFavorite: true },
      { id: "v2", createdAt: new Date(now - 10 * 86400000).toISOString(), updatedAt: new Date(now - 10 * 86400000).toISOString(), duration: 1800 },
      { id: "v3", isDeleted: true }
    ],
    contentTypes: [{ id: "type" }],
    virtualCollections: [{ id: "collection" }],
    hierarchicalTags: [{ id: "tag" }]
  });
  assert.equal(stats.total, 2);
  assert.equal(stats.totalHours, "2 س");
  assert.equal(stats.addedThisWeek, 1);
  assert.equal(stats.recentActivity, 1);
  assert.deepEqual(getDashboardDemoItemIds([{ id: "demo-1" }, { id: "v2" }]), ["demo-1"]);
  assert.equal(hasDashboardLayoutDraftChanges({ draftLayout: ["a"], currentLayout: ["b"] }), true);
  assert.equal(hasDashboardLayoutDraftChanges({ draftLayout: ["a"], currentLayout: ["a"] }), false);
});

run("import preview summaries", () => {
  const summary = createImportPreviewSummary(
    {
      settings: { theme: "dark" },
      videoItems: [
        { id: "v1", title: "Same title", updatedAt: "newer" },
        { id: "v2", title: "Same title" }
      ],
      users: [{ id: "u2", name: "Imported" }]
    },
    {
      videoItems: [{ id: "v1", title: "Same title", updatedAt: "older" }],
      users: [{ id: "u1", name: "Current" }]
    }
  );

  const videoEntity = summary.entities.find((entity) => entity.key === "videoItems");
  assert.equal(videoEntity.total, 2);
  assert.equal(videoEntity.newCount, 1);
  assert.equal(videoEntity.duplicateCount, 1);
  assert.equal(videoEntity.conflictCount, 0);
  assert.equal(videoEntity.potentialDuplicateCount, 1);
  assert.equal(summary.hasSettings, true);
  assert.equal(summary.hasUsers, true);

  const formatted = formatImportPreviewSummary(summary, {
    fileName: "archive.json",
    fileSize: 25,
    packageInfo: { checksum: "abcdef1234567890zz" }
  }, { formatFileSize: (value) => `${value}B` });
  assert.match(formatted, /archive\.json/);
  assert.match(formatted, /25B/);
  assert.match(formatted, /abcdef1234567890/);
});

run("operation preflight checks", () => {
  assert.equal(createOperationSizeCheck({ records: 50001 }).status, "warning");
  assert.equal(createOperationSizeCheck({ estimatedSize: 120 * 1024 * 1024 }).status, "ok");
  assert.equal(createSqliteReadinessCheck({ sqliteReady: false }).status, "warning");
  assert.equal(createSqliteReadinessCheck({ sqliteReady: true }).status, "ok");
  assert.equal(createStorageEstimateCheck({ usage: 93, quota: 100 }).status, "warning");
  assert.match(formatPreflightSummary({ checks: [{ status: "ok", label: "Storage", message: "Ready" }] }), /Storage: Ready/);
});

run("router helpers", () => {
  assert.equal(normalizeRoutePage("/detail/123"), "detail");
  assert.equal(buildAppRoute("detail", { selectedItemId: "clip 1" }), "#/detail/clip%201");

  const hashRoute = parseAppRoute({ hash: "#/help?section=transfer", protocol: "http:", pathname: "/", search: "" });
  assert.equal(hashRoute.page, "help");
  assert.equal(hashRoute.section, "transfer");

  const historyRoute = parseAppRoute({ hash: "", protocol: "http:", pathname: "/detail/video%201", search: "?tab=meta" });
  assert.equal(historyRoute.page, "detail");
  assert.equal(historyRoute.selectedItemId, "video 1");
  assert.equal(historyRoute.params.get("tab"), "meta");
});

run("theme accent tokens", () => {
  assert.deepEqual(getAccentColorTokens("indigo"), { accent: "#6366f1", strong: "#4f46e5", soft: "#27275f" });
  assert.equal(getAccentColorTokens("missing").accent, "#14b8a6");

  const writes = [];
  const tokens = applyAccentColor("rose", {
    style: {
      setProperty: (key, value) => writes.push([key, value])
    }
  });
  assert.equal(tokens.accent, "#f43f5e");
  assert.deepEqual(writes[0], ["--app-accent", "#f43f5e"]);
});
