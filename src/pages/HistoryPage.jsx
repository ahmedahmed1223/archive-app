import {
  CirclePlus,
  Clock,
  FileText,
  History,
  PenLine,
  RefreshCw,
  Search,
  Trash2,
  legacyJsxRuntime,
  legacyMotion,
  legacyReact,
  parseAppRoute,
  useAppStore,
  writeAppRoute
} from "../runtime/legacyAdapter.js";
import {
  HISTORY_ACTIONS,
  createHistoryRouteParams,
  formatHistoryValue,
  getFilteredHistoryRecords,
  getHistoryActionCounts,
  getHistoryActionLabel,
  getHistoryActionTone,
  getHistoryRecordTimestamp,
  parseHistoryRouteParams
} from "../features/history/viewModel.js";
import { formatDateTime, formatNumber } from "../utils/formatting.js";

const { jsx, jsxs } = legacyJsxRuntime;
const motion = legacyMotion;

const ACTION_ICON = {
  create: CirclePlus,
  update: PenLine,
  delete: Trash2,
  restore: RefreshCw
};

function toneClasses(tone) {
  if (tone === "emerald") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (tone === "blue") return "border-blue-500/20 bg-blue-500/10 text-blue-200";
  if (tone === "red") return "border-red-500/20 bg-red-500/10 text-red-200";
  if (tone === "amber") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  return "border-white/10 bg-white/5 text-gray-300";
}

