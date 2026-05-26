import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  Command,
  Home,
  Info,
  KeyRound,
  Lock,
  LogIn,
  Search,
  ShieldAlert,
  Sparkles,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { createPortal } from "react-dom";
import { useAppStore, useAuthStore } from "../../stores/index.js";
import { filterCommandPaletteCommands } from "../../components/common/commandPaletteViewModel.js";
import { undoRedoManager as sharedUndoRedoManager, SimpleUndoRedoManager } from "../../components/common/undoManager.js";
import { InsightPanel, SkeletonBlock, WorkflowStepper } from "../../components/ui/V1Primitives.jsx";

const STARTUP_STEPS = [
  { id: "environment", label: "فحص البيئة" },
  { id: "data", label: "تحميل البيانات" },
  { id: "auth", label: "استعادة الجلسة" },
  { id: "route", label: "تطبيق الرابط الحالي" }
];

function nowIso() {
  return new Date().toISOString();
}

export function createStartupProgressState(overrides = {}) {
  return {
    running: true,
    steps: STARTUP_STEPS,
    currentStepId: STARTUP_STEPS[0].id,
    progress: 1,
    warnings: [],
    fatalError: null,
    ...overrides
  };
}

export async function runStartupSequence({ onStep, loadAllData, initAuth } = {}) {
  const steps = STARTUP_STEPS.map((step) => ({ ...step, status: "pending" }));
  const warnings = [];

  const report = (index, status = "running", extra = {}) => {
    const currentStep = steps[index] || steps[steps.length - 1];
    steps.forEach((step, stepIndex) => {
      if (stepIndex < index) step.status = "done";
      if (stepIndex === index) step.status = status;
    });
    onStep?.({
      running: status !== "done" || index < steps.length - 1,
      steps: [...steps],
      currentStepId: currentStep?.id,
      progress: Math.round(((index + (status === "done" ? 1 : 0.35)) / steps.length) * 100),
      warnings: [...warnings],
      fatalError: null,
      ...extra
    });
  };

  try {
    report(0);
    if (typeof indexedDB === "undefined") {
      throw new Error("IndexedDB غير متاح في هذا المتصفح.");
    }
    report(0, "done");

    report(1);
    await loadAllData?.();
    report(1, "done");

    report(2);
    await initAuth?.();
    report(2, "done");

    report(3);
    report(3, "done", { running: false, progress: 100 });
    return { ok: true, limitedMode: false, steps, warnings, fatalError: null };
  } catch (error) {
    const fatalError = {
      message: error?.message || "تعذر بدء التطبيق",
      userMessage: error?.message || "حدث خطأ أثناء تهيئة التطبيق.",
      at: nowIso()
    };
    onStep?.({
      running: false,
      steps,
      currentStepId: steps.find((step) => step.status === "running")?.id || steps[0].id,
      progress: 100,
      warnings,
      fatalError
    });
    return { ok: false, limitedMode: true, steps, warnings, fatalError };
  }
}

export { SimpleUndoRedoManager };
export const undoRedoManager = sharedUndoRedoManager;

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div dir="rtl" className="m-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-right text-red-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <h2 className="text-lg font-bold">حدث خطأ في هذه الشاشة</h2>
            <p className="mt-2 text-sm leading-7 text-red-100/80">
              لم يتم تطبيق أي تغيير غير مكتمل. أعد تحميل الصفحة أو افتح فحص النظام إذا تكرر الخطأ.
            </p>
            <pre dir="ltr" className="mt-4 max-h-40 overflow-auto rounded-xl bg-black/25 p-3 text-left text-xs text-red-50">
              {this.state.error?.message || String(this.state.error)}
            </pre>
          </div>
        </div>
      </div>
    );
  }
}

