import assert from "node:assert/strict";

import {
  getHtml5VideoPreviewSource,
  isHtml5PreviewableVideo
} from "../src/features/archive/mediaPreview.js";
import {
  findShortcutConflict,
  getDefaultKeyboardShortcuts,
  getEffectiveKeyboardShortcuts,
  isTextEntryTarget,
  shortcutMatches
} from "../src/features/settings/keyboardShortcuts.js";
import {
  createImportPreviewSummary,
  formatImportPreviewSummary
} from "../src/services/data-portability/importPreview.js";
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

function run(name, test) {
  test();
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
