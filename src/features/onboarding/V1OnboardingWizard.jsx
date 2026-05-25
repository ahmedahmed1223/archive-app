import {
  handleAppError
} from "../../utils/errorHandling.js";
import {
  useTheme
} from "../../theme/useTheme.js";
import {
  useAppStore,
  useAuthStore
} from "../../stores/index.js";
import {
  Archive,
  Database,
  HardDrive,
  LayoutGrid,
  Shield,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";

import {
  CORE_UI_TOUR_ITEMS,
  ONBOARDING_ACCENT_OPTIONS,
  ONBOARDING_STEPS,
  ONBOARDING_THEME_OPTIONS
} from "./flow.js";
import {
  createOnboardingCompletionPatch,
  normalizeOnboardingAccentChoice,
  normalizeOnboardingSecurityMode,
  normalizeOnboardingThemeChoice
} from "./viewModel.js";
import { WorkflowStepper } from "../../components/ui/V1Primitives.jsx";

const FIRST_TASK_OPTIONS = [
  { id: "dashboard", label: "لوحة التحكم", detail: "ابدأ من جاهزية اليوم والإجراءات السريعة.", icon: LayoutGrid },
  { id: "add-video", label: "إضافة فيديو", detail: "افتح نموذج الإضافة مباشرة بعد الدخول.", icon: Video },
  { id: "import-backup", label: "استيراد أو نقل", detail: "ابدأ من مركز البيانات لاستيراد نسخة أو ملف نقل.", icon: HardDrive },
  { id: "create-type", label: "إنشاء نوع", detail: "جهز أول نوع محتوى وحقوله قبل الأرشفة.", icon: Database }
];

const EXTRA_STEPS = [
  ...ONBOARDING_STEPS,
  { id: "first-task", label: "البداية", detail: "اختيار أول شاشة بعد الإعداد." }
];

function getPasswordStrength(password = "") {
  const value = String(password || "");
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^a-zA-Z0-9]/.test(value)) score += 1;
  const labels = ["ضعيفة", "مقبولة", "جيدة", "قوية", "قوية جداً"];
  const colors = ["#f87171", "#f59e0b", "#14b8a6", "#10b981", "#22c55e"];
  return { score, label: labels[score] || labels[0], color: colors[score] || colors[0] };
}

function FieldLabel({ children }) {
  return jsx("label", {
    className: "block text-sm font-medium text-gray-200",
    children
  });
}

function OptionButton({ active, children, onClick }) {
  return jsx("button", {
    type: "button",
    onClick,
    className: `va-tool-button min-h-[88px] rounded-2xl border p-4 text-right transition-all ${
      active
        ? "border-emerald-400/45 bg-emerald-500/15 text-white shadow-lg shadow-emerald-500/10"
        : "border-white/10 bg-white/[0.035] text-gray-300 hover:border-emerald-500/25 hover:bg-white/[0.06]"
    }`,
    children
  });
}

function PrimaryButton({ children, onClick, disabled = false, type = "button" }) {
  return jsx("button", {
    type,
    onClick,
    disabled,
    className: "va-primary-button inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    children
  });
}

function SecondaryButton({ children, onClick, disabled = false }) {
  return jsx("button", {
    type: "button",
    onClick,
    disabled,
    className: "va-secondary-button inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-5 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50",
    children
  });
}

