import {
  useTheme
} from "../theme/useTheme.js";
import {
  formatDateTime,
  formatNumber
} from "../utils/formatting.js";
import {
  useAppStore,
  useAuthStore
} from "../stores/index.js";
import {
  Archive,
  Bell,
  CircleQuestionMark,
  Database,
  HardDrive,
  Keyboard,
  LayoutGrid,
  Lightbulb,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Tags,
  TriangleAlert,
  Users,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import {
  SETTINGS_TABS
} from "../features/settings/settingsTabs.js";
import {
  createSettingsTabUiPatch,
  getSettingsTabState,
  normalizeSettingsTab
} from "../features/settings/viewModel.js";
import {
  SHORTCUT_ACTIONS,
  SHORTCUT_DISABLED,
  findShortcutConflict,
  getDefaultKeyboardShortcuts,
  getEffectiveKeyboardShortcuts,
  getShortcutConflictDetails
} from "../features/settings/keyboardShortcuts.js";
import {
  getDefaultSettings,
  mergeAppSettings
} from "../utils/settings.js";

const THEME_OPTIONS = [
  { value: "dark", label: "ليلي حبري", detail: "Ink Slate للعمل الطويل" },
  { value: "light", label: "نهاري دافئ", detail: "Warm Off-white للقراءة" },
  { value: "system", label: "حسب النظام", detail: "يتبع المتصفح" }
];

const ACCENT_OPTIONS = [
  { value: "teal", label: "فيروزي هادئ", color: "#14b8a6" },
  { value: "indigo", label: "نيلي هادئ", color: "#6366f1" },
  { value: "emerald", label: "زمردي", color: "#10b981" },
  { value: "blue", label: "أزرق", color: "#3b82f6" },
  { value: "rose", label: "وردي", color: "#f43f5e" }
];

const TAB_ICONS = {
  general: Lightbulb,
  interface: Sparkles,
  icons: LayoutGrid,
  smart: Tags,
  data: HardDrive,
  security: ShieldCheck,
  shortcuts: Keyboard,
  maintenance: Database
};

const VIEW_OPTIONS = [
  { value: "grid", label: "شبكة", detail: "بطاقات ومعاينة" },
  { value: "list", label: "قائمة", detail: "تفاصيل أكثر" },
  { value: "table", label: "جدول", detail: "كثافة عالية" }
];

const DENSITY_OPTIONS = [
  { value: "comfortable", label: "مريحة", detail: "مساحات أوضح" },
  { value: "compact", label: "مضغوطة", detail: "بيانات أكثر" }
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SettingsCard({ title, description, icon, children, aside }) {
  return jsxs("section", {
    className: "rounded-2xl border border-white/10 bg-gray-900/50 p-4 text-right shadow-xl shadow-black/5 backdrop-blur-sm",
    dir: "rtl",
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-start justify-between gap-3",
        children: [
          jsxs("div", {
            className: "min-w-0",
            children: [
              jsxs("h2", {
                className: "flex items-center gap-2 text-base font-bold text-white",
                children: [
                  icon,
                  title
                ]
              }),
              description && jsx("p", { className: "mt-1 text-sm leading-relaxed text-gray-500", children: description })
            ]
          }),
          aside
        ]
      }),
      jsx("div", { className: "mt-4 space-y-3", children })
    ]
  });
}

function SegmentedChoices({ label, value, options, onChange, columns = "sm:grid-cols-3" }) {
  return jsxs("div", {
    className: "space-y-2",
    children: [
      jsx("p", { className: "text-sm font-medium text-gray-300", children: label }),
      jsx("div", {
        className: cx("grid gap-2", columns),
        role: "group",
        "aria-label": label,
        children: options.map((option) => {
          const selected = value === option.value;
          return jsxs("button", {
            type: "button",
            onClick: () => onChange(option.value),
            className: cx(
              "min-h-16 rounded-xl border px-3 py-2 text-right transition-colors",
              selected
                ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5 hover:text-white"
            ),
            "aria-pressed": selected,
            children: [
              jsx("span", { className: "block text-sm font-semibold", children: option.label }),
              option.detail && jsx("span", { className: "mt-1 block text-xs text-gray-500", children: option.detail })
            ]
          }, option.value);
        })
      })
    ]
  });
}