export function DashboardSkeleton() {
  return (
    <div dir="rtl" className="space-y-5 p-6">
      <div className="va-skeleton h-24 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="va-skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="va-skeleton h-96 rounded-2xl" />
        <div className="va-skeleton h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export function SplashScreen({ steps = STARTUP_STEPS, currentStepId, progress = 1, warnings = [], fatalError, onOpenDiagnostics }) {
  const currentStep = steps.find((step) => step.id === currentStepId) || steps[0];
  const completedStepIds = steps.filter((step) => step.status === "done").map((step) => step.id);
  return (
    <main dir="rtl" className="va-onboarding-shell flex min-h-screen items-center justify-center bg-[#07111f] p-6 text-right text-white">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="va-onboarding-panel w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b1626]/95 p-7 shadow-2xl shadow-black/30"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
            <Sparkles className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">أرشيف الفيديو</h1>
            <p className="mt-1 text-sm text-slate-400">نجهز البيئة المحلية ونفتح آخر حالة آمنة للتطبيق.</p>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-100">{currentStep?.label || "بدء التشغيل"}</span>
            <span dir="ltr" className="font-mono text-emerald-200">{Math.max(0, Math.min(100, Math.round(progress)))}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" dir="rtl">
            <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} />
          </div>
        </div>

        <WorkflowStepper steps={steps} activeStepId={currentStepId} completedStepIds={completedStepIds} className="mt-6 sm:grid-cols-4" compact />

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <InsightPanel
            icon={<Database className="h-5 w-5" />}
            title="بياناتك محلية"
            description="يتم تحميل IndexedDB على هذا الجهاز فقط، ويمكنك نقل الأرشيف لاحقًا من مركز البيانات."
            className="p-4"
          />
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="text-sm font-semibold text-slate-200">نجهّز الواجهة التالية</p>
            <div className="mt-3 space-y-2">
              <SkeletonBlock className="h-3 w-11/12" />
              <SkeletonBlock className="h-3 w-8/12" />
              <SkeletonBlock className="h-8 w-full" />
            </div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
            {warnings.slice(0, 2).map((warning) => <p key={warning.id || warning.message}>{warning.message || warning}</p>)}
          </div>
        )}

        {fatalError && (
          <button type="button" onClick={onOpenDiagnostics} className="mt-5 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-100">
            فتح فحص النظام
          </button>
        )}
      </motion.section>
    </main>
  );
}

export function StartupRecoveryScreen({ report, onRetry, onOpenDiagnostics }) {
  const message = report?.fatalError?.userMessage || report?.fatalError?.message || "تعذر بدء التطبيق بشكل كامل.";
  return (
    <main dir="rtl" className="va-onboarding-shell flex min-h-screen items-center justify-center bg-[#07111f] p-6 text-right text-white">
      <section className="va-onboarding-panel w-full max-w-xl rounded-3xl border border-red-500/25 bg-[#0b1626] p-7">
        <ShieldAlert className="h-10 w-10 text-red-300" />
        <h1 className="mt-4 text-2xl font-bold">شاشة استرداد بدء التشغيل</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">{message}</p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-slate-300">
          بياناتك لا تُنقل إلى أي خادم. إذا استمر الخطأ، افتح فحص النظام لمعرفة حالة IndexedDB والمساحة المتاحة.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onOpenDiagnostics} className="va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white">
            فتح فحص النظام
          </button>
          <button type="button" onClick={onRetry} className="va-secondary-button rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200">
            إعادة المحاولة
          </button>
        </div>
      </section>
    </main>
  );
}

export function LockScreen() {
  const unlockApp = useAppStore((state) => state.unlockApp);
  const showToast = useAppStore((state) => state.showToast);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = (event) => {
    event.preventDefault();
    const ok = unlockApp?.(password);
    if (!ok) {
      setError("كلمة المرور غير صحيحة.");
      return;
    }
    showToast?.("تم فتح التطبيق", "success");
  };

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#07111f] p-6 text-right text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1626] p-7">
        <Lock className="h-10 w-10 text-emerald-300" />
        <h1 className="mt-4 text-2xl font-bold">التطبيق مقفل</h1>
        <p className="mt-2 text-sm text-slate-400">أدخل كلمة المرور الرئيسية للمتابعة.</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white outline-none focus:border-emerald-400/60"
          placeholder="كلمة المرور"
        />
        {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
        <button type="submit" className="va-primary-button mt-5 w-full rounded-xl px-4 py-3 font-semibold text-white">
          فتح
        </button>
      </form>
    </main>
  );
}

