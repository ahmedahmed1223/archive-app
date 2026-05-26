const KNOWN_ERROR_PATTERNS = [
  {
    test: (message) => /quota|storage|disk full|insufficient/i.test(message),
    hint: "المساحة المتاحة لا تكفي. جرّب تصدير نسخة احتياطية ثم تفريغ بيانات قديمة."
  },
  {
    test: (message) => /unique|duplicate|already exists|موجود/i.test(message),
    hint: "هذا العنصر موجود بالفعل. غيّر الاسم أو المعرّف ثم أعد المحاولة."
  },
  {
    test: (message) => /required|missing|empty|فارغ|مطلوب/i.test(message),
    hint: "أحد الحقول المطلوبة فارغ. راجع النموذج وأكمل البيانات الناقصة."
  },
  {
    test: (message) => /network|fetch|timeout|connection/i.test(message),
    hint: "يبدو أن الاتصال انقطع. تأكد من الشبكة ثم أعد المحاولة."
  },
  {
    test: (message) => /permission|denied|forbidden|unauthorized/i.test(message),
    hint: "لا تملك صلاحية لهذا الإجراء. تواصل مع المدير لرفع الصلاحيات."
  }
];

function extractErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error.message) return String(error.message);
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function buildHint(message) {
  for (const entry of KNOWN_ERROR_PATTERNS) {
    if (entry.test(message)) return entry.hint;
  }
  return null;
}

/**
 * Report an error through the shared notification system with optional recovery action.
 *
 * Usage:
 *   reportError(showNotification, err, {
 *     context: "حفظ المستخدم",
 *     recovery: { label: "إعادة المحاولة", run: () => save(draft) }
 *   })
 *
 * Returns the notification id (string) so the caller can dismiss it later.
 */
export function reportError(showNotification, error, options = {}) {
  if (typeof showNotification !== "function") return null;
  const rawMessage = extractErrorMessage(error);
  const context = options.context || "العملية الأخيرة";
  const title = options.title || `فشل ${context}`;
  const hint = options.hint || buildHint(rawMessage);
  const message = [rawMessage || "حدث خطأ غير متوقع.", hint && `اقتراح: ${hint}`]
    .filter(Boolean)
    .join("\n");
  const payload = {
    type: "error",
    title,
    persistent: !!options.persistent
  };
  if (options.recovery && typeof options.recovery.run === "function") {
    payload.action = {
      label: options.recovery.label || "إعادة المحاولة",
      run: options.recovery.run,
      dismissOnRun: options.recovery.dismissOnRun !== false
    };
  }
  return showNotification(message, payload);
}

/**
 * Convenience wrapper that resolves the showNotification action from a store getter
 * and forwards to reportError. Useful from non-React code paths.
 */
export function createErrorReporter(getStore) {
  return function (error, options = {}) {
    const state = typeof getStore === "function" ? getStore() : getStore;
    const showNotification = state?.showNotification;
    return reportError(showNotification, error, options);
  };
}
