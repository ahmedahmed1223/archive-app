import { PAGE_COMPONENTS } from "./pageRegistry.js";
import { getPageContextMeta } from "./pageMeta.js";
import {
  AppErrorBoundary,
  AppPageContextBar,
  AppSidebar,
  CommandPalette,
  DashboardSkeleton,
  ForceChangePasswordDialog,
  KeyboardShortcutsDialog,
  LockScreen,
  LoginScreen,
  SplashScreen,
  StartupRecoveryScreen,
  StatusBar,
  ToastNotification,
  UndoRedoBar,
  V1ProductTour,
  appConfirm,
  createStartupProgressState,
  handleAppError,
  legacyJsxRuntime,
  legacyMotion,
  legacyReact,
  legacyReactDOM,
  normalizeAppError,
  parseAppRoute,
  runStartupSequence,
  undoRedoManager,
  useAppStore,
  useAuthStore,
  useSessionStore,
  useTheme
} from "../runtime/legacyAdapter.js";
import { getGlobalShortcutAction } from "../stores/globalShortcuts.js";
import { applyAccentColor } from "../theme/accentColor.js";
import {
  V1OnboardingWizard,
  shouldShowStartupOnboarding
} from "../features/onboarding/index.js";

const { jsx, jsxs } = legacyJsxRuntime;
const motion = legacyMotion;