export function LoginScreen() {
  const users = useAppStore((state) => state.users || []);
  const skipPasswordSetup = useAppStore((state) => state.skipPasswordSetup);
  const { login, authError, isLoading } = useAuthStore();
  const [username, setUsername] = React.useState(() => users.find((user) => user.username === "admin")?.username || users[0]?.username || "admin");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);

  const submit = async (event) => {
    event.preventDefault();
    await login?.(username, password, rememberMe);
  };

  const openOnboarding = () => {
    window.dispatchEvent(new CustomEvent("videoarchive:onboarding-open", { detail: { mode: "startup" } }));
  };

  return (
    <main dir="rtl" className="va-onboarding-shell flex min-h-screen items-center justify-center bg-[#07111f] p-6 text-right text-white">
      <section className="va-onboarding-panel grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1626] shadow-2xl shadow-black/30 md:grid-cols-[0.9fr_1.1fr]">
        <aside className="bg-emerald-500/10 p-7">
          <Sparkles className="h-11 w-11 text-emerald-200" />
          <h1 className="mt-5 text-3xl font-bold">أرشيف الفيديو</h1>
          <p className="mt-3 text-sm leading-7 text-emerald-50/80">
            دخول سريع وآمن إلى الأرشيف المحلي، مع بقاء بياناتك على هذا الجهاز.
          </p>
          <button type="button" onClick={openOnboarding} className="mt-6 rounded-xl border border-emerald-300/30 px-4 py-2 text-sm font-semibold text-emerald-50">
            تشغيل معالج البداية
          </button>
        </aside>
        <form onSubmit={submit} className="p-7">
          <div className="flex items-center gap-3">
            <LogIn className="h-6 w-6 text-emerald-300" />
            <h2 className="text-2xl font-bold">تسجيل الدخول</h2>
          </div>
          <label className="mt-6 block text-sm text-slate-300">
            المستخدم
            <select value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
              {users.length ? users.filter((user) => user.isActive !== false).map((user) => (
                <option key={user.id || user.username} value={user.username}>{user.displayName || user.username}</option>
              )) : <option value="admin">admin</option>}
            </select>
          </label>
          <label className="mt-4 block text-sm text-slate-300">
            كلمة المرور
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white" />
          </label>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
            تذكر الجلسة على هذا الجهاز
          </label>
          {authError && <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-100">{authError}</p>}
          <button type="submit" disabled={isLoading} className="va-primary-button mt-6 w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60">
            {isLoading ? "جار التحقق..." : "دخول"}
          </button>
          {users.length === 0 && (
            <button type="button" onClick={() => skipPasswordSetup?.()} className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300">
              البدء السريع بدون كلمة مرور
            </button>
          )}
        </form>
      </section>
    </main>
  );
}

