# Tasks

## Active

- [ ] **توحيد design tokens** - دمج طبقات tokens المكرّرة بين `app-overrides.css` و `v1-identity.css`
  - 13 hex value هاردكود (emerald) محوّلين لـ var(--va-action) جزئيًا
  - متبقّي: settings tabs، mobile FAB، list numbers، va-mobile-fab box-shadow
- [ ] **بناء + PR للتوحيد** - npm run build، فرع وPR على main

## Waiting On

## Someday

- [ ] **P0 #3 من UI_AUDIT.md** - تطبيق V1Primitives على باقي الصفحات (Archive, Collections, Types, Users, Vocabulary, HierarchicalTags, Settings, DataCenter, History, Reports, AddVideo, Detail)
- [ ] **ConfirmDialog: action icon prop** - تعديل EmptyState لتقبّل icon مخصّص للزر (CirclePlus غير ملائم لـ "مسح البحث")
- [ ] **Phase 3 من خطة UI/UX** - تحسين تدفقات Add Video / Import / Transfer / Backup
- [ ] **Phase 4 - Responsive وأداء** - virtualization للأرشيف، skeleton أوسع
- [ ] **Phase 5 - A11y + Onboarding** - WCAG 2.1 AA pass

## Done

- [x] ~~فحص نظام التصميم الحالي وإصدار UI_AUDIT.md~~ (2026-05-25)
- [x] ~~PR #2: V1Primitives في Dashboard + EmptyState في 6 صفحات~~ (2026-05-25)
- [x] ~~PR #3: EmptyState في Vocabulary/HierarchicalTags + PageHero في Search~~ (2026-05-25)
- [x] ~~PR #4: ConfirmDialog كمكوّن React (−160 سطر)~~ (2026-05-25)
- [x] ~~تحديث DESIGN.md ليتطابق مع accent teal الحقيقي~~ (2026-05-25)