function ToggleRow({ label, description, checked, onChange }) {
  return jsxs("button", {
    type: "button",
    onClick: () => onChange(!checked),
    className: "flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-950/30 p-3 text-right transition-colors hover:bg-white/[0.04]",
    "aria-pressed": checked,
    children: [
      jsxs("span", {
        className: "min-w-0",
        children: [
          jsx("span", { className: "block text-sm font-semibold text-white", children: label }),
          description && jsx("span", { className: "mt-1 block text-xs leading-relaxed text-gray-500", children: description })
        ]
      }),
      jsx("span", {
        className: cx(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-emerald-400/40 bg-emerald-500" : "border-white/15 bg-gray-800"
        ),
        children: jsx("span", {
          className: cx(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "right-6" : "right-1"
          )
        })
      })
    ]
  });
}

function SelectRow({ label, value, options, onChange, description }) {
  return jsxs("label", {
    className: "block rounded-xl border border-white/10 bg-gray-950/30 p-3",
    children: [
      jsx("span", { className: "block text-sm font-semibold text-white", children: label }),
      description && jsx("span", { className: "mt-1 block text-xs leading-relaxed text-gray-500", children: description }),
      jsx("select", {
        value,
        onChange: (event) => onChange(event.target.value),
        className: "mt-3 min-h-10 w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50",
        children: options.map((option) => jsx("option", { value: option.value, children: option.label }, option.value))
      })
    ]
  });
}

function TextInputRow({ label, value, onChange, description, dir = "rtl", placeholder = "", type = "text" }) {
  return jsxs("label", {
    className: "block rounded-xl border border-white/10 bg-gray-950/30 p-3",
    children: [
      jsx("span", { className: "block text-sm font-semibold text-white", children: label }),
      description && jsx("span", { className: "mt-1 block text-xs leading-relaxed text-gray-500", children: description }),
      jsx("input", {
        type,
        value,
        onChange: (event) => onChange(event.target.value),
        placeholder,
        dir,
        className: "mt-3 min-h-10 w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
      })
    ]
  });
}

function ColorChoices({ value, onChange }) {
  return jsxs("div", {
    className: "space-y-2",
    children: [
      jsx("p", { className: "text-sm font-medium text-gray-300", children: "لون التمييز" }),
      jsx("div", {
        className: "grid gap-2 sm:grid-cols-5",
        children: ACCENT_OPTIONS.map((option) => {
          const selected = value === option.value;
          return jsxs("button", {
            type: "button",
            onClick: () => onChange(option.value),
            className: cx(
              "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
              selected ? "border-transparent text-white" : "border-white/10 bg-gray-950/35 text-gray-300 hover:bg-white/5"
            ),
            style: selected ? { backgroundColor: option.color } : undefined,
            children: [
              jsx("span", { className: "h-3.5 w-3.5 rounded-full border border-white/50", style: { backgroundColor: option.color } }),
              option.label
            ]
          }, option.value);
        })
      })
    ]
  });
}

function SettingsTabs({ activeTab, onTabChange }) {
  return jsx("nav", {
    className: "rounded-2xl border border-white/10 bg-gray-950/70 p-2 backdrop-blur-xl xl:sticky xl:top-4",
    "aria-label": "تبويبات الإعدادات",
    dir: "rtl",
    children: jsx("div", {
      className: "grid gap-1 sm:grid-cols-2 xl:grid-cols-1",
      role: "tablist",
      children: SETTINGS_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id] || CircleQuestionMark;
        const selected = activeTab === tab.id;
        return jsxs("button", {
          type: "button",
          role: "tab",
          "aria-selected": selected,
          onClick: () => onTabChange(tab.id),
          className: cx(
            "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-right text-sm transition-colors",
            selected ? "bg-emerald-500/15 text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white"
          ),
          children: [
            jsx(Icon, { className: "h-4 w-4 shrink-0" }),
            jsx("span", { className: "truncate", children: tab.label })
          ]
        }, tab.id);
      })
    })
  });
}

