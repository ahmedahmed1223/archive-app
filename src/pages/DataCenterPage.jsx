import {
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Shield,
  Trash2,
  TriangleAlert,
  Upload,
  dbGetAll,
  importNormalizedPayload,
  legacyJsxRuntime,
  legacyReact,
  legacyXlsx,
  normalizeBackupData,
  runOperationPreflight,
  STORES,
  useAppStore
} from "../runtime/legacyAdapter.js";
import { appConfirm } from "../components/common/ConfirmDialog.js";
import {
  DATA_CENTER_TABS
} from "../features/data-center/tabs.js";
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
  formatDateTime,
  formatFileSize,
  formatNumber
} from "../utils/formatting.js";

const { Fragment, jsx, jsxs } = legacyJsxRuntime;

const tabIconMap = {
  export: Download,
  import: Upload,
  transfer: RefreshCw,
  backup: HardDrive
};

const sourceTypeLabels = {
  json: "ملف JSON",
  excel: "ملف Excel صادر من التطبيق",
  transfer: "ملف نقل بين الأجهزة"
};

function PageCard({ children, className = "" }) {
  return jsx("section", {
    className: `rounded-2xl border border-white/10 bg-gray-900/50 p-5 text-right backdrop-blur-sm ${className}`,
    dir: "rtl",
    children
  });
}

function DataMetric({ label, value, hint, icon }) {
  return jsxs(PageCard, {
    className: "min-h-[116px]",
    children: [
      jsxs("div", {
        className: "flex items-start justify-between gap-3",
        children: [
          jsxs("div", {
            className: "min-w-0",
            children: [
              jsx("p", { className: "text-sm text-gray-400", children: label }),
              jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: value }),
              hint && jsx("p", { className: "mt-2 text-xs leading-relaxed text-gray-500", children: hint })
            ]
          }),
          jsx("span", {
            className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
            children: icon
          })
        ]
      })
    ]
  });
}

function TabButton({ tab, active, onClick }) {
  const Icon = tabIconMap[tab.id] || Database;
  return jsxs("button", {
    type: "button",
    role: "tab",
    "aria-selected": active,
    onClick,
    className: `flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-right text-sm transition-colors ${
      active
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
        : "border-white/5 bg-gray-900/40 text-gray-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
    }`,
    children: [
      jsx(Icon, { className: "h-4 w-4 shrink-0" }),
      jsx("span", { className: "min-w-0 truncate", children: tab.label })
    ]
  });
}

function SegmentedButton({ active, children, onClick, danger = false }) {
  return jsx("button", {
    type: "button",
    onClick,
    className: `min-h-10 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? danger
          ? "border-red-500/40 bg-red-500/15 text-red-100"
          : "border-emerald-500/35 bg-emerald-500/15 text-emerald-100"
        : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5 hover:text-white"
    }`,
    children
  });
}

function ActionButton({ children, icon, onClick, disabled = false, tone = "emerald" }) {
  const toneClass = tone === "amber"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
    : tone === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
      : "border-emerald-500/30 bg-emerald-600/90 text-white hover:bg-emerald-500";
  return jsxs("button", {
    type: "button",
    onClick,
    disabled,
    className: `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`,
    children: [
      icon,
      children
    ]
  });
}

function SummaryGrid({ rows }) {
  return jsx("div", {
    className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
    children: rows.map((item) => jsxs("div", {
      className: "rounded-xl border border-white/5 bg-gray-950/35 p-3",
      children: [
        jsx("p", { className: "text-xs text-gray-500", children: item.label }),
        jsx("p", { className: "mt-1 text-sm font-semibold text-gray-100", children: String(item.value) })
      ]
    }, item.label))
  });
}

