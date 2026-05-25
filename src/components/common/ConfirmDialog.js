const dialogStyleId = "video-archive-native-dialog-styles";

function ensureDialogStyles() {
  if (typeof document === "undefined" || document.getElementById(dialogStyleId)) return;
  const style = document.createElement("style");
  style.id = dialogStyleId;
  style.textContent = `
    .va-native-dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(3, 7, 18, 0.72);
      backdrop-filter: blur(10px);
      direction: rtl;
    }
    .va-native-dialog-panel {
      width: min(100%, 32rem);
      border: 1px solid var(--va-line-soft, rgba(255, 255, 255, 0.12));
      border-radius: 1.25rem;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018)),
        var(--color-bg-surface, #0b1626);
      color: var(--color-text-primary, #f8fafc);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      padding: 1.25rem;
      text-align: right;
    }
    .va-native-dialog-title {
      margin: 0;
      color: var(--color-text-primary, #fff);
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.6;
    }
    .va-native-dialog-message {
      margin: .75rem 0 0;
      color: var(--color-text-secondary, #cbd5e1);
      font-size: .9rem;
      line-height: 1.8;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      unicode-bidi: plaintext;
    }
    .va-native-dialog-input {
      margin-top: 1rem;
      width: 100%;
      min-height: 2.75rem;
      border: 1px solid var(--va-line-soft, rgba(255, 255, 255, 0.12));
      border-radius: .85rem;
      background: color-mix(in srgb, var(--color-bg-primary, #07111f) 82%, transparent);
      color: var(--color-text-primary, #fff);
      padding: .65rem .8rem;
      outline: none;
      text-align: right;
    }
    .va-native-dialog-input:focus {
      border-color: color-mix(in srgb, var(--va-action, #14b8a6) 58%, transparent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--va-action, #14b8a6) 14%, transparent);
    }
    .va-native-dialog-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: .5rem;
      margin-top: 1.25rem;
    }
    .va-native-dialog-button {
      min-height: 2.5rem;
      border: 1px solid var(--va-line-soft, rgba(255, 255, 255, 0.12));
      border-radius: .85rem;
      padding: .55rem 1rem;
      color: var(--color-text-secondary, #e2e8f0);
      background: color-mix(in srgb, var(--color-bg-primary, #07111f) 72%, transparent);
      font: inherit;
      cursor: pointer;
    }
    .va-native-dialog-button:hover {
      background: color-mix(in srgb, var(--va-action, #14b8a6) 12%, transparent);
    }
    .va-native-dialog-confirm {
      border-color: color-mix(in srgb, var(--va-action, #14b8a6) 42%, transparent);
      background: var(--va-action-strong, #0f766e);
      color: #fff;
    }
    .va-native-dialog-confirm:hover {
      background: var(--va-action, #14b8a6);
    }
    .va-native-dialog-danger {
      border-color: rgba(239, 68, 68, 0.42);
      background: #dc2626;
    }
    .va-native-dialog-danger:hover {
      background: #ef4444;
    }
    @media (max-width: 640px) {
      .va-native-dialog-backdrop { align-items: flex-end; }
      .va-native-dialog-panel { border-radius: 1.25rem 1.25rem 0 0; }
      .va-native-dialog-actions { justify-content: stretch; }
      .va-native-dialog-button { flex: 1 1 auto; }
    }
  `;
  document.head.appendChild(style);
}

function normalizeDialogInput(message, options = {}) {
  const fromObject = typeof message === "object" && message !== null ? message : {};
  const finalOptions = { ...options, ...fromObject };
  return {
    title: finalOptions.title || "تنبيه",
    message: finalOptions.message || finalOptions.description || String(message || ""),
    kind: finalOptions.kind || "info",
    confirmLabel: finalOptions.confirmLabel,
    cancelLabel: finalOptions.cancelLabel,
    defaultValue: finalOptions.defaultValue || ""
  };
}

function fallbackDialog(request, mode) {
  console.warn("[VideoArchiveDialog]", [request.title, request.message].filter(Boolean).join(" | "));
  if (mode === "prompt") return Promise.resolve(null);
  if (mode === "confirm") return Promise.resolve(false);
  return Promise.resolve(true);
}

function openNativeDialog(message, options = {}, mode = "alert") {
  const request = normalizeDialogInput(message, options);
  if (typeof document === "undefined" || typeof window === "undefined") {
    return Promise.resolve(mode === "confirm" ? false : mode === "prompt" ? null : true);
  }
  if (!document.body) return fallbackDialog(request, mode);

  ensureDialogStyles();

  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "va-native-dialog-backdrop";
    backdrop.dir = "rtl";

    const panel = document.createElement("section");
    panel.className = "va-native-dialog-panel";
    panel.setAttribute("role", mode === "alert" ? "alertdialog" : "dialog");
    panel.setAttribute("aria-modal", "true");

    const title = document.createElement("h2");
    title.className = "va-native-dialog-title";
    title.textContent = request.title;

    const body = document.createElement("p");
    body.className = "va-native-dialog-message";
    body.dir = "auto";
    body.textContent = request.message;

    panel.append(title, body);

    let input = null;
    if (mode === "prompt") {
      input = document.createElement("input");
      input.className = "va-native-dialog-input";
      input.dir = "auto";
      input.value = request.defaultValue;
      panel.append(input);
    }

    const actions = document.createElement("div");
    actions.className = "va-native-dialog-actions";

    const cleanup = (value) => {
      document.removeEventListener("keydown", onKeyDown);
      backdrop.remove();
      resolve(value);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") cleanup(mode === "confirm" ? false : mode === "prompt" ? null : true);
      if (event.key === "Enter" && mode !== "alert") cleanup(mode === "prompt" ? input.value : true);
    };

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = `va-native-dialog-button va-native-dialog-confirm ${request.kind === "danger" ? "va-native-dialog-danger" : ""}`;
    confirmButton.textContent = request.confirmLabel || (mode === "alert" ? "حسنًا" : "متابعة");
    confirmButton.addEventListener("click", () => cleanup(mode === "prompt" ? input.value : true));

    if (mode !== "alert") {
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "va-native-dialog-button";
      cancelButton.textContent = request.cancelLabel || "إلغاء";
      cancelButton.addEventListener("click", () => cleanup(mode === "confirm" ? false : null));
      actions.append(cancelButton);
    }

    actions.append(confirmButton);
    panel.append(actions);
    backdrop.append(panel);
    document.body.append(backdrop);
    document.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => (input || confirmButton).focus());
  });
}

export function appAlert(message, options = {}) {
  return openNativeDialog(message, { title: "تنبيه", confirmLabel: "حسنًا", ...options }, "alert");
}

export function appConfirm(message, options = {}) {
  return openNativeDialog(message, { title: "تأكيد الإجراء", confirmLabel: "متابعة", cancelLabel: "إلغاء", kind: "warning", ...options }, "confirm");
}

export function appPrompt(message, options = {}) {
  const normalizedOptions = typeof options === "string" ? { defaultValue: options } : options;
  return openNativeDialog(message, { title: "إدخال مطلوب", confirmLabel: "حفظ", cancelLabel: "إلغاء", ...normalizedOptions }, "prompt");
}