function ShortcutManager({ settings, onSave, showToast }) {
  const effectiveShortcuts = React.useMemo(() => getEffectiveKeyboardShortcuts(settings), [settings]);
  const shortcutConflicts = React.useMemo(() => getShortcutConflictDetails(effectiveShortcuts), [effectiveShortcuts]);
  const categories = React.useMemo(() => [...new Set(SHORTCUT_ACTIONS.map((action) => action.category))], []);

  const updateShortcut = (action, value) => {
    const conflict = findShortcutConflict(effectiveShortcuts, action.id, value);
    if (conflict) {
      showToast?.(`الاختصار ${value} مستخدم بالفعل في "${conflict.label}". اختر اختصاراً آخر أو عطّل السابق.`, "warning");
      return;
    }
    onSave({ keyboardShortcuts: { ...effectiveShortcuts, [action.id]: value } }, "تم تحديث الاختصار");
  };

  const disableAll = () => {
    onSave({
      keyboardShortcuts: Object.fromEntries(SHORTCUT_ACTIONS.map((action) => [action.id, SHORTCUT_DISABLED]))
    }, "تم تعطيل كل الاختصارات");
  };

  const restoreDefaults = () => {
    onSave({ keyboardShortcuts: getDefaultKeyboardShortcuts() }, "تمت استعادة الاختصارات الافتراضية");
  };

  return jsxs("div", {
    className: "space-y-4",
    children: [
      jsxs("div", {
        className: "flex flex-wrap items-center justify-between gap-2",
        children: [
          Object.keys(shortcutConflicts).length > 0 ? jsxs("p", {
            className: "inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200",
            children: [
              jsx(TriangleAlert, { className: "h-4 w-4" }),
              `يوجد ${formatNumber(Object.keys(shortcutConflicts).length)} تعارض`
            ]
          }) : jsx("p", { className: "text-sm text-gray-500", children: "كل الاختصارات الحالية بدون تعارض." }),
          jsxs("div", {
            className: "flex flex-wrap gap-2",
            children: [
              jsx("button", { type: "button", onClick: restoreDefaults, className: "rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5", children: "استعادة الافتراضيات" }),
              jsx("button", { type: "button", onClick: disableAll, className: "rounded-xl border border-amber-500/20 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/10", children: "تعطيل الكل" })
            ]
          })
        ]
      }),
      jsx("div", {
        className: "space-y-4",
        children: categories.map((category) => jsxs("section", {
          className: "rounded-2xl border border-white/10 bg-gray-950/30 p-3",
          children: [
            jsx("h3", { className: "text-sm font-bold text-white", children: category }),
            jsx("div", {
              className: "mt-3 space-y-2",
              children: SHORTCUT_ACTIONS.filter((action) => action.category === category).map((action) => {
                const conflict = shortcutConflicts[action.id];
                return jsxs("div", {
                  className: cx(
                    "grid gap-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_220px]",
                    conflict ? "border-red-500/25 bg-red-500/5" : "border-white/10 bg-gray-900/40"
                  ),
                  children: [
                    jsxs("div", {
                      className: "min-w-0",
                      children: [
                        jsx("p", { className: "text-sm font-semibold text-white", children: action.label }),
                        conflict && jsx("p", { className: "mt-1 text-xs text-red-300", children: `يتعارض مع: ${conflict.label}` })
                      ]
                    }),
                    jsx("select", {
                      value: effectiveShortcuts[action.id] || action.defaultKeys || SHORTCUT_DISABLED,
                      onChange: (event) => updateShortcut(action, event.target.value),
                      className: "min-h-10 rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50",
                      dir: "ltr",
                      children: action.options.map((option) => jsx("option", { value: option, children: option === SHORTCUT_DISABLED ? "معطّل" : option }, option))
                    })
                  ]
                }, action.id);
              })
            })
          ]
        }, category))
      })
    ]
  });
}