function PreviewSummary({ preview }) {
  if (!preview) return null;
  const visibleEntities = preview.summary.entities.filter((entity) => entity.total > 0 || entity.conflictCount > 0 || entity.potentialDuplicateCount > 0);
  return jsxs("div", {
    className: "space-y-3",
    children: [
      jsxs("div", {
        className: "rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4",
        children: [
          jsx("p", { className: "text-sm font-semibold text-emerald-100", children: "تمت قراءة الملف بنجاح" }),
          jsxs("p", {
            className: "mt-1 text-xs leading-relaxed text-emerald-200/80",
            children: [
              preview.fileName,
              " - ",
              sourceTypeLabels[preview.sourceType] || "ملف بيانات",
              preview.packageInfo?.checksum ? ` - checksum ${String(preview.packageInfo.checksum).slice(0, 16)}...` : ""
            ]
          })
        ]
      }),
      jsx("div", {
        className: "grid gap-2 sm:grid-cols-2",
        children: [
          ["كل السجلات", preview.summary.totals.records],
          ["جديد", preview.summary.totals.newCount],
          ["مكرر", preview.summary.totals.duplicateCount],
          ["متعارض", preview.summary.totals.conflictCount]
        ].map(([label, value]) => jsxs("div", {
          className: "rounded-xl border border-white/5 bg-gray-950/35 p-3",
          children: [
            jsx("p", { className: "text-xs text-gray-500", children: label }),
            jsx("p", { className: "mt-1 text-xl font-bold text-white", children: formatNumber(value) })
          ]
        }, label))
      }),
      visibleEntities.length > 0 && jsx("div", {
        className: "max-h-[260px] overflow-auto rounded-xl border border-white/5",
        children: visibleEntities.map((entity) => jsxs("div", {
          className: "grid gap-2 border-b border-white/5 bg-gray-950/25 p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]",
          children: [
            jsx("span", { className: "font-medium text-gray-200", children: entity.label }),
            jsx("span", {
              className: "text-gray-400",
              children: `الإجمالي ${entity.total} | جديد ${entity.newCount} | مكرر ${entity.duplicateCount} | متعارض ${entity.conflictCount}`
            })
          ]
        }, entity.key))
      })
    ]
  });
}

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
    showToast
  } = useAppStore();

  const [activeTab, setActiveTabState] = legacyReact.useState(settings.ui?.lastDataCenterTab || "export");
  const [typeFilter, setTypeFilter] = legacyReact.useState("all");
  const [collectionFilter, setCollectionFilter] = legacyReact.useState("all");
  const [favoritesOnly, setFavoritesOnly] = legacyReact.useState(false);
  const [selectedFormat, setSelectedFormat] = legacyReact.useState("json");
  const [importMode, setImportModeState] = legacyReact.useState(settings.ui?.lastImportMode || settings.ui?.transferLastMode || "merge");
  const [sourceDeviceName, setSourceDeviceName] = legacyReact.useState(() => typeof navigator !== "undefined" ? navigator.platform || "هذا الجهاز" : "هذا الجهاز");
  const [isWorking, setIsWorking] = legacyReact.useState(false);
  const [operationMessage, setOperationMessage] = legacyReact.useState("");
  const [importPreview, setImportPreview] = legacyReact.useState(null);
  const [importErrors, setImportErrors] = legacyReact.useState([]);
  const [backups, setBackups] = legacyReact.useState([]);
  const [backupError, setBackupError] = legacyReact.useState("");
  const importInputRef = legacyReact.useRef(null);

  const exportOptions = legacyReact.useMemo(() => createDataCenterExportFilters({
    typeFilter,
    collectionFilter,
    favoritesOnly
  }), [typeFilter, collectionFilter, favoritesOnly]);

  const exportPayload = legacyReact.useMemo(() => {
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

  const estimatedSize = legacyReact.useMemo(() => {
    if (typeof estimateExportSize === "function") return estimateExportSize(exportOptions);
    return new Blob([JSON.stringify(exportPayload)]).size;
  }, [estimateExportSize, exportOptions, exportPayload]);

  const exportSummary = legacyReact.useMemo(() => createDataCenterExportSummary({
    data: exportPayload,
    estimatedSize,
    filters: { typeFilter, collectionFilter, favoritesOnly },
    formatFileSize
  }), [collectionFilter, estimatedSize, exportPayload, favoritesOnly, typeFilter]);

  const nextBackup = getNextBackupTime(settings.backupSchedule, settings.lastBackupAt);
  const nextBackupLabel = formatTimeUntilBackup(nextBackup) || "يدوي";

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    Promise.resolve(updateSettings?.({ ui: { ...(settings.ui || {}), lastDataCenterTab: tabId } })).catch(() => {});
  };

  const setImportMode = (mode) => {
    setImportModeState(mode);
    Promise.resolve(updateSettings?.({ ui: { ...(settings.ui || {}), lastImportMode: mode, transferLastMode: mode } })).catch(() => {});
  };

  const loadBackups = legacyReact.useCallback(async () => {
    try {
      setBackupError("");
      const rows = await dbGetAll(STORES.BACKUPS);
      setBackups(rows.slice().sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));
    } catch (error) {
      setBackupError(error?.message || "تعذر تحميل النسخ الاحتياطية");
    }
  }, []);

  legacyReact.useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  legacyReact.useEffect(() => {
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
        const { workbook, checksum } = createArchiveExcelWorkbook(legacyXlsx, {
          ...useAppStore.getState(),
          ...exportPayload
        });
        legacyXlsx.writeFile(workbook, makeFileName("video-archive-report", "xlsx"));
        setOperationMessage(`تم إنشاء ملف Excel متعدد الأوراق. checksum ${checksum}`);
      } else if (kind === "csv") {
        const csvFiles = createArchiveCsvExportFiles(exportPayload);
        csvFiles.forEach((file) => {
          downloadArchiveBlob(new Blob([rowsToCsv(file.rows)], { type: "text/csv;charset=utf-8" }), makeFileName(`video-archive-${file.slug}`, "csv"));
        });
        setOperationMessage(`تم تنزيل ${csvFiles.length} ملفات CSV.`);
      } else if (kind === "transfer") {
        const transferPackage = createTransferPackage({
          ...useAppStore.getState(),
          ...exportPayload
        }, sourceDeviceName.trim() || "هذا الجهاز");
        downloadArchiveBlob(new Blob([JSON.stringify(transferPackage, null, 2)], { type: "application/json;charset=utf-8" }), makeFileName("video-archive-transfer", "json"));
        setOperationMessage(`تم إنشاء ملف نقل آمن. checksum ${transferPackage.checksum}`);
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
        loadXlsx: async () => legacyXlsx,
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
            icon: isWorking ? jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }) : jsx(Download, { className: "h-4 w-4" }),
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
            className: "flex min-h-[66px] items-center gap-3 rounded-xl border border-white/10 bg-gray-950/35 px-3 py-2 text-sm text-gray-300",
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
              jsx("p", { className: "mt-1 text-xs text-gray-500", children: "اختر ملفاً لرؤية الجديد والمكرر والمتعارض قبل التنفيذ." })
            ]
          })
      }),
      importPreview && jsxs("div", {
        className: "mt-5 flex flex-wrap items-center gap-3",
        children: [
          jsx(ActionButton, {
            onClick: handleApplyImport,
            disabled: isWorking,
            icon: isWorking ? jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }) : jsx(Shield, { className: "h-4 w-4" }),
            children: importMode === "replace" ? "استبدال بعد النسخ" : "دمج بعد النسخ"
          }),
          jsx("button", {
            type: "button",
            onClick: () => setImportPreview(null),
            className: "min-h-10 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5",
            children: "إلغاء المعاينة"
          })
        ]
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
        className: "mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]",
        children: [
          jsxs("div", {
            className: "rounded-xl border border-white/5 bg-gray-950/25 p-4",
            children: [
              jsx("h4", { className: "text-sm font-semibold text-white", children: "اسم الجهاز المصدر" }),
              jsx("input", {
                value: sourceDeviceName,
                onChange: (event) => setSourceDeviceName(event.target.value),
                className: "mt-3 w-full rounded-xl border border-white/10 bg-gray-950/50 px-3 py-2 text-sm text-white",
                placeholder: "مثال: جهاز الأرشفة الرئيسي"
              }),
              jsx("p", { className: "mt-3 text-xs leading-relaxed text-gray-500", children: "عند الاستيراد في الجهاز الآخر استخدم تبويب الاستيراد، وسيظهر فحص checksum والمعاينة قبل الدمج." })
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
            className: "grid gap-3 rounded-xl border border-white/5 bg-gray-950/30 p-4 sm:grid-cols-[1fr_auto]",
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

  return jsxs("div", {
    className: "space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsxs("section", {
        className: "rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10",
        children: [
          jsxs("div", {
            className: "flex flex-wrap items-start justify-between gap-4",
            children: [
              jsxs("div", {
                className: "min-w-0",
                children: [
                  jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Database, { className: "h-6 w-6 text-emerald-400" }), "مركز البيانات"] }),
                  jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "تدفق واحد للتصدير والاستيراد والنقل والنسخ الاحتياطي، بدون تمرير طويل أو خيارات مبعثرة." })
                ]
              }),
              jsxs("div", {
                className: "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100",
                children: ["آخر نسخة: ", settings.lastBackupAt ? formatDateTime(settings.lastBackupAt) : "لم تنشأ بعد"]
              })
            ]
          })
        ]
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
        className: "grid gap-4 xl:grid-cols-[260px_1fr]",
        children: [
          jsxs("aside", {
            className: "h-fit rounded-2xl border border-white/10 bg-gray-950/55 p-3 backdrop-blur-sm xl:sticky xl:top-4",
            children: [
              jsx("div", {
                className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-1",
                role: "tablist",
                "aria-label": "أقسام مركز البيانات",
                children: DATA_CENTER_TABS.map((tab) => jsx(TabButton, {
                  tab,
                  active: activeTab === tab.id,
                  onClick: () => setActiveTab(tab.id)
                }, tab.id))
              }),
              jsx("div", {
                className: "mt-4 rounded-xl border border-white/5 bg-gray-900/40 p-3 text-xs leading-relaxed text-gray-500",
                children: "كل عملية حساسة تمر بفحص مبدئي ونسخة احتياطية عند الاستيراد أو الاستعادة."
              })
            ]
          }),
          jsxs(PageCard, {
            className: "min-h-[520px]",
            children: [
              activePanel,
              operationMessage && jsx("div", {
                className: "mt-5 rounded-xl border border-white/10 bg-gray-950/45 p-3 text-sm leading-relaxed text-gray-300",
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