function HistoryMetric({ action, label, value, active, onClick }) {
  const Icon = ACTION_ICON[action] || History;
  return jsxs("button", {
    type: "button",
    onClick,
    className: `flex min-h-[92px] items-center gap-3 rounded-2xl border p-4 text-right transition-colors ${active ? toneClasses(getHistoryActionTone(action)) : "border-white/10 bg-gray-900/45 text-gray-300 hover:bg-white/5"}`,
    children: [
      jsx("span", {
        className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses(getHistoryActionTone(action))}`,
        children: jsx(Icon, { className: "h-5 w-5" })
      }),
      jsxs("span", {
        className: "min-w-0",
        children: [
          jsx("span", { className: "block text-xl font-bold text-white", children: formatNumber(value) }),
          jsx("span", { className: "block text-xs text-gray-500", children: label })
        ]
      })
    ]
  });
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return jsxs("div", {
    className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gray-950/35 p-3",
    children: [
      jsx("button", {
        type: "button",
        disabled: page <= 1,
        onClick: () => onChange(page - 1),
        className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40",
        children: "السابق"
      }),
      jsx("p", {
        className: "text-sm text-gray-500",
        children: `الصفحة ${formatNumber(page)} من ${formatNumber(totalPages)}`
      }),
      jsx("button", {
        type: "button",
        disabled: page >= totalPages,
        onClick: () => onChange(page + 1),
        className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40",
        children: "التالي"
      })
    ]
  });
}

function HistoryRecord({ record, itemTitle, index, settings }) {
  const tone = getHistoryActionTone(record.action);
  const Icon = ACTION_ICON[record.action] || History;
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    className: "rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right transition-colors hover:border-emerald-500/25",
    dir: "rtl",
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-start justify-between gap-3",
        children: [
          jsxs("div", {
            className: "flex min-w-0 items-start gap-3",
            children: [
              jsx("span", {
                className: `mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneClasses(tone)}`,
                children: jsx(Icon, { className: "h-4 w-4" })
              }),
              jsxs("div", {
                className: "min-w-0",
                children: [
                  jsxs("div", {
                    className: "flex flex-wrap items-center gap-2",
                    children: [
                      jsx("span", { className: `rounded-full border px-2 py-0.5 text-xs ${toneClasses(tone)}`, children: getHistoryActionLabel(record.action) }),
                      jsx("h3", { className: "truncate text-sm font-semibold text-white", children: itemTitle || record.itemId || "عنصر غير معروف" })
                    ]
                  }),
                  record.field && jsx("p", { className: "mt-1 text-xs text-gray-500", children: `الحقل: ${record.field}` })
                ]
              })
            ]
          }),
          jsx("span", {
            className: "text-xs text-gray-600",
            children: getHistoryRecordTimestamp(record) ? formatDateTime(getHistoryRecordTimestamp(record), settings.numberSystem) : "بدون تاريخ"
          })
        ]
      }),
      record.action === "update" && record.field && jsxs("div", {
        className: "mt-3 grid gap-2 rounded-xl border border-white/5 bg-gray-950/35 p-3 text-xs md:grid-cols-2",
        children: [
          jsxs("div", { className: "min-w-0", children: [
            jsx("p", { className: "mb-1 text-red-300", children: "القيمة السابقة" }),
            jsx("p", { className: "truncate font-mono text-gray-500", dir: "ltr", children: formatHistoryValue(record.oldValue) })
          ] }),
          jsxs("div", { className: "min-w-0", children: [
            jsx("p", { className: "mb-1 text-emerald-300", children: "القيمة الجديدة" }),
            jsx("p", { className: "truncate font-mono text-gray-500", dir: "ltr", children: formatHistoryValue(record.newValue) })
          ] })
        ]
      })
    ]
  }, record.id || `${record.action}-${record.itemId}-${record.timestamp}`);
}

export function HistoryPage() {
  const {
    changeHistory = [],
    videoItems = [],
    settings = {},
    clearHistory,
    showToast
  } = useAppStore();

  const initialRouteState = legacyReact.useMemo(() => parseHistoryRouteParams(parseAppRoute().params), []);
  const [query, setQuery] = legacyReact.useState(initialRouteState.query);
  const [action, setAction] = legacyReact.useState(initialRouteState.action);
  const [page, setPage] = legacyReact.useState(initialRouteState.page);
  const [pageSize, setPageSize] = legacyReact.useState(initialRouteState.pageSize);
  const skipPageReset = legacyReact.useRef(true);

  const itemTitleById = legacyReact.useMemo(() => new Map(videoItems.map((item) => [item.id, item.title || item.id])), [videoItems]);
  const counts = legacyReact.useMemo(() => getHistoryActionCounts(changeHistory), [changeHistory]);
  const filteredRecords = legacyReact.useMemo(() => getFilteredHistoryRecords({
    changeHistory,
    query,
    action,
    itemTitleById
  }), [action, changeHistory, itemTitleById, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  legacyReact.useEffect(() => {
    const applyRouteState = () => {
      const next = parseHistoryRouteParams(parseAppRoute().params);
      setQuery(next.query);
      setAction(next.action);
      setPage(next.page);
      setPageSize(next.pageSize);
    };
    window.addEventListener("hashchange", applyRouteState);
    window.addEventListener("popstate", applyRouteState);
    return () => {
      window.removeEventListener("hashchange", applyRouteState);
      window.removeEventListener("popstate", applyRouteState);
    };
  }, []);

  legacyReact.useEffect(() => {
    const handle = window.setTimeout(() => {
      writeAppRoute("history", {
        params: createHistoryRouteParams({ query, action, page: currentPage, pageSize })
      }, settings, true);
    }, 120);
    return () => window.clearTimeout(handle);
  }, [action, currentPage, pageSize, query, settings]);

  legacyReact.useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setPage(1);
  }, [action, pageSize, query]);

  legacyReact.useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  const handleClearHistory = async () => {
    if (!window.confirm("هل تريد مسح سجل التغييرات بالكامل؟ لا يمكن التراجع عن هذه العملية.")) return;
    try {
      if (typeof clearHistory === "function") await clearHistory();
      else showToast?.("تعذر العثور على إجراء مسح السجل", "error");
    } catch (error) {
      showToast?.("تعذر مسح سجل التغييرات", "error");
    }
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
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
                  jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(History, { className: "h-6 w-6 text-emerald-400" }), "سجل التغييرات"] }),
                  jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "مراجعة عمليات الإنشاء والتحديث والحذف والاستعادة مع بحث مباشر وروابط تحفظ حالة الفلترة." })
                ]
              }),
              changeHistory.length > 0 && jsx("button", {
                type: "button",
                onClick: handleClearHistory,
                className: "inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15",
                children: [jsx(Trash2, { className: "h-4 w-4" }), "مسح السجل"]
              })
            ]
          })
        ]
      }),
      jsx("section", {
        className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-5",
        children: [
          jsx(HistoryMetric, { action: "all", label: "كل النشاط", value: counts.all || 0, active: action === "all", onClick: () => setAction("all") }, "all"),
          ...HISTORY_ACTIONS.map((item) => jsx(HistoryMetric, {
            action: item.id,
            label: item.label,
            value: counts[item.id] || 0,
            active: action === item.id,
            onClick: () => setAction(item.id)
          }, item.id))
        ]
      }),
      jsxs("section", {
        className: "rounded-2xl border border-white/10 bg-gray-900/45 p-4",
        children: [
          jsxs("div", {
            className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]",
            children: [
              jsxs("label", {
                className: "relative block",
                children: [
                  jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
                  jsx("input", {
                    value: query,
                    onChange: (event) => setQuery(event.target.value),
                    placeholder: "ابحث باسم العنصر أو الحقل أو القيمة...",
                    className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40"
                  })
                ]
              }),
              jsx("select", {
                value: action,
                onChange: (event) => setAction(event.target.value),
                className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none",
                children: [
                  jsx("option", { value: "all", children: "كل الإجراءات" }),
                  ...HISTORY_ACTIONS.map((item) => jsx("option", { value: item.id, children: item.label }, item.id))
                ]
              }),
              jsx("select", {
                value: pageSize,
                onChange: (event) => setPageSize(Number(event.target.value)),
                className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none",
                children: [20, 50, 100].map((size) => jsx("option", { value: size, children: `${size} سجل` }, size))
              })
            ]
          }),
          jsx("p", { className: "mt-3 text-xs text-gray-500", children: `${formatNumber(filteredRecords.length, settings.numberSystem)} نتيجة من ${formatNumber(changeHistory.length, settings.numberSystem)} سجل` })
        ]
      }),
      visibleRecords.length ? jsx("section", {
        className: "space-y-3",
        children: visibleRecords.map((record, index) => jsx(HistoryRecord, {
          record,
          itemTitle: itemTitleById.get(record.itemId),
          index,
          settings
        }, record.id || `${record.itemId}-${record.timestamp}-${index}`))
      }) : jsxs("section", {
        className: "rounded-2xl border border-dashed border-white/10 bg-gray-900/35 p-10 text-center",
        children: [
          jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-600" }),
          jsx("h2", { className: "mt-3 text-lg font-bold text-white", children: changeHistory.length ? "لا توجد نتائج مطابقة" : "لا توجد تغييرات مسجلة" }),
          jsx("p", { className: "mt-2 text-sm text-gray-500", children: changeHistory.length ? "خفف البحث أو اختر كل الإجراءات لعرض السجل." : "ستظهر هنا عمليات الإنشاء والتعديل والحذف بعد استخدام الأرشيف." })
        ]
      }),
      jsx(Pagination, { page: currentPage, totalPages, onChange: setPage }),
      jsxs("p", { className: "flex items-center gap-2 text-xs text-gray-600", children: [jsx(Clock, { className: "h-3.5 w-3.5" }), "السجل يعرض بيانات محلية محفوظة داخل هذا الجهاز."] })
    ]
  });
}

HistoryPage.pageId = "history";
HistoryPage.migrationStatus = "native";

export default HistoryPage;
