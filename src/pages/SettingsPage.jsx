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
import { MotionPage, PageHero, SaveIndicator } from "../components/ui/index.js";
import { useFormSaveState } from "../components/common/useFormSaveState.js";

import {
  createSettingsTabUiPatch,
  getSettingsTabState,
  normalizeSettingsTab
} from "../features/settings/viewModel.js";
import {
  DENSITY_OPTIONS,
  THEME_OPTIONS,
  VIEW_OPTIONS,
  ColorChoices,
  SegmentedChoices,
  SelectRow,
  SettingsCard,
  SettingsTabs,
  ShortcutManager,
  TextInputRow,
  ToggleRow,
  cx
} from "../features/settings/SettingsControls.jsx";
import {
  getDefaultSettings,
  mergeAppSettings
} from "../utils/settings.js";

export function SettingsPage() {
  const {
    settings: rawSettings = {},
    updateSettings,
    setMasterPassword,
    isPasswordSet,
    unlockApp,
    lockApp,
    runSystemHealthCheck,
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
  const passwordSave = useFormSaveState();
  const healthSave = useFormSaveState({ successTimeoutMs: 4000 });
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
      const oldOk = await unlockApp?.(oldPassword);
      if (!oldOk) {
        setPasswordError("كلمة المرور الحالية غير صحيحة.");
        return;
      }
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }
    // Policy validation happens inside setMasterPassword; surface its toast in addition.
    try {
      await passwordSave.run(async () => {
        await setMasterPassword?.(newPassword);
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast?.("تم تحديث كلمة مرور المدير.", "success");
    } catch (error) {
      setPasswordError(error?.message || "تعذر تحديث كلمة المرور.");
    }
  };

  const runHealth = async () => {
    setHealthRunning(true);
    healthSave.begin();
    try {
      await runSystemHealthCheck?.();
      healthSave.succeed();
      showToast?.("اكتمل فحص النظام.", "success");
    } catch (error) {
      healthSave.fail(error);
      showToast?.(error?.message || "تعذر فحص النظام.", "error");
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
              className: "rounded-xl va-surface-subtle border p-3",
              children: [
                jsx("p", { className: "text-sm text-gray-300", children: settings.ui?.onboardingSecurityMode === "quick" ? "الحماية مؤجلة عبر البدء السريع." : "الإعداد الآمن هو المسار الحالي." }),
                jsx("p", { className: "mt-1 text-xs text-gray-500", children: settings.ui?.onboardingCoreUiSeenAt ? `شوهد شرح الواجهة: ${formatDateTime(settings.ui.onboardingCoreUiSeenAt)}` : "شرح الواجهة لم يسجل بعد." })
              ]
            }),
            jsx("button", { type: "button", onClick: openOnboardingWizard, className: "inline-flex min-h-11 items-center justify-center gap-2 va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white", children: [jsx(RefreshCw, { className: "h-4 w-4" }), "تشغيل معالج البداية"] })
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
            jsx(SegmentedChoices, {
              label: "حجم الخط",
              value: settings.ui?.fontScale || "normal",
              options: [
                { value: "small", label: "صغير", detail: "14px" },
                { value: "normal", label: "عادي", detail: "16px" },
                { value: "large", label: "كبير", detail: "17px" },
                { value: "xlarge", label: "كبير جدًا", detail: "18px" }
              ],
              columns: "sm:grid-cols-4",
              onChange: (value) => patchUi({ fontScale: value }, "تم تحديث حجم الخط")
            }),
            jsx(SegmentedChoices, {
              label: "مستوى الحركة",
              value: settings.ui?.motionLevel || "full",
              options: [
                { value: "full", label: "كامل", detail: "حركات سلسة" },
                { value: "reduced", label: "مخفّف", detail: "حركات أسرع" },
                { value: "off", label: "متوقّف", detail: "بدون حركة" }
              ],
              columns: "sm:grid-cols-3",
              onChange: (value) => patchUi({ motionLevel: value }, "تم تحديث مستوى الحركة")
            }),
            jsx(SegmentedChoices, {
              label: "أسلوب البطاقات",
              value: settings.ui?.cardStyle || "filled",
              options: [
                { value: "filled", label: "ممتلئة", detail: "خلفية ودرجة عمق" },
                { value: "outlined", label: "مُحدّدة", detail: "إطار فقط" },
                { value: "minimal", label: "بسيطة", detail: "بدون إطار" }
              ],
              columns: "sm:grid-cols-3",
              onChange: (value) => patchUi({ cardStyle: value }, "تم تحديث أسلوب البطاقات")
            }),
            jsx("p", { className: "rounded-xl va-surface-subtle border p-3 text-xs text-gray-500", children: `المظهر المطبّق الآن: ${isDark ? "ليلي" : "نهاري"}.` })
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
          className: "rounded-xl va-surface-subtle border p-3",
          children: [
            jsx("p", { className: "text-sm font-semibold text-white", children: "إدارة الأيقونات الفعلية" }),
            jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500", children: "انتقل إلى إدارة الأنواع لإضافة أيقونة أو غلاف لكل نوع وفرع." }),
            jsx("button", { type: "button", onClick: () => setCurrentPage?.("types"), className: "mt-3 va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white", children: "فتح إدارة الأنواع" })
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
          className: "rounded-xl va-surface-subtle border p-3 text-sm text-gray-400",
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
          className: "flex flex-wrap items-center justify-between gap-3 rounded-xl va-surface-subtle border p-3",
          children: [
            jsx("p", { className: "text-sm text-gray-400", children: settings.lastBackupAt ? `آخر نسخة: ${formatDateTime(settings.lastBackupAt)}` : "لا توجد نسخة احتياطية مسجلة بعد." }),
            jsx("button", { type: "button", onClick: () => setCurrentPage?.("backup"), className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white", children: "فتح مركز البيانات" })
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
          className: "flex flex-wrap items-center gap-2",
          children: [
            jsx("button", { type: "button", onClick: handlePasswordSave, disabled: passwordSave.isSaving, className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60", children: isPasswordSet ? "تحديث كلمة المرور" : "تعيين كلمة المرور" }),
            jsx("button", { type: "button", onClick: lockApp, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "قفل التطبيق الآن" }),
            jsx(SaveIndicator, { state: passwordSave.state, onRetry: handlePasswordSave })
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
        description: "فحص IndexedDB والمساحة والحالة العامة. SQLite مؤجل لهذه النسخة.",
        icon: jsx(Database, { className: "h-5 w-5 text-emerald-400" }),
        aside: jsx("span", { className: cx("rounded-full border px-3 py-1 text-xs", sqliteError ? "border-amber-500/20 bg-amber-500/10 text-amber-200" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"), children: sqliteError ? "تحقق التخزين" : "IndexedDB محلي" }),
        children: jsxs("div", {
          className: "space-y-3",
          children: [
            sqliteError && jsx("p", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200", children: sqliteError }),
            jsx("p", { className: "text-sm text-gray-500", children: settings.systemHealth?.lastCheckAt ? `آخر فحص: ${formatDateTime(settings.systemHealth.lastCheckAt)}` : "لم يتم تشغيل فحص كامل بعد." }),
            jsxs("div", {
              className: "flex flex-wrap items-center gap-2",
              children: [
                jsx("button", { type: "button", onClick: runHealth, disabled: healthRunning, className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60", children: healthRunning ? "جار الفحص..." : "تشغيل فحص النظام" }),
                jsx(SaveIndicator, { state: healthSave.state, message: healthSave.isSaving ? "جار فحص النظام..." : healthSave.isSaved ? "اكتمل الفحص" : healthSave.isError ? "فشل الفحص" : null, onRetry: runHealth })
              ]
            })
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

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsx(PageHero, {
        icon: jsx(Lightbulb, { className: "h-6 w-6 text-emerald-400" }),
        title: "الإعدادات",
        description: "تبويبات واضحة بدون تحذيرات غير محفوظة عند التنقل فقط. التغييرات الصغيرة تحفظ مباشرة، وكلمة المرور لها إجراء حفظ مستقل.",
        actions: jsxs("div", {
          className: "flex flex-wrap gap-2",
          children: [
            jsx("span", { className: "rounded-full border border-white/10 bg-gray-950/35 px-3 py-2 text-xs text-gray-400", children: `التبويب: ${tabState.activeLabel}` }),
            jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200", children: "حفظ مباشر" })
          ]
        })
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