export function ToastNotification() {
  const notifications = useAppStore((state) => state.notifications || []);
  const dismissNotification = useAppStore((state) => state.dismissNotification);
  const topItems = notifications.slice(0, 3);
  return createPortal(
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-4 z-[9990] flex w-[min(92vw,380px)] flex-col gap-2 text-right"
    >
      <AnimatePresence initial={false}>
        {topItems.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -12, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ duration: 0.2 }}
            role={notification.type === "error" ? "alert" : undefined}
            className="rounded-2xl border border-white/10 bg-[var(--color-bg-surface,#0b1626)]/95 p-4 text-white shadow-2xl shadow-black/25 backdrop-blur"
            layout
          >
            <div className="flex items-start gap-3">
              {notification.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" /> : notification.type === "error" ? <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" /> : <Info className="mt-0.5 h-5 w-5 text-sky-300" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{notification.title || "تنبيه"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{notification.message}</p>
                {notification.action && (
                  <button
                    type="button"
                    onClick={() => {
                      try { notification.action.run(); } catch (error) { console.warn("[toast action]", error); }
                      if (notification.action.dismissOnRun !== false) dismissNotification?.(notification.id);
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[color-mix(in_srgb,var(--va-action)_40%,transparent)] bg-[color-mix(in_srgb,var(--va-action)_18%,transparent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[color-mix(in_srgb,var(--va-action)_28%,transparent)]"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => dismissNotification?.(notification.id)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="إغلاق">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export function CommandPalette({ open, onOpenChange, onOpenShortcuts }) {
  const setCurrentPage = useAppStore((state) => state.setCurrentPage);
  const setSelectedItemId = useAppStore((state) => state.setSelectedItemId);
  const [query, setQuery] = React.useState("");
  const commands = React.useMemo(() => [
    { id: "dashboard", label: "لوحة التحكم", detail: "العودة للبداية اليومية", icon: Home, run: () => setCurrentPage?.("dashboard") },
    { id: "archive", label: "الأرشيف", detail: "تصفح المواد والفلاتر", icon: Search, run: () => setCurrentPage?.("archive") },
    { id: "add", label: "إضافة فيديو", detail: "إنشاء مادة أرشيفية جديدة", icon: Sparkles, run: () => setCurrentPage?.("add") },
    { id: "backup", label: "مركز البيانات", detail: "استيراد وتصدير ونقل", icon: Bell, run: () => setCurrentPage?.("backup") },
    { id: "help", label: "المساعدة", detail: "فتح مركز المعرفة", icon: Info, run: () => setCurrentPage?.("help") },
    { id: "shortcuts", label: "اختصارات لوحة المفاتيح", detail: "عرض الاختصارات الحالية", icon: Command, run: onOpenShortcuts }
  ], [onOpenShortcuts, setCurrentPage]);
  const filtered = filterCommandPaletteCommands(commands, query);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;
  const runCommand = (command) => {
    setSelectedItemId?.(null);
    command.run?.();
    onOpenChange?.(false);
  };

  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[9980] bg-black/60 p-4 text-right backdrop-blur-sm" onMouseDown={() => onOpenChange?.(false)}>
      <motion.section
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1626] text-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-5 w-5 text-emerald-300" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="اكتب أمرًا أو صفحة..." className="min-h-11 flex-1 bg-transparent text-right outline-none placeholder:text-slate-500" />
          <button type="button" onClick={() => onOpenChange?.(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[420px] overflow-auto p-2">
          {filtered.map((command) => {
            const Icon = command.icon || Command;
            return (
              <button key={command.id} type="button" onClick={() => runCommand(command)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right hover:bg-white/[0.07]">
                <Icon className="h-5 w-5 shrink-0 text-emerald-300" />
                <span className="min-w-0">
                  <span className="block font-semibold">{command.label}</span>
                  <span className="block text-xs text-slate-400">{command.detail}</span>
                </span>
              </button>
            );
          })}
          {!filtered.length && <p className="p-6 text-center text-sm text-slate-400">لا توجد أوامر مطابقة.</p>}
        </div>
      </motion.section>
    </div>,
    document.body
  );
}

export function UndoRedoBar() {
  const [snapshot, setSnapshot] = React.useState(() => undoRedoManager.getSnapshot());
  React.useEffect(() => undoRedoManager.subscribe(() => setSnapshot(undoRedoManager.getSnapshot())), []);
  if (!snapshot.canUndo && !snapshot.canRedo) return null;
  return (
    <div dir="rtl" className="fixed bottom-4 right-4 z-[9970] flex gap-2 rounded-2xl border border-white/10 bg-[#0b1626]/95 p-2 text-sm text-white shadow-xl">
      <button type="button" disabled={!snapshot.canUndo} onClick={() => undoRedoManager.undo()} className="rounded-xl px-3 py-2 disabled:opacity-40">تراجع</button>
      <button type="button" disabled={!snapshot.canRedo} onClick={() => undoRedoManager.redo()} className="rounded-xl px-3 py-2 disabled:opacity-40">إعادة</button>
    </div>
  );
}

export function StatusBar() {
  const backgroundOperation = useAppStore((state) => state.backgroundOperation);
  if (!backgroundOperation) return null;
  return (
    <div dir="rtl" className="fixed bottom-4 right-1/2 z-[9960] translate-x-1/2 rounded-full border border-white/10 bg-[#0b1626]/95 px-4 py-2 text-sm text-slate-200 shadow-xl">
      {backgroundOperation.label || "عملية تعمل في الخلفية"}
    </div>
  );
}

export function ForceChangePasswordDialog() {
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword);
  const forceChangePassword = useAuthStore((state) => state.forceChangePassword);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  if (!mustChangePassword) return null;

  const submit = async (event) => {
    event.preventDefault();
    const ok = await forceChangePassword?.(password);
    if (!ok) setError("تعذر تغيير كلمة المرور. استخدم كلمة مرور أقوى.");
  };

  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/70 p-4 text-right text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1626] p-6">
        <KeyRound className="h-9 w-9 text-emerald-300" />
        <h2 className="mt-4 text-xl font-bold">تغيير كلمة المرور مطلوب</h2>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right" placeholder="كلمة المرور الجديدة" />
        {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
        <button type="submit" className="va-primary-button mt-5 w-full rounded-xl px-4 py-3 font-semibold text-white">حفظ كلمة المرور</button>
      </form>
    </div>,
    document.body
  );
}

const TOUR_STEPS = [
  { title: "لوحة التحكم", body: "تبدأ يومك من مؤشرات سريعة وإجراءات مباشرة." },
  { title: "الأرشيف", body: "تصفح المواد، غيّر طريقة العرض، واستخدم الفلاتر للعثور على الفيديو بسرعة." },
  { title: "مركز البيانات", body: "التصدير، الاستيراد، النسخ الاحتياطي، ونقل الجهاز في مكان واحد." }
];

export function V1ProductTour({ open, onComplete, onSkip }) {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (open) setIndex(0);
  }, [open]);
  if (!open) return null;
  const step = TOUR_STEPS[index];
  const last = index >= TOUR_STEPS.length - 1;
  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[9992] flex items-end justify-center bg-black/55 p-4 text-right text-white backdrop-blur-sm sm:items-center">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1626] p-6 shadow-2xl">
        <p className="text-xs font-semibold text-emerald-300">جولة سريعة {index + 1} / {TOUR_STEPS.length}</p>
        <h2 className="mt-3 text-2xl font-bold">{step.title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{step.body}</p>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" onClick={onSkip} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">تخطي</button>
          <button type="button" onClick={() => last ? onComplete?.() : setIndex((value) => value + 1)} className="va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white">
            {last ? "إنهاء الجولة" : "التالي"}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
