import {
  useAppStore
} from "../stores/index.js";
import {
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Shield,
  Trash2,
  TriangleAlert,
  Upload
} from "lucide-react";
import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { XLSX } from "../vendor/xlsx.js";
import {
  dbGetAll,
  STORES
} from "../services/storage/index.js";
import {
  importNormalizedPayload,
  normalizeBackupData
} from "../services/data-portability/normalizedImport.js";
import {
  runOperationPreflight
} from "../services/health/index.js";
import { appConfirm } from "../components/common/ConfirmDialog.js";
import { SyncConflictDialog } from "../features/sync/SyncConflictDialog.jsx";
import {
  MotionPage,
  PageHero,
  StatusBadge,
  Stepper
} from "../components/ui/index.js";
import {
  DATA_CENTER_TABS
} from "../features/data-center/tabs.js";
import {
  ActionButton,
  DataMetric,
  PageCard,
  PreviewSummary,
  SegmentedButton,
  SummaryGrid,
  TabButton
} from "../features/data-center/DataCenterViews.jsx";
import {
  createDataCenterExportFilters,
  createDataCenterExportSummary,
  formatTimeUntilBackup,
  getNextBackupTime
} from "../features/data-center/viewModel.js";
import {
  createArchiveCsvExportFiles,
  createArchiveExcelWorkbook,
  createImportPreviewSummary,
  createTransferPackage,
  downloadArchiveBlob,
  readArchiveImportFile,
  rowsToCsv
} from "../services/data-portability/index.js";
import {
  buildSyncFloorFromItems,
  filterDeltaVideoItems,
  mergeSyncFloors,
  summarizeDeltaPlan
} from "../features/sync/deltaExport.js";
import {
  formatDateTime,
  formatFileSize,
  formatNumber
} from "../utils/formatting.js";

const DATA_SAFETY_STEPS = [
  { id: "preflight", label: "فحص مبدئي", detail: "التخزين والمساحة وحجم العملية" },
  { id: "preview", label: "معاينة", detail: "الجديد والمكرر والمتعارض" },
  { id: "backup", label: "نسخة أمان", detail: "قبل الدمج أو الاستعادة" },
  { id: "apply", label: "تطبيق", detail: "تصدير أو دمج أو استبدال" }
];


