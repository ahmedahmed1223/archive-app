import {
  Archive,
  CirclePlus,
  FolderOpen,
  Search,
  Star,
  Trash2,
  Video,
  legacyJsxRuntime,
  legacyMotion
} from "../../runtime/legacyAdapter.js";

const { jsx, jsxs } = legacyJsxRuntime;
const motion = legacyMotion;

function getDefaultIcon(type) {
  const iconClassName = "h-16 w-16";
  const icons = {
    archive: jsx(Archive, { className: iconClassName }),
    search: jsx(Search, { className: iconClassName }),
    favorites: jsx(Star, { className: iconClassName }),
    trash: jsx(Trash2, { className: iconClassName }),
    types: jsx(FolderOpen, { className: iconClassName }),
    custom: jsx(Video, { className: iconClassName })
  };
  return icons[type] || icons.custom;
}

export function EmptyState({
  type = "custom",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  hintItems = [],
  icon
}) {
  const iconElement = icon || getDefaultIcon(type);

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    className: "va-empty-state flex flex-col items-center justify-center px-4 py-16 text-center",
    dir: "rtl",
    children: [
      jsxs("div", {
        className: "relative mb-6",
        children: [
          jsx("div", {
            className: "va-empty-icon flex h-24 w-24 items-center justify-center rounded-2xl theme-panel theme-muted",
            children: iconElement
          }),
          jsx("div", {
            className: "va-empty-corner absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg theme-panel",
            children: jsx(CirclePlus, { className: "h-4 w-4 text-emerald-500" })
          })
        ]
      }),
      jsx("h3", { className: "mb-2 text-lg font-medium theme-title", children: title }),
      description && jsx("p", {
        className: "mb-4 max-w-md text-sm leading-relaxed theme-muted va-bidi-text",
        dir: "auto",
        children: description
      }),
      hintItems.length > 0 && jsx("div", {
        className: "mb-6 flex flex-wrap justify-center gap-2",
        children: hintItems.map((hint) => jsx("span", {
          className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300",
          children: hint
        }, hint))
      }),
      (actionLabel && onAction || secondaryActionLabel && onSecondaryAction) && jsxs("div", {
        className: "flex flex-wrap items-center justify-center gap-2",
        children: [
          actionLabel && onAction && jsxs("button", {
            type: "button",
            onClick: onAction,
            className: "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-emerald-500 hover:to-teal-500",
            children: [
              jsx(CirclePlus, { className: "h-4 w-4" }),
              actionLabel
            ]
          }),
          secondaryActionLabel && onSecondaryAction && jsx("button", {
            type: "button",
            onClick: onSecondaryAction,
            className: "inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white",
            children: secondaryActionLabel
          })
        ]
      })
    ]
  });
}

EmptyState.displayName = "EmptyState";
EmptyState.componentId = "empty-state";
EmptyState.migrationStatus = "native";

export default EmptyState;