export function V1OnboardingWizard({ open, mode = "startup", onComplete, onCancel }) {
  const replayMode = mode === "replay";
  const {
    settings,
    users = [],
    isPasswordSet,
    setMasterPassword,
    updateSettings,
    showToast
  } = useAppStore();
  const authStore = useAuthStore();
  const { setTheme } = useTheme();
  const [securityMode, setSecurityMode] = React.useState(() => normalizeOnboardingSecurityMode(settings.ui?.onboardingSecurityMode || "secure"));
  const [themeChoice, setThemeChoice] = React.useState(() => normalizeOnboardingThemeChoice(settings.ui?.onboardingThemeChoice || settings.theme || "dark"));
  const [accentColor, setAccentColor] = React.useState(() => normalizeOnboardingAccentChoice(settings.accentColor || "teal"));
  const [visualDensity, setVisualDensity] = React.useState(settings.ui?.visualDensity === "compact" ? "compact" : "comfortable");
  const [firstTaskChoice, setFirstTaskChoice] = React.useState(settings.ui?.firstTaskChoice || "dashboard");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const steps = React.useMemo(() => {
    if (replayMode) return EXTRA_STEPS;
    if (securityMode === "quick") return EXTRA_STEPS.filter((step) => step.id !== "admin");
    return EXTRA_STEPS;
  }, [replayMode, securityMode]);
  const [stepId, setStepId] = React.useState(settings.ui?.lastOnboardingStep && EXTRA_STEPS.some((step) => step.id === settings.ui.lastOnboardingStep) ? settings.ui.lastOnboardingStep : "welcome");
  const activeStepIndex = Math.max(0, steps.findIndex((step) => step.id === stepId));
  const activeStep = steps[activeStepIndex] || steps[0];
  const passwordStrength = getPasswordStrength(password);
  const passwordMatches = password.length > 0 && password === confirmPassword;
  const canContinueAdmin = replayMode || securityMode === "quick" || (password.length >= 8 && passwordMatches && passwordStrength.score >= 2);

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setIsSubmitting(false);
    setStepId("welcome");
  }, [open, mode]);

  React.useEffect(() => {
    if (securityMode === "quick" && stepId === "admin" && !replayMode) {
      setStepId("appearance");
    }
  }, [replayMode, securityMode, stepId]);

  if (!open) return null;

  const goNext = () => {
    setError("");
    if (activeStep.id === "admin" && !canContinueAdmin) {
      setError("أدخل كلمة مرور قوية ومتطابقة قبل المتابعة.");
      return;
    }
    const next = steps[Math.min(activeStepIndex + 1, steps.length - 1)];
    setStepId(next.id);
  };

  const goBack = () => {
    setError("");
    const previous = steps[Math.max(activeStepIndex - 1, 0)];
    setStepId(previous.id);
  };

  const openSecuritySettings = async () => {
    await updateSettings({ ui: { ...(settings.ui || {}), lastSettingsTab: "security" } });
    window.dispatchEvent(new CustomEvent("videoarchive:onboarding-close"));
    onCancel?.();
  };

  const finishWizard = async () => {
    setError("");
    if (!replayMode && securityMode === "secure" && !canContinueAdmin) {
      setError("أدخل كلمة مرور قوية ومتطابقة قبل إكمال الإعداد.");
      setStepId("admin");
      return;
    }
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const completionPatch = createOnboardingCompletionPatch({
      securityMode,
      themeChoice,
      accentColor,
      visualDensity,
      firstTaskChoice,
      replayMode,
      now
    });
    try {
      if (!replayMode && securityMode === "secure") {
        await setMasterPassword(password);
      }
      await updateSettings(completionPatch);
      setTheme(themeChoice);

      if (!replayMode && securityMode === "secure") {
        const loggedIn = await authStore.login("admin", password, false);
        if (!loggedIn) {
          showToast?.("تم تأمين المدير، لكن تعذر تسجيل الدخول تلقائياً. سجّل الدخول بكلمة المرور الجديدة.", "warning");
        }
      }

      if (!replayMode && securityMode === "quick") {
        const adminUser = users.find((user) => user.username === "admin" && user.isActive) || users.find((user) => user.isActive);
        if (adminUser) {
          useAuthStore.setState({ currentUser: adminUser, isAuthenticated: true, authError: null });
        }
        showToast?.("تم تفعيل البدء السريع بدون كلمة مرور. يمكنك إضافة الحماية لاحقاً من الإعدادات.", "warning");
      }

      onComplete?.({ replayMode, securityMode, firstTaskChoice });
    } catch (errorObject) {
      handleAppError(errorObject, "معالج بدء التشغيل", { message: "تعذر إكمال معالج البداية" });
      setError("تعذر إكمال المعالج. راجع فحص النظام أو حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepBody = () => {
    if (activeStep.id === "welcome") {
      return jsxs("div", { className: "space-y-5", children: [
        jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300", children: jsx(Video, { className: "h-8 w-8" }) }),
        jsx("h1", { className: "text-2xl font-bold text-white", children: replayMode ? "معالج البداية" : "مرحباً بك في أرشيف الفيديو" }),
        jsx("p", { className: "mx-auto max-w-2xl text-sm leading-7 text-gray-400", children: replayMode ? "يمكنك مراجعة أساسيات الواجهة وتعديل تفضيلات البداية بدون تغيير كلمة المرور." : "سنجهز التطبيق بعد شاشة التحميل مباشرة: الحماية، المدير، المظهر، ثم أول شاشة تناسب عملك اليومي." }),
        jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: [
          ["محلي بالكامل", "تظل بياناتك على هذا الجهاز."],
          ["جاهز للنقل", "يمكنك التصدير لاحقاً لجهاز آخر."],
          ["RTL أولاً", "التجربة مصممة للعربية من البداية."]
        ].map(([title, detail]) => jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/[0.035] p-4", children: [
          jsx("p", { className: "font-semibold text-white", children: title }),
          jsx("p", { className: "mt-1 text-xs leading-6 text-gray-500", children: detail })
        ] }, title)) })
      ] });
    }

    if (activeStep.id === "security") {
      return jsxs("div", { className: "space-y-4", children: [
        jsx("h2", { className: "text-xl font-bold text-white", children: "اختر وضع الحماية" }),
        jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          jsx(OptionButton, { active: securityMode === "secure", onClick: () => setSecurityMode("secure"), children: jsxs("div", { children: [
            jsx(ShieldCheck, { className: "mb-3 h-6 w-6 text-emerald-300" }),
            jsx("p", { className: "font-semibold", children: "الإعداد الآمن" }),
            jsx("p", { className: "mt-2 text-xs leading-6 text-gray-400", children: "تعيين كلمة مرور للمدير قبل فتح التطبيق. هذا هو الخيار الموصى به." })
          ] }) }),
          jsx(OptionButton, { active: securityMode === "quick", onClick: () => setSecurityMode("quick"), children: jsxs("div", { children: [
            jsx(Shield, { className: "mb-3 h-6 w-6 text-amber-300" }),
            jsx("p", { className: "font-semibold", children: "البدء السريع" }),
            jsx("p", { className: "mt-2 text-xs leading-6 text-gray-400", children: "يفتح التطبيق محلياً بدون كلمة مرور. ستظهر بطاقة لاحقة لاستكمال الحماية." })
          ] }) })
        ] }),
        securityMode === "quick" && jsxs("div", { className: "flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-100", role: "status", children: [
          jsx(TriangleAlert, { className: "mt-0.5 h-5 w-5 shrink-0" }),
          jsx("p", { className: "text-sm leading-7", children: "البدء السريع مناسب للتجربة فقط. أي شخص لديه وصول للجهاز قد يفتح الأرشيف." })
        ] })
      ] });
    }

    if (activeStep.id === "admin") {
      if (replayMode) {
        return jsxs("div", { className: "space-y-4", children: [
          jsx("h2", { className: "text-xl font-bold text-white", children: "حالة المدير والحماية" }),
          jsx("p", { className: "text-sm leading-7 text-gray-400", children: isPasswordSet ? "الحماية مفعلة بالفعل. لا يغير وضع إعادة التشغيل كلمة المرور." : "الحماية غير مفعلة حالياً. يمكنك ضبطها من تبويب الأمان في الإعدادات." }),
          jsx(SecondaryButton, { onClick: openSecuritySettings, children: "فتح إعدادات الأمان" })
        ] });
      }
      return jsxs("div", { className: "space-y-4", children: [
        jsx("h2", { className: "text-xl font-bold text-white", children: "عيّن كلمة مرور المدير" }),
        jsx("p", { className: "text-sm leading-7 text-gray-400", children: "هذه الكلمة تؤمّن التطبيق وتصبح كلمة دخول حساب المدير." }),
        jsxs("div", { className: "space-y-2", children: [
          jsx(FieldLabel, { children: "كلمة المرور" }),
          jsx("input", {
            type: showPassword ? "text" : "password",
            value: password,
            onChange: (event) => {
              setPassword(event.target.value);
              setError("");
            },
            autoComplete: "new-password",
            dir: "ltr",
            className: "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-white outline-none focus:border-emerald-500/50"
          })
        ] }),
        jsxs("div", { className: "space-y-2", children: [
          jsx(FieldLabel, { children: "تأكيد كلمة المرور" }),
          jsx("input", {
            type: showPassword ? "text" : "password",
            value: confirmPassword,
            onChange: (event) => {
              setConfirmPassword(event.target.value);
              setError("");
            },
            autoComplete: "new-password",
            dir: "ltr",
            className: "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-white outline-none focus:border-emerald-500/50"
          })
        ] }),
        jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3", children: [
          jsxs("div", { children: [
            jsx("p", { className: "text-sm text-gray-300", children: "قوة كلمة المرور" }),
            jsx("p", { className: "text-xs", style: { color: passwordStrength.color }, children: passwordStrength.label })
          ] }),
          jsx("div", { className: "flex min-w-40 flex-1 gap-1", dir: "rtl", children: [1, 2, 3, 4].map((level) => jsx("span", {
            className: "h-2 flex-1 rounded-full",
            style: { backgroundColor: passwordStrength.score >= level ? passwordStrength.color : "rgba(255,255,255,0.08)" }
          }, level)) }),
          jsx("button", { type: "button", onClick: () => setShowPassword((value) => !value), className: "text-xs text-emerald-300 hover:text-emerald-200", children: showPassword ? "إخفاء" : "إظهار" })
        ] }),
        confirmPassword && jsx("p", { className: `text-sm ${passwordMatches ? "text-emerald-300" : "text-red-300"}`, children: passwordMatches ? "كلمة المرور متطابقة" : "كلمة المرور غير متطابقة" })
      ] });
    }

    if (activeStep.id === "appearance") {
      return jsxs("div", { className: "space-y-5", children: [
        jsx("h2", { className: "text-xl font-bold text-white", children: "اختر الهوية البصرية" }),
        jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: ONBOARDING_THEME_OPTIONS.map((option) => jsx(OptionButton, {
          active: themeChoice === option.id,
          onClick: () => setThemeChoice(option.id),
          children: jsxs("div", { children: [
            jsx("p", { className: "font-semibold", children: option.label }),
            jsx("p", { className: "mt-2 text-xs leading-6 text-gray-400", children: option.detail })
          ] })
        }, option.id)) }),
        jsxs("div", { className: "space-y-3", children: [
          jsx("p", { className: "text-sm font-medium text-gray-200", children: "لون التفاعل" }),
          jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: ONBOARDING_ACCENT_OPTIONS.map((option) => jsx(OptionButton, {
            active: accentColor === option.id,
            onClick: () => setAccentColor(option.id),
            children: jsxs("div", { className: "flex items-center gap-3", children: [
              jsx("span", { className: "h-5 w-5 rounded-full border border-white/30", style: { backgroundColor: option.color } }),
              jsx("span", { className: "font-semibold", children: option.label })
            ] })
          }, option.id)) })
        ] }),
        jsxs("div", { className: "space-y-3", children: [
          jsx("p", { className: "text-sm font-medium text-gray-200", children: "كثافة الواجهة" }),
          jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            jsx(OptionButton, { active: visualDensity === "comfortable", onClick: () => setVisualDensity("comfortable"), children: jsxs("div", { children: [
              jsx("p", { className: "font-semibold", children: "مريحة" }),
              jsx("p", { className: "mt-2 text-xs text-gray-400", children: "مساحات أوسع للعمل اليومي الطويل." })
            ] }) }),
            jsx(OptionButton, { active: visualDensity === "compact", onClick: () => setVisualDensity("compact"), children: jsxs("div", { children: [
              jsx("p", { className: "font-semibold", children: "مضغوطة" }),
              jsx("p", { className: "mt-2 text-xs text-gray-400", children: "عرض أكثر للبيانات في الشاشة." })
            ] }) })
          ] })
        ] })
      ] });
    }

    if (activeStep.id === "interface") {
      const icons = [LayoutGrid, Archive, Video, HardDrive];
      return jsxs("div", { className: "space-y-4", children: [
        jsx("h2", { className: "text-xl font-bold text-white", children: "تعرف على الواجهة الأساسية" }),
        jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: CORE_UI_TOUR_ITEMS.map((item, index) => {
          const Icon = icons[index] || Sparkles;
          return jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/[0.035] p-4", children: [
            jsx(Icon, { className: "mb-3 h-5 w-5 text-emerald-300" }),
            jsx("p", { className: "font-semibold text-white", children: item.label }),
            jsx("p", { className: "mt-2 text-xs leading-6 text-gray-400", children: item.detail })
          ] }, item.label);
        }) })
      ] });
    }

    return jsxs("div", { className: "space-y-5", children: [
      jsx("h2", { className: "text-xl font-bold text-white", children: "أين تريد أن تبدأ؟" }),
      jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: FIRST_TASK_OPTIONS.map((option) => {
        const Icon = option.icon;
        return jsx(OptionButton, {
          active: firstTaskChoice === option.id,
          onClick: () => setFirstTaskChoice(option.id),
          children: jsxs("div", { children: [
            jsx(Icon, { className: "mb-3 h-5 w-5 text-emerald-300" }),
            jsx("p", { className: "font-semibold", children: option.label }),
            jsx("p", { className: "mt-2 text-xs leading-6 text-gray-400", children: option.detail })
          ] })
        }, option.id);
      }) })
    ] });
  };

  return jsx("div", {
    className: "va-onboarding-shell fixed inset-0 z-[70] overflow-y-auto bg-[#07111f] px-4 py-5 text-right text-white sm:px-6 sm:py-8",
    dir: "rtl",
    role: "dialog",
    "aria-modal": true,
    "aria-label": replayMode ? "معالج البداية" : "معالج أول تشغيل",
    children: jsxs("div", { className: "mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col justify-center gap-5", children: [
      jsxs("header", { className: "grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]", children: [
        jsxs("div", { className: "rounded-3xl border border-white/10 bg-white/[0.035] p-5", children: [
          jsx("p", { className: "text-xs font-medium text-emerald-300", children: replayMode ? "إعادة تشغيل المعالج" : "الإصدار الأول" }),
          jsx("h2", { className: "mt-2 text-lg font-bold text-white", children: "أرشيف الفيديو" }),
          jsx("p", { className: "mt-2 text-xs leading-6 text-gray-500", children: "تجهيز آمن وواضح بعد شاشة التحميل، ثم دخول يومي مباشر." })
        ] }),
        jsx(WorkflowStepper, {
          steps,
          activeStepId: activeStep.id,
          completedStepIds: steps.slice(0, activeStepIndex).map((step) => step.id),
          className: "rounded-3xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-3 lg:grid-cols-6",
          compact: true
        })
      ] }),
      jsxs(motion.main, {
        key: activeStep.id,
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22 },
        className: "va-onboarding-panel rounded-3xl border border-white/10 bg-[#0b1626]/95 p-5 shadow-2xl shadow-black/20 sm:p-8",
        children: [
          renderStepBody(),
          error && jsxs("div", { className: "mt-5 flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-100", role: "alert", children: [
            jsx(TriangleAlert, { className: "mt-0.5 h-5 w-5 shrink-0" }),
            jsx("p", { className: "text-sm leading-7", children: error })
          ] }),
          jsxs("footer", { className: "mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5", children: [
            jsx(SecondaryButton, { onClick: activeStepIndex === 0 ? onCancel : goBack, disabled: !replayMode && activeStepIndex === 0, children: activeStepIndex === 0 ? "إغلاق" : "السابق" }),
            jsxs("div", { className: "flex flex-wrap gap-2", children: [
              replayMode && jsx(SecondaryButton, { onClick: onCancel, children: "إغلاق المعالج" }),
              activeStepIndex < steps.length - 1 ? jsx(PrimaryButton, { onClick: goNext, disabled: activeStep.id === "admin" && !canContinueAdmin, children: "التالي" }) : jsx(PrimaryButton, { onClick: finishWizard, disabled: isSubmitting, children: isSubmitting ? "جارٍ الحفظ..." : replayMode ? "إنهاء المراجعة" : "إكمال الإعداد" })
            ] })
          ] })
        ]
      })
    ] })
  });
}

export default V1OnboardingWizard;
