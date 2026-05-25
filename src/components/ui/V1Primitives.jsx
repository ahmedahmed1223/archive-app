import { motion } from "framer-motion";
import * as React from "react";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const toneClasses = {
  accent: "va-tone-accent",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  slate: "border-white/10 bg-white/5 text-gray-300"
};

export function StatusBadge({ tone = "slate", children, className = "" }) {
  return (
    <span className={cx("va-status-badge inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", toneClasses[tone] || toneClasses.slate, className)}>
      {children}
    </span>
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