export function App() {
  const {
    isLoading,
    isLocked,
    currentPage,
    loadAllData,
    setCurrentPage,
    setSelectedItemId,
    setViewMode,
    showToast,
    isPasswordSet,
    lockApp,
    settings,
    updateSettings,
    runSystemHealthCheck,
    toggleNotificationCenter
  } = useAppStore();
  const { isAuthenticated, currentUser, initAuth, logout } = useAuthStore();
  const { isIdleLocked } = useSessionStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showShortcuts, setShowShortcuts] = legacyReact.useState(false);
  const [showCommandPalette, setShowCommandPalette] = legacyReact.useState(false);
  const [showV1Tour, setShowV1Tour] = legacyReact.useState(false);
  const [showSplash, setShowSplash] = legacyReact.useState(true);
  const [startupProgress, setStartupProgress] = legacyReact.useState(() => createStartupProgressState({ progress: 1 }));
  const [startupRecovery, setStartupRecovery] = legacyReact.useState(null);
  const [onboardingWizardMode, setOnboardingWizardMode] = legacyReact.useState(null);
  const [authState, setAuthState] = legacyReact.useState("loading");
  const loadInitRef = legacyReact.useRef(false);
  const initialSyncRef = legacyReact.useRef(false);
  const startupHealthRef = legacyReact.useRef(false);
  const postLoginRouteRef = legacyReact.useRef(false);

  legacyReact.useEffect(() => {
    if (!isLoading && !initialSyncRef.current) {
      initialSyncRef.current = true;
      if (settings.theme && settings.theme !== theme) {
        setTheme(settings.theme);
      }
    }
  }, [isLoading, settings.theme, theme, setTheme]);

  legacyReact.useEffect(() => {
    if (initialSyncRef.current && settings.theme !== theme) {
      updateSettings({ theme });
    }
  }, [theme]);

  legacyReact.useEffect(() => {
    applyAccentColor(settings.accentColor || "teal");
  }, [settings.accentColor]);

  legacyReact.useEffect(() => {
    if (!loadInitRef.current) {
      loadInitRef.current = true;
      let splashTimer;
      const init = async () => {
        try {
          const result = await runStartupSequence({
            mode: settings.ui?.startupMode || "balanced",
            loadAllData,
            initAuth,
            onStep: setStartupProgress
          });
          if (!result.ok && result.fatalError) {
            setStartupRecovery({
              fatalError: result.fatalError,
              warnings: result.warnings,
              steps: result.steps
            });
          }
        } catch (error) {
          handleAppError(error, "تهيئة التطبيق", {
            message: "تعذر إكمال تهيئة التطبيق. تم فتح الواجهة بوضع محدود لتتمكن من فحص النظام.",
            type: "error"
          });
          const normalized = normalizeAppError(error);
          setStartupRecovery({
            fatalError: normalized,
            warnings: [{ id: "startup", message: normalized.userMessage || normalized.message, severity: "error", at: new Date().toISOString() }]
          });
        } finally {
          splashTimer = setTimeout(() => setShowSplash(false), 250);
        }
      };
      init();
      return () => {
        if (splashTimer) clearTimeout(splashTimer);
      };
    }
  }, [loadAllData, initAuth]);

  legacyReact.useEffect(() => {
    if (isLoading || authState !== "ready" || startupHealthRef.current) return;
    const lastCheckAt = settings.systemHealth?.lastCheckAt;
    const isFresh = lastCheckAt && Date.now() - new Date(lastCheckAt).getTime() < 24 * 60 * 60 * 1e3;
    if (isFresh) return;
    startupHealthRef.current = true;
    const timer = setTimeout(() => {
      runSystemHealthCheck?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading, authState, settings.systemHealth?.lastCheckAt, runSystemHealthCheck]);

  legacyReact.useEffect(() => {
    if (isLoading || authState !== "ready" || !settings.helpAutoOpenPending) return;
    const tourPending = !settings.ui?.v1TourCompleted && (settings.ui?.v1OnboardingCompleted || settings.ui?.onboardingCompleted);
    if (tourPending) {
      updateSettings({ helpAutoOpenPending: false });
      return;
    }
    try {
      const route = parseAppRoute();
      if (!route.page || route.page === "dashboard") {
        setCurrentPage("help");
        showToast("فتحنا دليل البدء السريع مرة واحدة لمساعدتك على الانطلاق.", "info");
      }
    } catch {
    }
    updateSettings({ helpAutoOpenPending: false });
  }, [
    isLoading,
    authState,
    settings.helpAutoOpenPending,
    settings.ui?.v1TourCompleted,
    settings.ui?.v1OnboardingCompleted,
    settings.ui?.onboardingCompleted,
    setCurrentPage,
    showToast,
    updateSettings
  ]);

  legacyReact.useEffect(() => {
    const applyPageFromLocation = () => {
      const route = parseAppRoute();
      const page = route.page || "dashboard";
      if (!PAGE_COMPONENTS[page]) return;
      window.__videoArchiveApplyingHistory = true;
      setSelectedItemId(page === "detail" ? route.selectedItemId : null);
      setCurrentPage(page);
      window.__videoArchiveApplyingHistory = false;
    };
    applyPageFromLocation();
    window.addEventListener("popstate", applyPageFromLocation);
    window.addEventListener("hashchange", applyPageFromLocation);
    return () => {
      window.removeEventListener("popstate", applyPageFromLocation);
      window.removeEventListener("hashchange", applyPageFromLocation);
    };
  }, [setCurrentPage, setSelectedItemId]);

  legacyReact.useEffect(() => {
    const handleExternalChange = (event) => {
      if (event.key !== "videoArchive:lastChange" || !event.newValue) return;
      loadAllData();
    };
    window.addEventListener("storage", handleExternalChange);
    return () => window.removeEventListener("storage", handleExternalChange);
  }, [loadAllData]);

  legacyReact.useEffect(() => {
    if (isLoading) {
      setAuthState("loading");
      return;
    }
    if (isIdleLocked) {
      setAuthState("locked");
      return;
    }
    if (isAuthenticated && currentUser) {
      if (isLocked) {
        useAppStore.setState({ isLocked: false });
      }
      setAuthState("ready");
      return;
    }
    if (isPasswordSet && isLocked) {
      setAuthState("login");
      return;
    }
    if (!isLocked) {
      const appStore = useAppStore.getState();
      const hasUsers = appStore.users.some((user) => user.isActive);
      if (settings.onboardingRequired || settings.initialAdminPassword || (!isPasswordSet && !hasUsers)) {
        setAuthState("setup");
        return;
      }
      if (!isPasswordSet && hasUsers && settings.ui?.onboardingSecurityMode === "quick" && settings.ui?.v1OnboardingCompleted) {
        const activeUser = appStore.users.find((user) => user.username === "admin" && user.isActive) || appStore.users.find((user) => user.isActive);
        if (activeUser && !useAuthStore.getState().currentUser) {
          useAuthStore.setState({ currentUser: activeUser, isAuthenticated: true, authError: null });
        }
        setAuthState("ready");
        return;
      }
      if (!isPasswordSet && hasUsers) {
        setAuthState("login");
        return;
      }
      setAuthState("ready");
      return;
    }
    setAuthState("login");
  }, [isLoading, isAuthenticated, currentUser, isLocked, isPasswordSet, isIdleLocked]);

  legacyReact.useEffect(() => {
    const openOnboarding = (event) => {
      setOnboardingWizardMode(event.detail?.mode === "replay" ? "replay" : "startup");
    };
    const closeOnboarding = () => setOnboardingWizardMode(null);
    window.addEventListener("videoarchive:onboarding-open", openOnboarding);
    window.addEventListener("videoarchive:onboarding-close", closeOnboarding);
    return () => {
      window.removeEventListener("videoarchive:onboarding-open", openOnboarding);
      window.removeEventListener("videoarchive:onboarding-close", closeOnboarding);
    };
  }, []);

  legacyReact.useEffect(() => {
    if (shouldShowStartupOnboarding({ authState, settings })) {
      setOnboardingWizardMode((mode) => mode || "startup");
    } else if (onboardingWizardMode === "startup" && authState !== "setup") {
      setOnboardingWizardMode(null);
    }
  }, [authState, onboardingWizardMode, settings]);

  legacyReact.useEffect(() => {
    if (!currentUser) {
      postLoginRouteRef.current = false;
      return;
    }
    if (authState !== "ready" || postLoginRouteRef.current) return;
    const pageSegment = typeof window !== "undefined" ? parseAppRoute().page : "";
    if (pageSegment && pageSegment !== "dashboard") {
      postLoginRouteRef.current = true;
      return;
    }
    const firstTaskChoice = settings.ui?.firstTaskChoiceUsed ? null : settings.ui?.firstTaskChoice;
    const firstTaskRoute = {
      "import-backup": "backup",
      "add-video": "add",
      "create-type": "types",
      dashboard: "dashboard"
    }[firstTaskChoice];
    const targetPage = firstTaskRoute || (currentUser.role === "admin" ? "settings" : currentUser.role === "editor" ? "archive" : "search");
    setSelectedItemId(null);
    setCurrentPage(targetPage);
    postLoginRouteRef.current = true;
    updateSettings({
      ui: {
        ...(settings.ui || {}),
        onboardingCompleted: true,
        v1OnboardingCompleted: true,
        firstTaskChoiceUsed: true,
        lastOnboardingStep: "daily-start",
        lastDataCenterTab: firstTaskChoice === "import-backup" ? "import" : settings.ui?.lastDataCenterTab || "export"
      }
    });
  }, [authState, currentUser, setCurrentPage, setSelectedItemId, settings.ui, updateSettings]);

  legacyReact.useEffect(() => {
    if (authState !== "ready" || !currentUser) return;
    if (currentPage !== "dashboard") return;
    if (settings.ui?.v1TourCompleted) return;
    if (!settings.ui?.v1OnboardingCompleted && !settings.ui?.onboardingCompleted) return;
    const timer = setTimeout(() => setShowV1Tour(true), 700);
    return () => clearTimeout(timer);
  }, [authState, currentUser, currentPage, settings.ui?.v1TourCompleted, settings.ui?.v1OnboardingCompleted, settings.ui?.onboardingCompleted]);

  const completeV1Tour = legacyReact.useCallback(async (skipped = false) => {
    setShowV1Tour(false);
    await updateSettings({
      ui: {
        ...(settings.ui || {}),
        v1OnboardingCompleted: true,
        v1TourCompleted: true,
        onboardingSkippedAt: skipped ? new Date().toISOString() : settings.ui?.onboardingSkippedAt || null,
        lastOnboardingStep: skipped ? "tour-skipped" : "tour-completed"
      }
    });
  }, [settings.ui, updateSettings]);

  const openStartupDiagnostics = legacyReact.useCallback(async () => {
    setStartupRecovery(null);
    setShowSplash(false);
    setSelectedItemId(null);
    setCurrentPage("settings");
    try {
      await updateSettings({ ui: { ...(settings.ui || {}), startupRecoveryDismissedAt: new Date().toISOString() } });
      await runSystemHealthCheck?.();
    } catch (error) {
      handleAppError(error, "فتح فحص بدء التشغيل", { message: "تعذر فتح فحص النظام" });
    }
  }, [setCurrentPage, setSelectedItemId, updateSettings, runSystemHealthCheck, settings.ui]);

  const retryStartup = legacyReact.useCallback(() => {
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  const handleKeyDown = legacyReact.useCallback((event) => {
    const shortcutAction = getGlobalShortcutAction(event, settings);
    if (!shortcutAction) return;

    if (shortcutAction === "showShortcuts") {
      event.preventDefault();
      setShowShortcuts(true);
      return;
    }
    if (shortcutAction === "openCommandPalette") {
      event.preventDefault();
      setShowCommandPalette(true);
      return;
    }
    if (shortcutAction === "openSearch") {
      event.preventDefault();
      setSelectedItemId(null);
      setCurrentPage("search");
      return;
    }
    if (shortcutAction === "toggleNotifications") {
      event.preventDefault();
      toggleNotificationCenter();
      return;
    }
    if (shortcutAction === "openBackup") {
      event.preventDefault();
      setSelectedItemId(null);
      setCurrentPage("backup");
      return;
    }
    if (shortcutAction === "openDashboard") {
      event.preventDefault();
      setSelectedItemId(null);
      setCurrentPage("dashboard");
      return;
    }
    if (shortcutAction === "logout") {
      event.preventDefault();
      logout();
      return;
    }
    if (shortcutAction === "lockApp") {
      event.preventDefault();
      lockApp();
      return;
    }
    if (shortcutAction === "undo") {
      event.preventDefault();
      const action = undoRedoManager.undo();
      if (action) showToast(`تراجع: ${action.description}`, "info");
      return;
    }
    if (shortcutAction === "redo") {
      event.preventDefault();
      const action = undoRedoManager.redo();
      if (action) showToast(`إعادة: ${action.description}`, "info");
      return;
    }
    if (shortcutAction === "viewGrid") {
      event.preventDefault();
      setViewMode("grid");
      return;
    }
    if (shortcutAction === "viewList") {
      event.preventDefault();
      setViewMode("list");
      return;
    }
    if (shortcutAction === "viewTable") {
      event.preventDefault();
      setViewMode("table");
      return;
    }
    if (shortcutAction === "deleteSelected") {
      const selectedItems = useAppStore.getState().selectedItems;
      if (selectedItems.length > 0) {
        event.preventDefault();
        appConfirm(`سيتم نقل ${selectedItems.length} عنصر إلى سلة المحذوفات. هل تريد المتابعة؟`, {
          title: "تأكيد الحذف",
          kind: "danger",
          confirmLabel: "حذف"
        }).then((confirmed) => {
          if (confirmed) useAppStore.getState().bulkDeleteItems(selectedItems);
        });
      }
      return;
    }
    if (shortcutAction === "goBack") {
      if (showShortcuts) {
        setShowShortcuts(false);
        return;
      }
      if (showCommandPalette) {
        setShowCommandPalette(false);
        return;
      }
      const page = useAppStore.getState().currentPage;
      if (page === "detail" || page === "add") {
        setSelectedItemId(null);
        setCurrentPage("archive");
      } else if (page !== "dashboard") {
        setSelectedItemId(null);
        setCurrentPage("dashboard");
      }
    }
  }, [
    settings,
    setCurrentPage,
    setSelectedItemId,
    setViewMode,
    showToast,
    showShortcuts,
    showCommandPalette,
    lockApp,
    logout,
    toggleNotificationCenter
  ]);

  legacyReact.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (showSplash && (isLoading || startupProgress?.running)) {
    return jsx(SplashScreen, {
      steps: startupProgress?.steps,
      currentStepId: startupProgress?.currentStepId,
      progress: startupProgress?.progress,
      warnings: startupProgress?.warnings || [],
      fatalError: startupProgress?.fatalError,
      onOpenDiagnostics: openStartupDiagnostics
    });
  }

  if (startupRecovery?.fatalError) {
    return jsx(StartupRecoveryScreen, { report: startupRecovery, onRetry: retryStartup, onOpenDiagnostics: openStartupDiagnostics });
  }

  if (onboardingWizardMode) {
    return jsx(V1OnboardingWizard, {
      open: true,
      mode: onboardingWizardMode,
      onComplete: () => setOnboardingWizardMode(null),
      onCancel: () => setOnboardingWizardMode(null)
    });
  }

  if (isLoading) {
    return jsxs("div", {
      className: `flex min-h-screen ${resolvedTheme === "dark" ? "bg-gray-950" : "bg-white"}`,
      children: [
        jsxs("div", {
          className: `hidden md:flex w-[280px] ${resolvedTheme === "dark" ? "bg-gray-950" : "bg-white"} border-l ${resolvedTheme === "dark" ? "border-white/10" : "border-gray-200"} flex-col shrink-0`,
          children: [
            jsxs("div", {
              className: `flex items-center gap-3 p-6 border-b ${resolvedTheme === "dark" ? "border-white/10" : "border-gray-200"}`,
              children: [
                jsx("div", { className: `h-10 w-10 ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded-xl animate-pulse` }),
                jsxs("div", {
                  className: "space-y-2 flex-1",
                  children: [
                    jsx("div", { className: `h-4 w-24 ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded animate-pulse` }),
                    jsx("div", { className: `h-3 w-32 ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded animate-pulse` })
                  ]
                })
              ]
            }),
            jsx("div", {
              className: "py-4 px-3 space-y-1",
              children: Array.from({ length: 8 }).map((_, index) => jsx("div", {
                className: `h-11 ${resolvedTheme === "dark" ? "bg-gray-800/50" : "bg-gray-100"} rounded-xl animate-pulse`
              }, index))
            })
          ]
        }),
        jsx("div", { className: "flex-1", children: jsx(DashboardSkeleton, {}) })
      ]
    });
  }

  if (authState === "locked") {
    return jsx(LockScreen, {});
  }

  if (authState === "login" || authState === "setup") {
    return jsx(LoginScreen, {});
  }

  const PageComponent = PAGE_COMPONENTS[currentPage] || PAGE_COMPONENTS.dashboard;
  const currentPageTitle = getPageContextMeta(currentPage)?.title || "أرشيف الفيديو";

  return jsxs("div", {
    dir: "rtl",
    className: `flex min-h-screen text-right ${resolvedTheme === "dark" ? "bg-gray-950" : "bg-white"}`,
    children: [
      jsx("a", {
        href: "#main-content",
        className: "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[1000] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-3 focus:text-white focus:shadow-lg",
        children: "تخطي إلى المحتوى الرئيسي"
      }),
      jsx(AppSidebar, {}),
      jsx("main", {
        id: "main-content",
        tabIndex: -1,
        dir: "rtl",
        className: "flex-1 min-w-0 overflow-y-auto max-h-screen text-right",
        role: "main",
        children: jsx(AppErrorBoundary, {
          children: jsxs(motion.div, {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -8 },
            transition: { duration: 0.2 },
            className: "min-h-screen",
            children: [
              jsx("h1", { className: "sr-only", children: currentPageTitle }),
              jsx(AppPageContextBar, { currentPage, currentPageTitle }),
              jsx(PageComponent, {})
            ]
          }, currentPage)
        })
      }),
      jsx(ToastNotification, {}),
      jsx(UndoRedoBar, {}),
      jsx(StatusBar, {}),
      jsx(KeyboardShortcutsDialog, { open: showShortcuts, onOpenChange: setShowShortcuts }),
      jsx(CommandPalette, { open: showCommandPalette, onOpenChange: setShowCommandPalette, onOpenShortcuts: () => setShowShortcuts(true) }),
      jsx(V1ProductTour, { open: showV1Tour, onComplete: () => completeV1Tour(false), onSkip: () => completeV1Tour(true) }),
      jsx(ForceChangePasswordDialog, {})
    ]
  });
}

export function mountVideoArchive(rootElement = document.getElementById("root")) {
  if (!rootElement) {
    throw new Error("Video Archive root element was not found.");
  }

  return legacyReactDOM.createRoot(rootElement).render(
    jsx(legacyReact.StrictMode, { children: jsx(App, {}) })
  );
}

export default App;
