import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const pageMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
};

const toneClasses = {
  accent: "va-tone-accent",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  slate: "border-white/10 bg-white/5 text-gray-300"
};

function renderWorkflowIcon(icon) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "string") return <span aria-hidden="true">{icon}</span>;
  return React.createElement(icon, { className: "h-4 w-4 shrink-0" });
}

export function StatusBadge({ tone = "slate", children, className = "" }) {
  return (
    <span className={cx("va-status-badge inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", toneClasses[tone] || toneClasses.slate, className)}>
      {children}
    </span>
  );
}

export function PageShell({ children, className = "", as: Component = "div", ...props }) {
  return (
    <Component className={cx("va-page-shell", className)} dir="rtl" {...props}>
      {children}
    </Component>
  );
}

export function MotionPage({ children, className = "", ...props }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={cx("va-page-shell va-motion-page", className)}
      dir="rtl"
      initial={reducedMotion ? false : pageMotion.initial}
      animate={pageMotion.animate}
      exit={reducedMotion ? undefined : pageMotion.exit}
      transition={reducedMotion ? { duration: 0 } : pageMotion.transition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PageHero({ icon, title, description, actions, children, className = "" }) {
  return (
    <section className={cx("va-page-hero rounded-2xl border border-white/10 bg-gradient-to-l from-gray-900 via-gray-900/95 to-gray-950 p-5 text-right shadow-2xl shadow-black/10", className)} dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="va-title flex items-center gap-2 text-2xl font-bold text-white">
            {icon}
            {title}
          </h2>
          {description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Stepper({ steps, activeStepId, className = "" }) {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));
  return (
    <ol className={cx("va-stepper-rtl grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 text-right", className)} dir="rtl">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className={cx(
            "rounded-xl border px-3 py-2",
            index === activeIndex
              ? "border-emerald-400/45 bg-emerald-500/15 text-white"
              : index < activeIndex
                ? "border-emerald-500/20 bg-emerald-500/5 text-gray-200"
                : "border-white/5 bg-white/[0.02] text-gray-500"
          )}
        >
          <span className="va-number-badge text-xs">{String(index + 1).padStart(2, "0")}</span>
          <p className="mt-1 text-sm font-semibold">{step.label}</p>
          {step.detail && <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-gray-500">{step.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

export function WorkflowStepper({
  steps,
  activeStepId,
  completedStepIds = [],
  onStepClick,
  className = "",
  compact = false
}) {
  const reducedMotion = useReducedMotion();
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));

  return (
    <motion.ol
      className={cx("va-workflow-stepper va-stepper-rtl grid gap-3 text-right", compact ? "va-workflow-stepper-compact" : "", className)}
      dir="rtl"
      variants={reducedMotion ? undefined : staggerContainer}
      initial={reducedMotion ? false : "initial"}
      animate="animate"
    >
      {steps.map((step, index) => {
        const active = step.id === activeStepId;
        const done = completedStepIds.includes(step.id) || step.status === "done" || index < activeIndex;
        const warning = step.status === "warning";
        const error = step.status === "error";
        const clickable = typeof onStepClick === "function";
        const stepIcon = renderWorkflowIcon(step.icon);
        const content = (
          <>
            <span className="va-workflow-step-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold">
                {stepIcon}
                <span>{step.label}</span>
              </span>
              {(step.detail || step.description) && (
                <span className="mt-1 block text-xs leading-5 text-gray-500">{step.detail || step.description}</span>
              )}
            </span>
          </>
        );

        return (
          <motion.li
            key={step.id}
            variants={reducedMotion ? undefined : staggerItem}
            className={cx(
              "va-workflow-step rounded-2xl border",
              active ? "va-workflow-step-active" : "",
              done ? "va-workflow-step-done" : "",
              warning ? "va-workflow-step-warning" : "",
              error ? "va-workflow-step-error" : ""
            )}
            aria-current={active ? "step" : undefined}
          >
            {clickable ? (
              <button type="button" onClick={() => onStepClick(step.id)} className="flex w-full items-start gap-3 rounded-2xl p-3 text-right">
                {content}
              </button>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl p-3">{content}</div>
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

export function MetricCard({ label, value, hint, icon, tone = "accent", className = "" }) {
  return (
    <section className={cx("va-metric-card rounded-xl border p-4 text-right", className)} dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {hint && <p className="mt-2 text-xs leading-relaxed text-gray-500">{hint}</p>}
        </div>
        {icon && (
          <span className={cx("va-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClasses[tone] || toneClasses.accent)}>
            {icon}
          </span>
        )}
      </div>
    </section>
  );
}

export function ActionCard({ label, detail, icon, onClick, tone = "accent", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx("va-action-card group flex min-h-[92px] w-full items-center gap-3 rounded-xl border border-white/10 bg-gray-800/30 p-4 text-right transition-colors hover:border-emerald-500/25 hover:bg-white/5", className)}
    >
      {icon && (
        <span className={cx("va-icon-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", toneClasses[tone] || toneClasses.accent)}>
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white group-hover:text-emerald-100">{label}</span>
        {detail && <span className="mt-1 block text-xs leading-relaxed text-gray-500">{detail}</span>}
      </span>
    </button>
  );
}

export function FormSection({ title, description, icon, actions, children, className = "" }) {
  return (
    <section className={cx("va-card rounded-2xl border border-white/10 bg-gray-900/50 p-5 text-right backdrop-blur-sm", className)} dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            {icon}
            {title}
          </h3>
          {description && <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>}
        </div>
        {actions}
      </div>
      {children && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <div className={cx("va-skeleton rounded-xl", className)} aria-hidden="true" />;
}

export function FloatingActionBar({ children, className = "", label = "إجراءات سريعة" }) {
  return (
    <div className={cx("va-floating-action-bar", className)} dir="rtl" aria-label={label}>
      {children}
    </div>
  );
}

export function InsightPanel({ icon, title, description, actions, children, tone = "accent", className = "" }) {
  return (
    <section className={cx("va-insight-panel rounded-2xl border p-4 text-right", `va-insight-panel-${tone}`, className)} dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && <span className={cx("va-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClasses[tone] || toneClasses.accent)}>{icon}</span>}
          <div className="min-w-0">
            {title && <h3 className="text-base font-bold text-white">{title}</h3>}
            {description && <p className="mt-1 text-sm leading-7 text-gray-400">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

export function UXEmptyState({ icon, title, description, actions, className = "" }) {
  return (
    <section className={cx("va-ux-empty-state rounded-2xl border border-dashed p-8 text-center", className)} dir="rtl">
      {icon && <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-gray-400">{icon}</div>}
      {title && <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>}
      {description && <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-gray-500">{description}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </section>
  );
}

export function ResponsiveTabs({ tabs, activeTab, onChange, ariaLabel = "تبويبات", className = "" }) {
  return (
    <nav className={cx("va-tab-surface rounded-2xl border border-white/10 bg-gray-900/50 p-2", className)} dir="rtl" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cx("relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition-colors", selected ? "text-emerald-100" : "text-gray-400 hover:bg-white/5 hover:text-white")}
            aria-current={selected ? "page" : undefined}
          >
            {selected && <motion.span layoutId={`${ariaLabel}-active-tab`} className="absolute inset-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10" />}
            {Icon && <Icon className="relative h-4 w-4" />}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function EntityCard({ title, description, icon, meta, actions, selected = false, onClick, children, className = "" }) {
  const Wrapper = onClick ? "button" : "article";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "va-entity-card va-card-subtle block w-full rounded-2xl border p-4 text-right transition-colors",
        selected ? "border-emerald-500/35 bg-emerald-500/10" : "border-white/10 bg-gray-950/30 hover:border-emerald-500/25 hover:bg-white/[0.04]",
        className
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            {icon}
            <span className="truncate">{title}</span>
          </h3>
          {description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">{meta}</div>}
        </div>
        {actions}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </Wrapper>
  );
}