export function SettingsPage() {
  const {
    settings: rawSettings = {},
    updateSettings,
    setMasterPassword,
    isPasswordSet,
    unlockApp,
    lockApp,
    runSystemHealthCheck,
    sqliteReady,
    sqliteError,
    showToast,
    setCurrentPage
  } = useAppStore();
  const authStore = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const settings = React.useMemo(() => mergeAppSettings(getDefaultSettings(), rawSettings), [rawSettings]);
  const [activeTab, setActiveTabState] = React.useState(normalizeSettingsTab(settings.ui?.lastSettingsTab || "general"));
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [healthRunning, setHealthRunning] = React.useState(false);
  const tabState = getSettingsTabState(activeTab);
  const isDark = resolvedTheme === "dark";

  const saveSettings = React.useCallback(async (patch, successMessage) => {
    const ok = await updateSettings?.(patch);
    if (ok !== false && successMessage) showToast?.(successMessage, "success");
    return ok;
  }, [showToast, updateSettings]);

  const patchUi = (uiPatch, message) => saveSettings({ ui: { ...(settings.ui || {}), ...uiPatch } }, message);

  const setActiveTab = (tabId) => {
    const normalized = normalizeSettingsTab(tabId);
    setActiveTabState(normalized);
    updateSettings?.(createSettingsTabUiPatch(settings, normalized));
  };

  const updateTheme = (value) => {
    setTheme?.(value);
    saveSettings({
      theme: value,
      ui: { ...(settings.ui || {}), onboardingThemeChoice: value }
    }, "تم تحديث المظهر");
  };

  const updateAutocompleteTrigger = (key, value) => {
    const nextValue = String(value || "").trim().slice(0, 2) || (key === "vocabulary" ? "@" : "#");
    const nextTriggers = { ...(settings.autocompleteTriggers || {}), [key]: nextValue };
    if (nextTriggers.vocabulary === nextTriggers.tags) {
      showToast?.("لا يمكن استخدام نفس الرمز للقاموس والوسوم.", "warning");
      return;
    }
    saveSettings({ autocompleteTriggers: nextTriggers }, "تم تحديث الاستدعاء الذكي");
  };

  const openOnboardingWizard = () => {
    patchUi({ onboardingReplayRequestedAt: new Date().toISOString() });
    window.dispatchEvent(new CustomEvent("videoarchive:onboarding-open", { detail: { mode: "replay" } }));
    showToast?.("تم فتح معالج البداية للمراجعة.", "info");
  };

  const handlePasswordSave = async () => {
    setPasswordError("");
    if (isPasswordSet) {
      if (!oldPassword) {
        setPasswordError("أدخل كلمة المرور الحالية أولاً.");
        return;
      }
      if (!unlockApp?.(oldPassword)) {
        setPasswordError("كلمة المرور الحالية غير صحيحة.");
        return;
      }
    }
    if (newPassword.length < 6) {
      setPasswordError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }
    await setMasterPassword?.(newPassword);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast?.("تم تحديث كلمة مرور المدير.", "success");
  };

  const runHealth = async () => {
    setHealthRunning(true);
    try {
      await runSystemHealthCheck?.();
      showToast?.("اكتمل فحص النظام.", "success");
    } finally {
      setHealthRunning(false);
    }
  };

  const renderGeneral = () => jsxs("div", {
    className: "space-y-4",
    children: [
      jsx(SettingsCard, {
        title: "بداية الإصدار الأول",
        description: "شغّل المعالج من جديد لتدريب مستخدم جديد أو مراجعة الحماية والمظهر وشرح الواجهة.",
        icon: jsx(Sparkles, { className: "h-5 w-5 text-emerald-400" }),
        aside: jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200", children: settings.ui?.v1OnboardingCompleted ? "مكتمل" : "لم يكتمل" }),
        children: jsxs("div", {
          className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]",
          children: [
            jsxs("div", {
              className: "rounded-xl border border-white/10 bg-gray-950/30 p-3",
              children: [
                jsx("p", { className: "text-sm text-gray-300", children: settings.ui?.onboardingSecurityMode === "quick" ? "الحماية مؤجلة عبر البدء السريع." : "الإعداد الآمن هو المسار الحالي." }),
                jsx("p", { className: "mt-1 text-xs text-gray-500", children: settings.ui?.onboardingCoreUiSeenAt ? `شوهد شرح الواجهة: ${formatDateTime(settings.ui.onboardingCoreUiSeenAt)}` : "شرح الواجهة لم يسجل بعد." })
              ]
            }),
            jsx("button", { type: "button", onClick: openOnboardingWizard, className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: [jsx(RefreshCw, { className: "h-4 w-4" }), "تشغيل معالج البداية"] })
          ]
        })
      }),
      jsx(SettingsCard, {
        title: "الإعدادات اليومية",
        description: "اختيارات عامة تؤثر على طريقة فتح الأرشيف والتعامل مع البيانات.",
        icon: jsx(Archive, { className: "h-5 w-5 text-emerald-400" }),
        children: jsxs("div", {
          className: "grid gap-3 lg:grid-cols-2",
          children: [
            jsx(SegmentedChoices, { label: "العرض الافتراضي للأرشيف", value: settings.defaultView || "grid", options: VIEW_OPTIONS, onChange: (value) => saveSettings({ defaultView: value }, "تم تحديث العرض الافتراضي") }),
            jsx(SelectRow, {
              label: "عدد العناصر الافتراضي",
              value: String(settings.itemsPerPage || 24),
              onChange: (value) => saveSettings({ itemsPerPage: Number(value) }, "تم تحديث عدد العناصر"),
              options: [12, 24, 48, 96].map((value) => ({ value: String(value), label: `${formatNumber(value)} عنصر` })),
              description: "يستخدم كنقطة بداية للصفحات الجديدة."
            })
          ]
        })
      })
    ]
  });

  const renderInterface = () => jsxs("div", {
    className: "space-y-4",
    children: [
      jsx(SettingsCard, {
        title: "الهوية البصرية",
        description: "Ink Slate للوضع الليلي، Warm Off-white للوضع النهاري، ولون accent موحد للتفاعل.",
        icon: jsx(Sparkles, { className: "h-5 w-5 text-emerald-400" }),
        children: jsxs("div", {
          className: "space-y-4",
          children: [
            jsx(SegmentedChoices, { label: "المظهر", value: settings.theme || theme || "dark", options: THEME_OPTIONS, onChange: updateTheme }),
            jsx(ColorChoices, { value: settings.accentColor || "teal", onChange: (value) => saveSettings({ accentColor: value }, "تم تحديث لون التمييز") }),
            jsx(SegmentedChoices, {
              label: "كثافة الواجهة",
              value: settings.ui?.visualDensity || "comfortable",
              options: DENSITY_OPTIONS,
              columns: "sm:grid-cols-2",
              onChange: (value) => patchUi({ visualDensity: value }, "تم تحديث كثافة الواجهة")
            }),
            jsx("p", { className: "rounded-xl border border-white/10 bg-gray-950/30 p-3 text-xs text-gray-500", children: `المظهر المطبّق الآن: ${isDark ? "ليلي" : "نهاري"}.` })
          ]
        })
      }),
      jsx(SettingsCard, {
        title: "الأرقام واللغة",
        description: "العربية وRTL هما الأساس، ويمكن اختيار شكل الأرقام في التقارير والسجلات.",
        icon: jsx(Video, { className: "h-5 w-5 text-emerald-400" }),
        children: jsxs("div", {
          className: "grid gap-3 lg:grid-cols-2",
          children: [
            jsx(SegmentedChoices, {
              label: "نظام الأرقام",
              value: settings.numberSystem || "latn",
              options: [
                { value: "latn", label: "لاتيني", detail: formatNumber(1234, "latn") },
                { value: "arab", label: "هندي", detail: formatNumber(1234, "arab") }
              ],
              columns: "sm:grid-cols-2",
              onChange: (value) => saveSettings({ numberSystem: value }, "تم تحديث نظام الأرقام")
            }),
            jsx(SelectRow, {
              label: "اللغة",
              value: settings.language || "ar",
              onChange: (value) => saveSettings({ language: value }, "تم تحديث اللغة"),
              options: [{ value: "ar", label: "العربية" }],
              description: "خيارات اللغات الأخرى ستضاف لاحقاً بدون عرض خيار وهمي."
            })
          ]
        })
      })
    ]
  });

  const renderIcons = () => jsx(SettingsCard, {
    title: "الأيقونات والأغلفة",
    description: "الأيقونات المدمجة والرموز والنصوص والصور الخارجية مدعومة في مدير الأنواع والمجموعات.",
    icon: jsx(LayoutGrid, { className: "h-5 w-5 text-emerald-400" }),
    children: jsxs("div", {
      className: "grid gap-3 lg:grid-cols-2",
      children: [
        jsx(SelectRow, {
          label: "آخر تبويب في منتقي الأيقونات",
          value: settings.ui?.iconPickerLastTab || "builtin",
          onChange: (value) => patchUi({ iconPickerLastTab: value }, "تم تحديث تفضيل منتقي الأيقونات"),
          options: [
            { value: "builtin", label: "أيقونات مدمجة" },
            { value: "emoji", label: "إيموجي / نص" },
            { value: "upload", label: "صورة مرفوعة" },
            { value: "url", label: "رابط خارجي" }
          ],
          description: "يُستخدم عند فتح منتقي الأيقونات في الشاشات التي تدعمه."
        }),
        jsxs("div", {
          className: "rounded-xl border border-white/10 bg-gray-950/30 p-3",
          children: [
            jsx("p", { className: "text-sm font-semibold text-white", children: "إدارة الأيقونات الفعلية" }),
            jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500", children: "انتقل إلى إدارة الأنواع لإضافة أيقونة أو غلاف لكل نوع وفرع." }),
            jsx("button", { type: "button", onClick: () => setCurrentPage?.("types"), className: "mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "فتح إدارة الأنواع" })
          ]
        })
      ]
    })
  });

  const renderSmart = () => jsx(SettingsCard, {
    title: "الاستدعاء الذكي",
    description: "رموز محلية داخل حقول الوسوم والنصوص: القاموس عبر @ والوسوم الهرمية عبر #.",
    icon: jsx(Tags, { className: "h-5 w-5 text-emerald-400" }),
    children: jsxs("div", {
      className: "space-y-3",
      children: [
        jsx("div", {
          className: "grid gap-3 sm:grid-cols-2",
          children: [
            jsx(TextInputRow, {
              label: "رمز القاموس",
              value: settings.autocompleteTriggers?.vocabulary || "@",
              onChange: (value) => updateAutocompleteTrigger("vocabulary", value),
              dir: "ltr",
              description: "اكتب الرمز ثم جزءاً من المصطلح.",
              placeholder: "@"
            }),
            jsx(TextInputRow, {
              label: "رمز الوسوم",
              value: settings.autocompleteTriggers?.tags || "#",
              onChange: (value) => updateAutocompleteTrigger("tags", value),
              dir: "ltr",
              description: "يعرض الوسوم الجذرية والفرعية بمسارها.",
              placeholder: "#"
            })
          ]
        }),
        jsxs("p", {
          className: "rounded-xl border border-white/10 bg-gray-950/30 p-3 text-sm text-gray-400",
          children: [
            "مثال: ",
            jsx("span", { className: "font-mono text-emerald-200", dir: "ltr", children: `${settings.autocompleteTriggers?.vocabulary || "@"}م` }),
            " أو ",
            jsx("span", { className: "font-mono text-emerald-200", dir: "ltr", children: `${settings.autocompleteTriggers?.tags || "#"}رياض` })
          ]
        })
      ]
    })
  });

  const renderData = () => jsx(SettingsCard, {
    title: "النسخ والبيانات",
    description: "خيارات الحفظ والنسخ. إجراءات الاستيراد والتصدير الفعلية داخل مركز البيانات.",
    icon: jsx(HardDrive, { className: "h-5 w-5 text-emerald-400" }),
    children: jsxs("div", {
      className: "space-y-3",
      children: [
        jsx(ToggleRow, { label: "الحفظ التلقائي", checked: !!settings.autoSave, onChange: (checked) => saveSettings({ autoSave: checked }, "تم تحديث الحفظ التلقائي"), description: "يحفظ التغييرات اليومية بدون خطوة إضافية." }),
        jsx(ToggleRow, { label: "النسخ الاحتياطي التلقائي", checked: !!settings.autoBackup, onChange: (checked) => saveSettings({ autoBackup: checked }, "تم تحديث النسخ التلقائي"), description: "ينشئ نسخاً احتياطية حسب الجدولة المحددة." }),
        jsx("div", {
          className: "grid gap-3 lg:grid-cols-2",
          children: [
            jsx(SelectRow, {
              label: "جدولة النسخ الاحتياطي",
              value: settings.backupSchedule || "manual",
              onChange: (value) => saveSettings({ backupSchedule: value }, "تم تحديث جدولة النسخ"),
              options: [
                { value: "manual", label: "يدوي فقط" },
                { value: "hourly", label: "كل ساعة" },
                { value: "daily", label: "يومياً" },
                { value: "weekly", label: "أسبوعياً" }
              ]
            }),
            jsx(TextInputRow, {
              label: "فاصل النسخ بالدقائق",
              value: String(settings.backupInterval || 60),
              onChange: (value) => saveSettings({ backupInterval: Math.max(5, Number(value) || 60) }),
              dir: "ltr",
              description: "يستخدم في بعض مهام النسخ التلقائي.",
              placeholder: "60"
            })
          ]
        }),
        jsxs("div", {
          className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-950/30 p-3",
          children: [
            jsx("p", { className: "text-sm text-gray-400", children: settings.lastBackupAt ? `آخر نسخة: ${formatDateTime(settings.lastBackupAt)}` : "لا توجد نسخة احتياطية مسجلة بعد." }),
            jsx("button", { type: "button", onClick: () => setCurrentPage?.("backup"), className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: "فتح مركز البيانات" })
          ]
        })
      ]
    })
  });

  const renderSecurity = () => jsx(SettingsCard, {
    title: "الأمان",
    description: "حماية المدير، مهلة الجلسة، ومحاولات الدخول.",
    icon: jsx(ShieldCheck, { className: "h-5 w-5 text-emerald-400" }),
    children: jsxs("div", {
      className: "space-y-3",
      children: [
        isPasswordSet && jsx(TextInputRow, { label: "كلمة المرور الحالية", value: oldPassword, onChange: setOldPassword, dir: "ltr", type: "password" }),
        jsx(TextInputRow, { label: "كلمة المرور الجديدة", value: newPassword, onChange: setNewPassword, dir: "ltr", type: "password" }),
        jsx(TextInputRow, { label: "تأكيد كلمة المرور", value: confirmPassword, onChange: setConfirmPassword, dir: "ltr", type: "password" }),
        passwordError && jsx("p", { className: "rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200", children: passwordError }),
        jsxs("div", {
          className: "flex flex-wrap gap-2",
          children: [
            jsx("button", { type: "button", onClick: handlePasswordSave, className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600", children: isPasswordSet ? "تحديث كلمة المرور" : "تعيين كلمة المرور" }),
            jsx("button", { type: "button", onClick: lockApp, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "قفل التطبيق الآن" })
          ]
        }),
        jsx("div", {
          className: "grid gap-3 lg:grid-cols-2",
          children: [
            jsx(TextInputRow, {
              label: "مهلة الجلسة بالدقائق",
              value: String(settings.sessionTimeout || 30),
              onChange: (value) => saveSettings({ sessionTimeout: Math.max(1, Number(value) || 30) }),
              dir: "ltr"
            }),
            jsx(SelectRow, {
              label: "محاولات الدخول قبل القفل",
              value: String(authStore.maxLoginAttempts || 5),
              onChange: (value) => authStore.updateSecuritySettings?.(Number(value), authStore.lockoutDurationMs),
              options: [3, 5, 8, 10, 20].map((value) => ({ value: String(value), label: `${formatNumber(value)} محاولات` }))
            })
          ]
        }),
        jsx(ToggleRow, { label: "تفعيل مهلة الجلسة", checked: !!settings.enableSessionTimeout, onChange: (checked) => saveSettings({ enableSessionTimeout: checked }, "تم تحديث مهلة الجلسة") }),
        jsx(ToggleRow, { label: "تحذيرات المحتوى", checked: !!settings.contentWarningsEnabled, onChange: (checked) => saveSettings({ contentWarningsEnabled: checked }, "تم تحديث تحذيرات المحتوى") })
      ]
    })
  });

  const renderShortcuts = () => jsx(SettingsCard, {
    title: "اختصارات لوحة المفاتيح",
    description: "مدير كامل حسب الفئة مع منع التعارضات وتعطيل الاختصارات عند الحاجة.",
    icon: jsx(Keyboard, { className: "h-5 w-5 text-emerald-400" }),
    children: jsx(ShortcutManager, { settings, onSave: saveSettings, showToast })
  });

  const renderMaintenance = () => jsxs("div", {
    className: "space-y-4",
    children: [
      jsx(SettingsCard, {
        title: "فحص النظام",
        description: "فحص IndexedDB وSQLite والمساحة والحالة العامة.",
        icon: jsx(Database, { className: "h-5 w-5 text-emerald-400" }),
        aside: jsx("span", { className: cx("rounded-full border px-3 py-1 text-xs", sqliteReady ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-amber-500/20 bg-amber-500/10 text-amber-200"), children: sqliteReady ? "SQLite جاهز" : "وضع محدود" }),
        children: jsxs("div", {
          className: "space-y-3",
          children: [
            sqliteError && jsx("p", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200", children: sqliteError }),
            jsx("p", { className: "text-sm text-gray-500", children: settings.systemHealth?.lastCheckAt ? `آخر فحص: ${formatDateTime(settings.systemHealth.lastCheckAt)}` : "لم يتم تشغيل فحص كامل بعد." }),
            jsx("button", { type: "button", onClick: runHealth, disabled: healthRunning, className: "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60", children: healthRunning ? "جار الفحص..." : "تشغيل فحص النظام" })
          ]
        })
      }),
      jsx(SettingsCard, {
        title: "الربط الخارجي",
        description: "إعدادات تجريبية للربط المحلي بدون إضافة backend جديد.",
        icon: jsx(Shield, { className: "h-5 w-5 text-emerald-400" }),
        children: jsxs("div", {
          className: "space-y-3",
          children: [
            jsx(ToggleRow, { label: "تفعيل الربط الخارجي", checked: !!settings.externalDb?.enabled, onChange: (checked) => saveSettings({ externalDb: { ...(settings.externalDb || {}), enabled: checked, mode: checked ? "bridge" : "disabled" } }, "تم تحديث الربط الخارجي") }),
            jsx(TextInputRow, {
              label: "عنوان الجسر المحلي",
              value: settings.externalDb?.bridgeUrl || "http://127.0.0.1:8766",
              onChange: (value) => saveSettings({ externalDb: { ...(settings.externalDb || {}), bridgeUrl: value } }),
              dir: "ltr",
              description: "يُحفظ كرابط فقط، ولا يتم الاتصال به إلا من عمليات الربط المخصصة."
            })
          ]
        })
      }),
      jsx(SettingsCard, {
        title: "الإشعارات",
        description: "تفضيلات التنبيه داخل التطبيق وسطح المكتب عند توفر الإذن.",
        icon: jsx(Bell, { className: "h-5 w-5 text-emerald-400" }),
        children: jsxs("div", {
          className: "space-y-3",
          children: [
            jsx(ToggleRow, {
              label: "إبقاء التنبيهات المهمة",
              checked: !!settings.notifications?.persistImportant,
              onChange: (checked) => saveSettings({ notifications: { ...(settings.notifications || {}), persistImportant: checked } }, "تم تحديث الإشعارات")
            }),
            jsx(TextInputRow, {
              label: "مدة التنبيه بالميلي ثانية",
              value: String(settings.notifications?.durationMs || 5500),
              onChange: (value) => saveSettings({ notifications: { ...(settings.notifications || {}), durationMs: Math.max(1000, Number(value) || 5500) } }),
              dir: "ltr"
            })
          ]
        })
      })
    ]
  });

  const tabContent = {
    general: renderGeneral,
    interface: renderInterface,
    icons: renderIcons,
    smart: renderSmart,
    data: renderData,
    security: renderSecurity,
    shortcuts: renderShortcuts,
    maintenance: renderMaintenance
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
                  jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-white", children: [jsx(Lightbulb, { className: "h-6 w-6 text-emerald-400" }), "الإعدادات"] }),
                  jsx("p", { className: "mt-2 max-w-3xl text-sm leading-relaxed text-gray-400", children: "تبويبات واضحة بدون تحذيرات غير محفوظة عند التنقل فقط. التغييرات الصغيرة تحفظ مباشرة، وكلمة المرور لها إجراء حفظ مستقل." })
                ]
              }),
              jsxs("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  jsx("span", { className: "rounded-full border border-white/10 bg-gray-950/35 px-3 py-2 text-xs text-gray-400", children: `التبويب: ${tabState.activeLabel}` }),
                  jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200", children: "حفظ مباشر" })
                ]
              })
            ]
          })
        ]
      }),
      jsxs("div", {
        className: "grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]",
        children: [
          jsx(SettingsTabs, { activeTab, onTabChange: setActiveTab }),
          jsx("div", { className: "min-w-0", children: tabContent[activeTab]?.() || renderGeneral() })
        ]
      })
    ]
  });
}

SettingsPage.pageId = "settings";
SettingsPage.migrationStatus = "native";

export default SettingsPage;