export function DataCenterPage() {
  const {
    videoItems = [],
    contentTypes = [],
    virtualCollections = [],
    vocabulary = [],
    hierarchicalTags = [],
    users = [],
    auditLogs = [],
    settings = {},
    updateSettings,
    buildExportPayload,
    estimateExportSize,
    exportData,
    createBackup,
    restoreBackup,
    deleteBackup,
    loadAllData,
    planIncomingDelta,
    applyResolvedDelta,
    showToast
  } = useAppStore();

  const [activeTab, setActiveTabState] = React.useState(settings.ui?.lastDataCenterTab || "export");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [collectionFilter, setCollectionFilter] = React.useState("all");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState("json");
  const [importMode, setImportModeState] = React.useState(settings.ui?.lastImportMode || settings.ui?.transferLastMode || "merge");
  // Device identity is now seeded once on app boot by ensureDeviceIdentity
  // and lives at settings.ui.deviceId / settings.ui.deviceName. Mirror
  // the name into local state for the input control while the user edits.
  const deviceId = settings.ui?.deviceId || null;
  const [sourceDeviceName, setSourceDeviceName] = React.useState(() => settings.ui?.deviceName || "هذا الجهاز");
  React.useEffect(() => {
    const next = settings.ui?.deviceName;
    if (next && next !== sourceDeviceName) setSourceDeviceName(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.ui?.deviceName]);
  const commitDeviceName = React.useCallback(() => {
    const trimmed = sourceDeviceName.trim();
    if (trimmed && trimmed !== settings.ui?.deviceName) {
      updateSettings?.({ ui: { ...(settings.ui || {}), deviceName: trimmed } });
    }
  }, [settings.ui, sourceDeviceName, updateSettings]);
  const [isWorking, setIsWorking] = React.useState(false);
  const [operationMessage, setOperationMessage] = React.useState("");
  const [importPreview, setImportPreview] = React.useState(null);
  const [conflictPlan, setConflictPlan] = React.useState(null);
  const [conflictDialogOpen, setConflictDialogOpen] = React.useState(false);
  const [importErrors, setImportErrors] = React.useState([]);
  const [backups, setBackups] = React.useState([]);
  const [backupError, setBackupError] = React.useState("");
  const importInputRef = React.useRef(null);

  // Sync peers — every device we've ever exported a delta to is
  // remembered here. The dropdown below lets the user pick which
  // peer the next delta is for, defaulting to the most recent.
  const syncPeers = settings.syncPeers || {};
  const syncPeerList = React.useMemo(
    () => Object.values(syncPeers).sort((a, b) => (new Date(b.lastSentAt || 0).getTime()) - (new Date(a.lastSentAt || 0).getTime())),
    [syncPeers]
  );
  const [deltaTargetId, setDeltaTargetId] = React.useState("");
  const [deltaNewDeviceName, setDeltaNewDeviceName] = React.useState("");
  const targetPeer = deltaTargetId ? syncPeers[deltaTargetId] : null;
  const deltaPlan = React.useMemo(
    () => summarizeDeltaPlan(videoItems, targetPeer?.lastSentSyncFloor || {}),
    [targetPeer, videoItems]
  );

  const exportOptions = React.useMemo(() => createDataCenterExportFilters({
    typeFilter,
    collectionFilter,
    favoritesOnly
  }), [typeFilter, collectionFilter, favoritesOnly]);

  const exportPayload = React.useMemo(() => {
    if (typeof buildExportPayload === "function") return buildExportPayload(exportOptions);
    return {
      videoItems,
      contentTypes,
      virtualCollections,
      vocabulary,
      hierarchicalTags,
      users,
      auditLogs,
      settings
    };
  }, [
    auditLogs,
    buildExportPayload,
    contentTypes,
    exportOptions,
    hierarchicalTags,
    settings,
    users,
    videoItems,
    virtualCollections,
    vocabulary
  ]);

  const estimatedSize = React.useMemo(() => {
    if (typeof estimateExportSize === "function") return estimateExportSize(exportOptions);
    return new Blob([JSON.stringify(exportPayload)]).size;
  }, [estimateExportSize, exportOptions, exportPayload]);

  const exportSummary = React.useMemo(() => createDataCenterExportSummary({
    data: exportPayload,
    estimatedSize,
    filters: { typeFilter, collectionFilter, favoritesOnly },
    formatFileSize
  }), [collectionFilter, estimatedSize, exportPayload, favoritesOnly, typeFilter]);

  const nextBackup = getNextBackupTime(settings.backupSchedule, settings.lastBackupAt);
  const nextBackupLabel = formatTimeUntilBackup(nextBackup) || "يدوي";
  const activeSafetyStep = isWorking
    ? "apply"
    : activeTab === "backup" || activeTab === "transfer"
      ? "backup"
      : activeTab === "import" && importPreview
        ? "preview"
        : "preflight";

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    Promise.resolve(updateSettings?.({ ui: { ...(settings.ui || {}), lastDataCenterTab: tabId } })).catch(() => {});
  };

  const setImportMode = (mode) => {
    setImportModeState(mode);
    Promise.resolve(updateSettings?.({ ui: { ...(settings.ui || {}), lastImportMode: mode, transferLastMode: mode } })).catch(() => {});
  };

  const loadBackups = React.useCallback(async () => {
    try {
      setBackupError("");
      const rows = await dbGetAll(STORES.BACKUPS);
      setBackups(rows.slice().sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));
    } catch (error) {
      setBackupError(error?.message || "تعذر تحميل النسخ الاحتياطية");
    }
  }, []);

  React.useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  React.useEffect(() => {
    const handleDataTab = (event) => {
      const tab = event?.detail?.tab;
      if (DATA_CENTER_TABS.some((item) => item.id === tab)) setActiveTabState(tab);
    };
    window.addEventListener("videoarchive:data-tab", handleDataTab);
    return () => window.removeEventListener("videoarchive:data-tab", handleDataTab);
  }, []);

  const runPreflight = async (kind, summary = {}) => {
    const preflight = await runOperationPreflight?.(kind, {
      records: summary.records ?? exportPayload.videoItems?.length ?? videoItems.length,
      estimatedSize: summary.estimatedSize ?? estimatedSize
    });
    if (preflight && preflight.ok === false) {
      setOperationMessage("فشل فحص ما قبل العملية. لم يتم تطبيق أي تغيير.");
      showToast?.("فشل فحص ما قبل العملية", "error");
      return false;
    }
    return true;
  };

  const makeFileName = (prefix, extension) => `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`;

  const handleExport = async (kind = selectedFormat) => {
    setIsWorking(true);
    setOperationMessage("");
    try {
      const ok = await runPreflight(`export-${kind}`);
      if (!ok) return;

      if (kind === "json") {
        const json = typeof exportData === "function" ? exportData({ ...exportOptions, pretty: true }) : JSON.stringify(exportPayload, null, 2);
        downloadArchiveBlob(new Blob([json], { type: "application/json;charset=utf-8" }), makeFileName("video-archive-export", "json"));
        setOperationMessage("تم تنزيل ملف JSON بنجاح.");
      } else if (kind === "excel") {
        const { workbook, checksum } = createArchiveExcelWorkbook(XLSX, {
          ...useAppStore.getState(),
          ...exportPayload
        });
        XLSX.writeFile(workbook, makeFileName("video-archive-report", "xlsx"));
        setOperationMessage(`تم إنشاء ملف Excel متعدد الأوراق. checksum ${checksum}`);
      } else if (kind === "csv") {
        const csvFiles = createArchiveCsvExportFiles(exportPayload);
        csvFiles.forEach((file) => {
          downloadArchiveBlob(new Blob([rowsToCsv(file.rows)], { type: "text/csv;charset=utf-8" }), makeFileName(`video-archive-${file.slug}`, "csv"));
        });
        setOperationMessage(`تم تنزيل ${csvFiles.length} ملفات CSV.`);
      } else if (kind === "transfer") {
        commitDeviceName();
        const transferPackage = createTransferPackage({
          ...useAppStore.getState(),
          ...exportPayload
        }, { deviceId, deviceName: sourceDeviceName.trim() || "هذا الجهاز" });
        downloadArchiveBlob(new Blob([JSON.stringify(transferPackage, null, 2)], { type: "application/json;charset=utf-8" }), makeFileName("video-archive-transfer", "json"));
        setOperationMessage(`تم إنشاء ملف نقل آمن. checksum ${transferPackage.checksum}`);
      } else if (kind === "delta") {
        commitDeviceName();
        const trimmedNewName = deltaNewDeviceName.trim();
        // Either targeting a known peer or creating a brand-new one.
        const target = targetPeer || (trimmedNewName ? {
          deviceId: `peer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          deviceName: trimmedNewName,
          lastSentSyncFloor: {}
        } : null);
        if (!target) {
          throw new Error("اختر جهازاً معروفاً أو أدخل اسماً جديداً قبل تصدير الـ delta.");
        }
        const peerFloor = target.lastSentSyncFloor || {};
        const deltaItems = filterDeltaVideoItems(videoItems, peerFloor);
        if (!deltaItems.length) {
          setOperationMessage("لا توجد تغييرات منذ آخر مزامنة مع هذا الجهاز.");
          showToast?.("لا تغييرات للإرسال", "info");
          return;
        }
        const deltaPayload = {
          ...exportPayload,
          videoItems: deltaItems
        };
        const transferPackage = createTransferPackage(deltaPayload, {
          deviceId,
          deviceName: sourceDeviceName.trim() || "هذا الجهاز"
        }, {
          mode: "delta",
          targetDeviceId: target.deviceId,
          baseSyncFloor: peerFloor
        });
        downloadArchiveBlob(
          new Blob([JSON.stringify(transferPackage, null, 2)], { type: "application/json;charset=utf-8" }),
          makeFileName(`video-archive-delta-${target.deviceName.replace(/[^\w؀-ۿ]+/g, "_")}`, "json")
        );
        // Record what we just sent so the next delta only includes
        // newer changes.
        const newFloor = mergeSyncFloors(peerFloor, buildSyncFloorFromItems(deltaItems));
        const nextPeer = {
          ...target,
          lastSentAt: new Date().toISOString(),
          lastSentSyncFloor: newFloor
        };
        await updateSettings?.({
          syncPeers: { [target.deviceId]: nextPeer }
        });
        setDeltaTargetId(target.deviceId);
        setDeltaNewDeviceName("");
        setOperationMessage(`تم تصدير ${deltaItems.length} عنصراً كـ delta إلى "${target.deviceName}".`);
      }

      showToast?.("اكتمل التصدير", "success");
    } catch (error) {
      const message = error?.message || "فشل تنفيذ التصدير";
      setOperationMessage(message);
      showToast?.(message, "error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsWorking(true);
    setImportPreview(null);
    setImportErrors([]);
    setOperationMessage("");
    try {
      const parsed = await readArchiveImportFile(file, {
        loadXlsx: async () => XLSX,
        normalizePayload: normalizeBackupData
      });
      if (!parsed.valid) {
        setImportErrors(parsed.errors || ["تعذر قراءة ملف الاستيراد"]);
        showToast?.("ملف الاستيراد غير صالح", "error");
        return;
      }

      const summary = createImportPreviewSummary(parsed.payload, useAppStore.getState(), { normalizePayload: normalizeBackupData });
      setImportPreview({
        fileName: file.name,
        fileSize: file.size,
        sourceType: parsed.sourceType,
        payload: parsed.payload,
        packageInfo: parsed.packageInfo,
        summary
      });
      setActiveTab("import");
      setOperationMessage("راجع المعاينة ثم اختر دمج آمن أو استبدال كامل.");
    } catch (error) {
      setImportErrors([error?.message || "فشل قراءة الملف"]);
      showToast?.("فشل قراءة الملف", "error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleApplyImport = async () => {
    if (!importPreview?.payload) return;
    const confirmed = importMode !== "replace" || await appConfirm("سيتم استبدال بيانات التطبيق الحالية بعد إنشاء نسخة احتياطية تلقائية. هل تريد المتابعة؟", {
      title: "استبدال كامل للبيانات",
      kind: "danger",
      confirmLabel: "استبدال بعد النسخ"
    });
    if (!confirmed) return;

    setIsWorking(true);
    setOperationMessage("");
    try {
      const ok = await runPreflight("import", importPreview.summary.totals);
      if (!ok) return;
      await createBackup?.(`قبل استيراد ${importPreview.fileName}`);
      const result = await importNormalizedPayload(importPreview.payload, importMode);
      if (!result?.success) throw new Error(result?.errors?.join("، ") || "فشل الاستيراد");
      await loadAllData?.();
      await loadBackups();
      setOperationMessage(importMode === "replace" ? "تم الاستبدال بعد إنشاء نسخة احتياطية." : "تم دمج البيانات بأمان دون حذف البيانات الحالية.");
      setImportPreview(null);
      showToast?.("اكتمل الاستيراد", "success");
    } catch (error) {
      const message = error?.message || "فشل تطبيق الاستيراد";
      setOperationMessage(message);
      showToast?.(message, "error");
    } finally {
      setIsWorking(false);
    }
  };

  // Smart-merge path: classify the incoming package against local
  // state and either auto-apply when nothing conflicts, or surface
  // the SyncConflictDialog when both sides changed the same item.
  // Only relevant for the "merge" import mode — "replace" wipes
  // local state, so there's nothing to conflict with.
  const handleSmartMerge = async () => {
    if (!importPreview?.payload || !planIncomingDelta) return;
    setIsWorking(true);
    setOperationMessage("");
    try {
      const plan = planIncomingDelta(importPreview.payload, {
        baseSyncFloor: importPreview.payload.baseSyncFloor || {}
      });
      if (!plan) {
        showToast?.("تعذر تحليل الحزمة", "error");
        return;
      }
      if (!plan.summary.needsReview) {
        // Clean fast-forward — apply autoApply + the rest of the
        // package via the regular merge path so collections/types
        // ride along.
        await createBackup?.(`قبل دمج ${importPreview.fileName}`);
        await applyResolvedDelta?.({ autoApply: plan.autoApply, resolved: {} });
        const result = await importNormalizedPayload(importPreview.payload, "merge");
        if (!result?.success) throw new Error(result?.errors?.join("، ") || "فشل الدمج");
        await loadAllData?.();
        await loadBackups();
        setOperationMessage(`تم الدمج بدون تعارضات. ${plan.summary.newCount} جديد، ${plan.summary.updateCount} محدّث.`);
        setImportPreview(null);
        showToast?.("تم الدمج تلقائياً", "success");
        return;
      }
      // Needs review — open the dialog. Apply happens inside
      // handleConflictResolve below.
      setConflictPlan(plan);
      setConflictDialogOpen(true);
    } catch (error) {
      const message = error?.message || "فشل تحليل التعارضات";
      setOperationMessage(message);
      showToast?.(message, "error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleConflictResolve = async (resolved) => {
    if (!conflictPlan || !importPreview?.payload) return;
    setIsWorking(true);
    setOperationMessage("");
    try {
      await createBackup?.(`قبل حل تعارضات ${importPreview.fileName}`);
      await applyResolvedDelta?.({ autoApply: conflictPlan.autoApply, resolved });
      // Run the rest of the package (collections, types, vocabulary,
      // tags) through the normal merge path so nothing is left behind.
      const result = await importNormalizedPayload(importPreview.payload, "merge");
      if (!result?.success) throw new Error(result?.errors?.join("، ") || "فشل تطبيق الحلول");
      await loadAllData?.();
      await loadBackups();
      const counts = conflictPlan.summary;
      setOperationMessage(`تم تطبيق الحلول. ${counts.newCount} جديد، ${counts.updateCount} محدّث، ${Object.keys(resolved).length} تعارض محلول.`);
      setConflictDialogOpen(false);
      setConflictPlan(null);
      setImportPreview(null);
      showToast?.("اكتمل الدمج بالحلول المختارة", "success");
    } catch (error) {
      const message = error?.message || "فشل تطبيق الحلول";
      setOperationMessage(message);
      showToast?.(message, "error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsWorking(true);
    setOperationMessage("");
    try {
      const ok = await runPreflight("backup", { records: videoItems.length, estimatedSize });
      if (!ok) return;
      await createBackup?.(`نسخة يدوية ${new Date().toLocaleString("ar")}`);
      await loadBackups();
      setOperationMessage("تم إنشاء نسخة احتياطية جديدة.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    const confirmed = await appConfirm(`سيتم إنشاء نسخة احتياطية قبل استعادة "${backup.name || backup.id}". هل تريد المتابعة؟`, {
      title: "استعادة نسخة احتياطية",
      confirmLabel: "استعادة"
    });
    if (!confirmed) return;
    setIsWorking(true);
    try {
      const ok = await restoreBackup?.(backup.id);
      if (ok) {
        await loadAllData?.();
        setOperationMessage("تمت استعادة النسخة الاحتياطية.");
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleDeleteBackup = async (backup) => {
    const confirmed = await appConfirm(`حذف النسخة "${backup.name || backup.id}" نهائي. هل تريد المتابعة؟`, {
      title: "حذف نسخة احتياطية",
      kind: "danger",
      confirmLabel: "حذف"
    });
    if (!confirmed) return;
    setIsWorking(true);
    try {
      await deleteBackup?.(backup.id);
      await loadBackups();
      setOperationMessage("تم حذف النسخة الاحتياطية.");
    } finally {
      setIsWorking(false);
    }
  };

  const renderExportPanel = () => jsxs(Fragment, {
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-start justify-between gap-4",
        children: [
          jsxs("div", {
            children: [
              jsx("h3", { className: "text-xl font-bold text-white", children: "تصدير منظم" }),
              jsx("p", { className: "mt-1 text-sm leading-relaxed text-gray-400", children: "اختر الصيغة، راجع الملخص، ثم صدّر بيانات جاهزة للأرشفة أو التحليل." })
            ]
          }),
          jsx(ActionButton, {
            onClick: () => handleExport(selectedFormat),
            disabled: isWorking,
            icon: isWorking ? jsx(RefreshCw, { className: "h-4 w-4 opacity-70" }) : jsx(Download, { className: "h-4 w-4" }),
            children: "تنزيل الآن"
          })
        ]
      }),
      jsx("div", {
        className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          { id: "json", label: "JSON", icon: jsx(FileText, { className: "h-4 w-4" }) },
          { id: "excel", label: "Excel متعدد الأوراق", icon: jsx(FileSpreadsheet, { className: "h-4 w-4" }) },
          { id: "csv", label: "CSV", icon: jsx(FileText, { className: "h-4 w-4" }) },
          { id: "transfer", label: "ملف نقل", icon: jsx(HardDrive, { className: "h-4 w-4" }) }
        ].map((option) => jsx(SegmentedButton, {
          active: selectedFormat === option.id,
          onClick: () => setSelectedFormat(option.id),
          children: jsxs("span", { className: "inline-flex items-center gap-2", children: [option.icon, option.label] })
        }, option.id))
      }),
      jsxs("div", {
        className: "mt-5 grid gap-3 xl:grid-cols-3",
        children: [
          jsxs("label", {
            className: "space-y-2",
            children: [
              jsx("span", { className: "text-xs text-gray-500", children: "نوع المحتوى" }),
              jsxs("select", {
                value: typeFilter,
                onChange: (event) => setTypeFilter(event.target.value),
                className: "w-full rounded-xl border border-white/10 bg-gray-950/50 px-3 py-2 text-sm text-white",
                children: [
                  jsx("option", { value: "all", children: "كل الأنواع" }),
                  ...contentTypes.map((type) => jsx("option", { value: type.id, children: type.name || type.id }, type.id))
                ]
              })
            ]
          }),
          jsxs("label", {
            className: "space-y-2",
            children: [
              jsx("span", { className: "text-xs text-gray-500", children: "المجموعة" }),
              jsxs("select", {
                value: collectionFilter,
                onChange: (event) => setCollectionFilter(event.target.value),
                className: "w-full rounded-xl border border-white/10 bg-gray-950/50 px-3 py-2 text-sm text-white",
                children: [
                  jsx("option", { value: "all", children: "كل المجموعات" }),
                  ...virtualCollections.map((collection) => jsx("option", { value: collection.id, children: collection.name || collection.id }, collection.id))
                ]
              })
            ]
          }),
          jsxs("label", {
            className: "flex min-h-[66px] items-center gap-3 va-surface-muted rounded-xl border px-3 py-2 text-sm text-gray-300",
            children: [
              jsx("input", {
                type: "checkbox",
                checked: favoritesOnly,
                onChange: (event) => setFavoritesOnly(event.target.checked),
                className: "h-4 w-4 accent-emerald-500"
              }),
              "تصدير المفضلة فقط"
            ]
          })
        ]
      }),
      jsx("div", { className: "mt-5", children: jsx(SummaryGrid, { rows: exportSummary }) })
    ]
  });

  const renderImportPanel = () => jsxs(Fragment, {
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-start justify-between gap-4",
        children: [
          jsxs("div", {
            children: [
              jsx("h3", { className: "text-xl font-bold text-white", children: "استيراد آمن" }),
              jsx("p", { className: "mt-1 max-w-2xl text-sm leading-relaxed text-gray-400", children: "يدعم JSON وملف النقل وExcel الذي صدّره التطبيق فقط. تظهر معاينة قبل أي كتابة، ويتم إنشاء نسخة احتياطية تلقائياً." })
            ]
          }),
          jsx(ActionButton, {
            onClick: () => importInputRef.current?.click(),
            disabled: isWorking,
            icon: jsx(Upload, { className: "h-4 w-4" }),
            children: "اختيار ملف"
          })
        ]
      }),
      jsx("input", {
        ref: importInputRef,
        type: "file",
        accept: ".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        className: "hidden",
        onChange: handleImportFile
      }),
      jsxs("div", {
        className: "mt-5 grid gap-3 sm:grid-cols-2",
        children: [
          jsx(SegmentedButton, { active: importMode === "merge", onClick: () => setImportMode("merge"), children: "دمج آمن" }),
          jsx(SegmentedButton, { active: importMode === "replace", danger: true, onClick: () => setImportMode("replace"), children: "استبدال كامل" })
        ]
      }),
      importErrors.length > 0 && jsx("div", {
        className: "mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100",
        children: importErrors.map((error) => jsx("p", { children: error }, error))
      }),
      jsx("div", {
        className: "mt-5",
        children: importPreview
          ? jsx(PreviewSummary, { preview: importPreview })
          : jsxs("div", {
            className: "rounded-xl border border-dashed border-white/10 bg-gray-950/25 p-6 text-center",
            children: [
              jsx(Upload, { className: "mx-auto h-8 w-8 text-gray-500" }),
              jsx("p", { className: "mt-3 text-sm font-medium text-gray-300", children: "لم يتم اختيار ملف بعد" }),
              jsx("p", { className: "mt-1 text-xs text-gray-500", children: "اختر ملفاً لرؤية الجديد والمكرر والمتعارض قبل التنفيذ." }),
              jsx("div", {
                className: "mt-5 grid gap-2 text-right sm:grid-cols-3",
                children: [
                  ["JSON", "نسخ احتياطي أو ملف نقل"],
                  ["Excel", "ملف صادر من التطبيق فقط"],
                  ["آمن", "لا كتابة قبل المعاينة"]
                ].map(([label, detail]) => jsxs("div", {
                  className: "rounded-xl border border-white/5 bg-white/[0.03] p-3",
                  children: [
                    jsx("p", { className: "text-xs font-semibold text-emerald-200", children: label }),
                    jsx("p", { className: "mt-1 text-[11px] leading-5 text-gray-500", children: detail })
                  ]
                }, label))
              })
            ]
          })
      }),
      importPreview && jsxs("div", {
        className: "mt-5 flex flex-wrap items-center gap-3",
        children: [
          jsx(ActionButton, {
            onClick: handleApplyImport,
            disabled: isWorking,
            icon: isWorking ? jsx(RefreshCw, { className: "h-4 w-4 opacity-70" }) : jsx(Shield, { className: "h-4 w-4" }),
            children: importMode === "replace" ? "استبدال بعد النسخ" : "دمج بعد النسخ"
          }),
          importMode === "merge" && planIncomingDelta && jsx("button", {
            type: "button",
            onClick: handleSmartMerge,
            disabled: isWorking,
            className: "min-h-10 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60",
            title: "يكتشف التعارضات بين الأجهزة قبل الدمج",
            children: "دمج ذكي مع كشف التعارضات"
          }),
          jsx("button", {
            type: "button",
            onClick: () => setImportPreview(null),
            className: "min-h-10 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5",
            children: "إلغاء المعاينة"
          })
        ]
      }),
      jsx(SyncConflictDialog, {
        open: conflictDialogOpen,
        conflicts: conflictPlan?.needsReview || [],
        onApply: handleConflictResolve,
        onCancel: () => {
          setConflictDialogOpen(false);
          setConflictPlan(null);
        }
      })
    ]
  });

  const renderTransferPanel = () => jsxs(Fragment, {
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-start justify-between gap-4",
        children: [
          jsxs("div", {
            children: [
              jsx("h3", { className: "text-xl font-bold text-white", children: "نقل بين الأجهزة" }),
              jsx("p", { className: "mt-1 max-w-2xl text-sm leading-relaxed text-gray-400", children: "ملف النقل هو الخيار الموصى به: يحتوي checksum وملخص محتوى ولا ينقل كلمات المرور." })
            ]
          }),
          jsx(ActionButton, {
            onClick: () => handleExport("transfer"),
            disabled: isWorking,
            icon: jsx(HardDrive, { className: "h-4 w-4" }),
            children: "إنشاء ملف نقل"
          })
        ]
      }),
      jsxs("div", {
        className: "mt-5 grid gap-4 md:grid-cols-[1fr_0.9fr]",
        children: [
          jsxs("div", {
            className: "rounded-xl border border-white/5 bg-gray-950/25 p-4",
            children: [
              jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                jsx("h4", { className: "text-sm font-semibold text-white", children: "هوية هذا الجهاز" }),
                deviceId && jsx("span", {
                  className: "rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-200",
                  dir: "ltr",
                  title: deviceId,
                  children: deviceId.split("_").pop().slice(0, 8)
                })
              ] }),
              jsx("input", {
                value: sourceDeviceName,
                onChange: (event) => setSourceDeviceName(event.target.value),
                onBlur: commitDeviceName,
                "aria-label": "اسم الجهاز",
                className: "mt-3 w-full rounded-xl border border-white/10 bg-gray-950/50 px-3 py-2 text-sm text-white",
                placeholder: "مثال: جهاز الأرشفة الرئيسي"
              }),
              jsx("p", { className: "mt-3 text-xs leading-relaxed text-gray-500", children: "هذه الهوية تُضمَّن في كل ملف نقل لتمييز الجهاز المرسل وتُخزّن محلياً فقط. الاسم قابل للتعديل أما المعرّف فثابت." })
            ]
          }),
          jsxs("div", {
            className: "rounded-xl border border-white/5 bg-gray-950/25 p-4",
            children: [
              jsx("h4", { className: "text-sm font-semibold text-white", children: "قائمة تحقق النقل" }),
              jsx("ul", {
                className: "va-rtl-list va-bullet-list mt-3 space-y-2 text-sm text-gray-400",
                children: [
                  "إنشاء نسخة احتياطية قبل الاستيراد.",
                  "التحقق من checksum قبل الكتابة.",
                  "كلمات المرور لا تنتقل بين الأجهزة.",
                  "الدمج الآمن هو الوضع الافتراضي."
                ].map((item) => jsx("li", { children: item }, item))
              })
            ]
          })
        ]
      }),
      jsxs("div", {
        className: "mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4",
        children: [
          jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            jsxs("div", { children: [
              jsx("h4", { className: "text-sm font-semibold text-white", children: "تصدير تغييرات فقط (Delta)" }),
              jsx("p", { className: "mt-1 max-w-xl text-xs leading-relaxed text-gray-400", children: "يصدّر فقط العناصر التي تغيّرت منذ آخر مزامنة مع جهاز محدد. مفيد عند العمل بين جهازين بشكل دوري — أصغر بكثير من النقل الكامل." })
            ] }),
            jsx(ActionButton, {
              onClick: () => handleExport("delta"),
              disabled: isWorking || (!targetPeer && !deltaNewDeviceName.trim()),
              icon: jsx(HardDrive, { className: "h-4 w-4" }),
              children: "إنشاء ملف delta"
            })
          ] }),
          jsxs("div", {
            className: "mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]",
            children: [
              jsxs("label", { className: "block text-xs text-gray-400", children: [
                jsx("span", { className: "block mb-1", children: "اختر جهاز معروف" }),
                jsxs("select", {
                  value: deltaTargetId,
                  onChange: (event) => setDeltaTargetId(event.target.value),
                  className: "min-h-10 w-full rounded-xl border border-white/10 bg-gray-950/50 px-3 text-sm text-white",
                  children: [
                    jsx("option", { value: "", children: "— جديد —" }),
                    ...syncPeerList.map((peer) => jsx("option", { value: peer.deviceId, children: `${peer.deviceName}${peer.lastSentAt ? ` (آخر مزامنة: ${formatDateTime(peer.lastSentAt)})` : ""}` }, peer.deviceId))
                  ]
                })
              ] }),
              !deltaTargetId && jsxs("label", { className: "block text-xs text-gray-400", children: [
                jsx("span", { className: "block mb-1", children: "أو أدخل اسم جهاز جديد" }),
                jsx("input", {
                  value: deltaNewDeviceName,
                  onChange: (event) => setDeltaNewDeviceName(event.target.value),
                  placeholder: "مثال: لابتوب الميدان",
                  className: "min-h-10 w-full rounded-xl border border-white/10 bg-gray-950/50 px-3 text-sm text-white"
                })
              ] }),
              jsxs("div", { className: "flex flex-col items-end justify-end text-right text-xs text-gray-400", children: [
                jsxs("span", { className: "rounded-full border border-white/10 bg-gray-950/45 px-2.5 py-1", children: [
                  "تغييرات معلّقة: ",
                  jsx("strong", { className: "text-emerald-200", children: formatNumber(deltaPlan.total) })
                ] }),
                deltaPlan.total > 0 && jsx("span", { className: "mt-1 text-[11px] text-gray-500", children: `${formatNumber(deltaPlan.newCount)} جديد + ${formatNumber(deltaPlan.updatedCount)} محدّث` })
              ] })
            ]
          }),
          syncPeerList.length === 0 && jsx("p", { className: "mt-3 text-[11px] leading-5 text-gray-500", children: "لا توجد أجهزة محفوظة بعد. أنشئ delta لأول مرة وسيتم حفظ هذا الجهاز كنقطة مرجعية." })
        ]
      })
    ]
  });

  const renderBackupPanel = () => jsxs(Fragment, {
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-start justify-between gap-4",
        children: [
          jsxs("div", {
            children: [
              jsx("h3", { className: "text-xl font-bold text-white", children: "النسخ الاحتياطي" }),
              jsx("p", { className: "mt-1 text-sm leading-relaxed text-gray-400", children: `الجدولة الحالية: ${settings.backupSchedule === "manual" ? "يدوي" : settings.backupSchedule || "يدوي"}، النسخة التالية: ${nextBackupLabel}` })
            ]
          }),
          jsx(ActionButton, {
            onClick: handleCreateBackup,
            disabled: isWorking,
            icon: jsx(Database, { className: "h-4 w-4" }),
            children: "إنشاء نسخة"
          })
        ]
      }),
      backupError && jsxs("div", {
        className: "mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100",
        children: [jsx(TriangleAlert, { className: "mt-0.5 h-4 w-4 shrink-0" }), backupError]
      }),
      jsx("div", {
        className: "mt-5 space-y-3",
        children: backups.length
          ? backups.map((backup) => jsxs("div", {
            className: "grid gap-3 rounded-xl va-surface-subtle border p-4 sm:grid-cols-[1fr_auto]",
            children: [
              jsxs("div", {
                className: "min-w-0",
                children: [
                  jsx("p", { className: "truncate text-sm font-semibold text-white", children: backup.name || backup.id }),
                  jsx("p", { className: "mt-1 text-xs text-gray-500", children: `${backup.timestamp ? formatDateTime(backup.timestamp) : "بدون تاريخ"} - ${formatFileSize(backup.size || 0)} - ${formatNumber(backup.itemCount || 0)} عنصر` })
                ]
              }),
              jsxs("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  jsx("button", {
                    type: "button",
                    onClick: () => handleRestoreBackup(backup),
                    className: "inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-500/20 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/10",
                    children: [jsx(RotateCcw, { className: "h-4 w-4" }), "استعادة"]
                  }),
                  jsx("button", {
                    type: "button",
                    onClick: () => handleDeleteBackup(backup),
                    className: "inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-100 hover:bg-red-500/10",
                    children: [jsx(Trash2, { className: "h-4 w-4" }), "حذف"]
                  })
                ]
              })
            ]
          }, backup.id))
          : jsxs("div", {
            className: "rounded-xl border border-dashed border-white/10 bg-gray-950/25 p-6 text-center",
            children: [
              jsx(Database, { className: "mx-auto h-8 w-8 text-gray-500" }),
              jsx("p", { className: "mt-3 text-sm font-medium text-gray-300", children: "لا توجد نسخ احتياطية بعد" }),
              jsx("p", { className: "mt-1 text-xs text-gray-500", children: "أنشئ نسخة قبل الاستيراد أو النقل أو التعديلات الكبيرة." })
            ]
          })
      })
    ]
  });

  const activePanel = activeTab === "import"
    ? renderImportPanel()
    : activeTab === "transfer"
      ? renderTransferPanel()
      : activeTab === "backup"
        ? renderBackupPanel()
        : renderExportPanel();

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsx(PageHero, {
        icon: jsx(Database, { className: "h-6 w-6 text-emerald-400" }),
        title: "مركز البيانات",
        description: "تدفق واحد للتصدير والاستيراد والنقل والنسخ الاحتياطي، بدون تمرير طويل أو خيارات مبعثرة.",
        actions: jsx(StatusBadge, {
          tone: settings.lastBackupAt ? "emerald" : "amber",
          className: "shrink-0",
          children: jsxs("span", {
            className: "inline-flex items-center gap-1.5",
            children: [
              jsx(Database, { className: "h-3.5 w-3.5" }),
              "آخر نسخة: ",
              settings.lastBackupAt ? formatDateTime(settings.lastBackupAt) : "لم تنشأ بعد"
            ]
          })
        })
      }),
      jsx("section", {
        className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          jsx(DataMetric, { label: "العناصر", value: formatNumber(videoItems.length), hint: `${formatNumber(videoItems.filter((item) => !item.isDeleted).length)} عنصر نشط`, icon: jsx(FileText, { className: "h-5 w-5" }) }),
          jsx(DataMetric, { label: "أنواع المحتوى", value: formatNumber(contentTypes.length), hint: `${formatNumber(hierarchicalTags.length)} وسم هرمي`, icon: jsx(Database, { className: "h-5 w-5" }) }),
          jsx(DataMetric, { label: "المجموعات", value: formatNumber(virtualCollections.length), hint: `${formatNumber(vocabulary.length)} مصطلح`, icon: jsx(HardDrive, { className: "h-5 w-5" }) }),
          jsx(DataMetric, { label: "الحجم المتوقع", value: formatFileSize(estimatedSize), hint: "حسب الفلاتر الحالية", icon: jsx(Download, { className: "h-5 w-5" }) })
        ]
      }),
      jsxs("section", {
        className: "va-control-surface rounded-2xl va-surface-muted border p-4",
        children: [
          jsxs("div", {
            className: "mb-3 flex flex-wrap items-center justify-between gap-3",
            children: [
              jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  jsx(Eye, { className: "h-5 w-5 text-emerald-300" }),
                  jsx("h3", { className: "text-sm font-bold text-white", children: "مسار الأمان قبل العمليات" })
                ]
              }),
              jsx("p", { className: "text-xs text-gray-500", children: "يوضح أين تقف العملية الحالية قبل أي كتابة على البيانات." })
            ]
          }),
          jsx(Stepper, {
            steps: DATA_SAFETY_STEPS,
            activeStepId: activeSafetyStep,
            className: "md:grid-cols-4"
          })
        ]
      }),
      jsxs("section", {
        className: "grid gap-4 lg:grid-cols-[240px_1fr]",
        children: [
          jsxs("aside", {
            className: "va-tab-surface h-fit rounded-2xl border border-white/10 bg-gray-950/55 p-3 backdrop-blur-sm lg:sticky lg:top-4",
            children: [
              jsx("div", {
                // Horizontal scroller below lg, vertical sidebar list at lg+.
                className: "flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible",
                role: "tablist",
                "aria-label": "أقسام مركز البيانات",
                children: DATA_CENTER_TABS.map((tab) => jsx(TabButton, {
                  tab,
                  active: activeTab === tab.id,
                  onClick: () => setActiveTab(tab.id)
                }, tab.id))
              }),
              jsx("div", {
                className: "mt-4 hidden lg:block rounded-xl border border-white/5 bg-gray-900/40 p-3 text-xs leading-relaxed text-gray-500",
                children: "كل عملية حساسة تمر بفحص مبدئي ونسخة احتياطية عند الاستيراد أو الاستعادة."
              })
            ]
          }),
          jsxs(PageCard, {
            className: "min-h-[520px]",
            children: [
              activePanel,
              operationMessage && jsx("div", {
                className: "mt-5 va-surface-deep rounded-xl border p-3 text-sm leading-relaxed text-gray-300",
                children: operationMessage
              })
            ]
          })
        ]
      })
    ]
  });
}

DataCenterPage.pageId = "backup";
DataCenterPage.migrationStatus = "native";

export default DataCenterPage;
