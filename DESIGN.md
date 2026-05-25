---
version: alpha
name: Video Archive v1
description: RTL-first local archive application for daily video cataloging, backup, and transfer.
colors:
  primary: "#030712"
  primary-surface: "#0B1220"
  secondary-surface: "#111827"
  elevated-surface: "#162033"
  border: "#263244"
  accent: "#14B8A6"
  accent-strong: "#0F766E"
  accent-hover: "#2DD4BF"
  accent-soft: "#0F3F3B"
  info: "#38BDF8"
  warning: "#F59E0B"
  danger: "#EF4444"
  text-primary: "#F9FAFB"
  text-secondary: "#CBD5E1"
  text-muted: "#94A3B8"
  text-inverse: "#FFFFFF"
typography:
  page-title:
    fontFamily: Segoe UI, Tahoma, sans-serif
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0px
  section-title:
    fontFamily: Segoe UI, Tahoma, sans-serif
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0px
  body:
    fontFamily: Segoe UI, Tahoma, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0px
  label:
    fontFamily: Segoe UI, Tahoma, sans-serif
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  page: 24px
components:
  panel:
    backgroundColor: "{colors.primary-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  panel-elevated:
    backgroundColor: "{colors.elevated-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  app-shell:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
  button-primary:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
  focus-ring:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.primary}"
  button-subtle:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  input:
    backgroundColor: "{colors.secondary-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  status-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.primary}"
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
  status-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
  muted-label:
    backgroundColor: "{colors.secondary-surface}"
    textColor: "{colors.text-muted}"
  divider:
    backgroundColor: "{colors.border}"
---

# Video Archive v1 Design System

## Overview

The interface is a serious RTL-first operations tool for people who catalog, search, transfer, and protect video archives every day. It should feel calm, durable, and ready for v1 use: no marketing-page drama, no decorative noise, and no mystery around sensitive operations.

The product voice is practical Arabic: short labels, direct confirmations, and clear recovery guidance. The strongest visual priority is confidence: users should always understand where they are, what will happen next, and whether their data is protected.

## Colors

The visual system uses deep neutral surfaces with a single green action accent. Color is semantic, not decorative.

- **Primary (#030712):** application background and the deepest navigation layer.
- **Primary Surface (#0B1220):** dashboard panels and high-priority operational surfaces.
- **Secondary Surface (#111827):** forms, lists, and grouped controls.
- **Accent (#14B8A6):** primary action, selected tab, healthy system state. Switchable to indigo via the accent setting.
- **Info (#38BDF8):** neutral progress, links, transfer guidance.
- **Warning (#F59E0B):** preflight warnings, risky but recoverable states.
- **Danger (#EF4444):** destructive actions only.

## Typography

Arabic readability wins over drama. Use Segoe UI/Tahoma with zero letter spacing. Page titles are compact and strong; labels are smaller but never low-contrast. Long explanatory text should be split into short operational lines.

## Layout

The application uses dense but breathable operational layouts. Desktop pages use constrained content and scan-friendly grids. Mobile layouts stack controls, preserve 44px touch targets, and avoid horizontal overflow. Related controls are grouped once; avoid cards nested inside cards.

## Elevation & Depth

Depth is created through tonal layers, borders, and subtle focus states rather than heavy shadows. Important panels may use a quiet top accent line to signal readiness or primary workflow ownership.

## Shapes

Controls use 8px radius. Operational panels use 12-16px radius. Avoid overly pill-like rectangular text controls unless the element is genuinely a badge or status chip.

## Components

Primary buttons use the accent token and include an icon when the action is concrete. Secondary buttons remain outline/ghost. Panels should include a concise kicker, a title, and direct actions when appropriate.

Inputs and selection rows must respect RTL visually while keeping technical values, paths, URLs, and shortcuts in LTR or auto direction.

## Do's and Don'ts

- Do make the next safe action obvious on dashboard, archive, import, transfer, and recovery screens.
- Do show backup/preflight status before import, transfer, restore, and permanent delete.
- Do keep Arabic labels short and avoid long text inside buttons.
- Do keep icons consistent through Lucide or the unified IconPicker.
- Don't rely on color alone for warnings or selected states.
- Don't use gradient or decorative backgrounds as the main visual identity.
- Don't let text overflow on mobile or inside RTL action rows.
