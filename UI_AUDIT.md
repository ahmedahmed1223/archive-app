# UI/UX Audit — Video Archive v1

> تاريخ التدقيق: 2026-05-25
> النطاق: نظام التصميم + 15 صفحة + مكتبة المكوّنات في `src/components`
> المرجع: [DESIGN.md](DESIGN.md)

---

## 1. ملخص تنفيذي

نظام التصميم موثّق جيدًا في `DESIGN.md` لكنه **لا يُطبَّق بشكل متّسق** في الكود. هناك ثلاث طبقات من tokens متضاربة، ومكتبة مكوّنات أولية (`V1Primitives.jsx`) **مستخدَمة في صفحتين فقط من 15**. الباقي يعيد تعريف نفس الأنماط محليًا، ما يُولّد ~164 استخدامًا مباشرًا لـ `bg-emerald-*` و~457 لـ `text-gray-*/bg-gray-*` خارج النظام.

### أبرز الفجوات

| # | الفجوة | الأثر |
|---|---|---|
| 1 | تعارض لون الـ accent بين `DESIGN.md` (`#10B981`) و CSS (`#14b8a6` teal) | كل theme switching يعمل عبر `!important` overrides هشّة |
| 2 | `V1Primitives.jsx` (PageHero, MetricCard, ActionCard, FormSection, EntityCard...) مهجور — صفحتان فقط تستخدمانه | إعادة تعريف ~12 مكوّنًا داخل كل صفحة بأسماء مختلفة |
| 3 | `EmptyState` معرَّف لكنه **غير مُستخدَم في أي صفحة** | كل صفحة تخترع حالة فراغ خاصة بها بنصوص متفاوتة |
| 4 | الصفحات مكتوبة بـ `jsx()/jsxs()` runtime مباشر (1292 استدعاء) بدل JSX | صعوبة قراءة وصيانة عالية، خطأ في كل تعديل |
| 5 | **0 حالة تحميل (loading/skeleton)** في أي صفحة | المستخدم لا يفرّق بين "فارغ" و"جاري التحميل" |
| 6 | `ConfirmDialog` يبني DOM يدويًا ويحقن `<style>` في وقت التشغيل | لا يحترم theme الديناميكي، صعب اختباره |
| 7 | 18 aria-label فقط في 7 صفحات من 15 | A11y أقل من baseline WCAG 2.1 AA |
| 8 | ثلاث طبقات tokens متوازية: `--color-bg-*`, `--va-ink-*`, `--va-v1-*` | تغيير لون واحد يتطلب لمس ≥3 ملفات |

---

## 2. نظام التصميم — الحالة الفعلية

### tokens موجودة في ثلاث ملفات

| الملف | عدد الأسطر | الدور |
|---|---|---|
| [src/styles/v1-identity.css](src/styles/v1-identity.css) | 611 | الطبقة "الجديدة": `--va-ink-*`, `--va-action`, `.va-*` classes |
| [src/styles/app-overrides.css](src/styles/app-overrides.css) | 652 | طبقة قديمة: `--va-v1-*`, `--color-*`, و overrides ضخمة بـ `!important` |
| [src/styles/generated-tailwind.css](src/styles/generated-tailwind.css) | 4 | Tailwind بناء |

### تعارض اللون

- `DESIGN.md`: `accent: #10B981` (emerald)
- `v1-identity.css` + `app-overrides.css`: `--va-action: #14b8a6` (teal)
- الصفحات: 164 استخدام لـ `bg-emerald-*`/`text-emerald-*` تُحوَّل قسرًا إلى teal عبر CSS attribute selectors مثل:

```css
main button[class*="bg-emerald-700"] {
  background: linear-gradient(180deg, color-mix(in srgb, var(--va-action) 92%, ...)) !important;
}
```

**الأثر:** كل لون جديد في الكود يحتاج CSS override خاص. النظام مغلق بدل أن يكون مفتوحًا.

### الطباعة (typography)

`DESIGN.md` يحدد 4 مستويات (page-title 24/700, section-title 18/700, body 14/400, label 12/600) — **لا توجد classes/utility مطبَّقة** لهذه المستويات. كل صفحة تستخدم `text-2xl font-bold` أو `text-sm text-gray-400` مباشرة.

### المسافات والاستدارات

موجودة في tokens (`--va-page-gutter`, `--va-panel-radius`, `--va-card-radius`) ومُحترَمة جزئيًا، لكن الصفحات تخلط `p-3 p-4 p-5` بشكل عشوائي.

---

## 3. جرد المكوّنات

### `src/components/ui/V1Primitives.jsx` (الأساسي)

| المكوّن | الاستخدام في الصفحات |
|---|---|
| `PageHero` | فقط `HelpPage`, `DataCenterPage` |
| `MetricCard` | غير مستخدم — كل صفحة تعرّف `KpiCard`/`SearchMetric` محليًا |
| `ActionCard` | غير مستخدم — `DashboardPage` يعرّف `ActionButton` |
| `FormSection` | غير مستخدم |
| `EntityCard` | غير مستخدم — صفحات Types/Collections/Users تعرّف بطاقاتها |
| `StatusBadge` | غير مستخدم |
| `SkeletonBlock` | غير مستخدم — لا حالات تحميل أصلاً |
| `ResponsiveTabs` | غير مستخدم — هناك `DataTabs` منفصل |
| `Stepper` | غير مستخدم — `AddVideoPage` يعرّف stepper خاصًا |

### `src/components/common/`

| الملف | الحالة |
|---|---|
| [ConfirmDialog.js](src/components/common/ConfirmDialog.js) | DOM imperative + style injection. لا يستخدم React. |
| [EmptyState.jsx](src/components/common/EmptyState.jsx) | جاهز ومُستخدَم 0 مرة |
| [KeyboardShortcutsDialog.jsx](src/components/common/KeyboardShortcutsDialog.jsx) | OK |

### `src/components/data/DataTabs.jsx`

موجود — لكن `ResponsiveTabs` في V1Primitives يحاكيه. **تكرار**.

---

## 4. تدقيق الصفحات

### المنهجية

تم فحص الـ15 صفحة عبر:
- استخدام classes خارج النظام (`bg-gray-*`, `bg-emerald-*`, `border-white/*`)
- وجود EmptyState/Skeleton/Loading
- aria-* و RTL واضح
- إعادة تعريف primitives محلية
- حجم الملف وقابلية الصيانة

### الجدول التفصيلي

| الصفحة | سطور | jsx() | gray-* | emerald-* | aria-* | EmptyState؟ | Loading؟ | الملاحظات |
|---|---:|---:|---:|---:|---:|---|---|---|
| [DashboardPage.jsx](src/pages/DashboardPage.jsx) | 347 | 83 | 21 | 12 | 0 | لا | لا | يعرّف `DashboardCard`, `KpiCard`, `ActionButton` |
| [ArchivePage.jsx](src/pages/ArchivePage.jsx) | 581 | 87 | 28 | 9 | 2 | لا | لا | يعتمد على feature components — أنظف نسبيًا |
| [AddVideoPage.jsx](src/pages/AddVideoPage.jsx) | 304 | 86 | 39 | 19 | 0 | n/a | لا | يعرّف stepper خاص، dropzone بدون a11y |
| [SearchPage.jsx](src/pages/SearchPage.jsx) | 398 | 72 | 34 | 5 | 0 | لا | لا | يعرّف `SearchMetric`, `SearchResultCard` |
| [DataCenterPage.jsx](src/pages/DataCenterPage.jsx) | **780** | 122 | 32 | 4 | 1 | لا | لا | أكبر صفحة — تحتاج تفكيكًا فوريًا |
| [DetailPage.jsx](src/pages/DetailPage.jsx) | 318 | 96 | 43 | 10 | 0 | n/a | لا | أعلى نسبة gray في صفحة بهذا الحجم |
| [SettingsPage.jsx](src/pages/SettingsPage.jsx) | 533 | 103 | 13 | 23 | 0 | n/a | لا | كثيف الإجراءات الخطرة، لا تأكيدات موحّدة |
| [UsersPage.jsx](src/pages/UsersPage.jsx) | 280 | 68 | 28 | 11 | 0 | لا | لا | عمليات صلاحيات بدون double-confirm |
| [TypesPage.jsx](src/pages/TypesPage.jsx) | 353 | 117 | 50 | 14 | 2 | لا | لا | UI تحسّن مؤخرًا (commit ff36d8b) لكن الـ tokens غير موحّدة |
| [VocabularyPage.jsx](src/pages/VocabularyPage.jsx) | 376 | 66 | 31 | 10 | 2 | لا | لا | — |
| [HierarchicalTagsPage.jsx](src/pages/HierarchicalTagsPage.jsx) | 410 | 76 | 32 | 11 | 8 | لا | لا | أعلى aria-* (شجرة tags) — لكن لا keyboard nav |
| [HistoryPage.jsx](src/pages/HistoryPage.jsx) | 349 | 60 | 24 | 5 | 0 | لا | لا | — |
| [ReportsPage.jsx](src/pages/ReportsPage.jsx) | 298 | 56 | 19 | 8 | 0 | لا | لا | جداول بدون zebra/sticky headers |
| [HelpPage.jsx](src/pages/HelpPage.jsx) | 608 | 117 | 26 | 11 | 2 | n/a | لا | يستخدم PageHero ✓ |
| [CollectionsPage.jsx](src/pages/CollectionsPage.jsx) | 344 | 83 | 37 | 12 | 1 | لا | لا | — |
| **المجموع** | **6279** | **1292** | **457** | **164** | **18** | **0/11 قائمة** | **0/15** | — |

### ملاحظات نوعية

- **0 صفحة** تعالج حالة `loading` أو `error` للبيانات (الـ store sync فقط).
- **0 صفحة** تستخدم `EmptyState` الموجود — كل واحدة تكتب نصوص فراغ بصياغة مختلفة.
- **dir="auto"** غير مطبَّق على المسارات (`item.path`)، الأرقام، و URLs — قد تنكسر اتجاهيًا.

---

## 5. الفجوات حسب الأولوية

### P0 — يجب البدء بها (يَكسر الاتساق ويُكلّف بشكل مركّب)

1. **توحيد الـ accent**: قرار بين `#10B981` (emerald حسب DESIGN.md) أو `#14b8a6` (teal الفعلي). تعديل المرجع المعتمد وحذف overrides العنيفة.
2. **توحيد tokens**: دمج `--color-*`, `--va-ink-*`, `--va-v1-*` في طبقة واحدة قابلة لـ light/dark وتغيير accent.
3. **تطبيق V1Primitives على الصفحات الـ13 المتبقية** — استبدال `KpiCard`/`SearchMetric`/`DashboardCard` المحلية بـ `MetricCard`/`PageHero`/`FormSection`.
4. **EmptyState في كل صفحة قائمة** (Archive, Search, Collections, Types, Vocabulary, Users, History, HierarchicalTags, Reports).
5. **استبدال `ConfirmDialog.js` بمكوّن React** يحترم theme tokens (`<Modal>` + `<ConfirmDialog>`).

### P1 — مهمة (تحسّن تجربة فعلية وتقلّل ديون)

6. **Skeletons** على الصفحات الـ4 الثقيلة بالبيانات: Archive, Search, DataCenter, History.
7. **تفكيك `DataCenterPage` (780 سطر)** و`SettingsPage` (533) إلى أقسام/تبويبات.
8. **Double-confirm للعمليات الخطرة**: حذف نهائي، تغيير صلاحية مالك، استعادة من نسخة احتياطية.
9. **`dir="auto"` على البيانات الثنائية**: مسارات، URLs، أرقام، كود.
10. **typography utilities** مطابقة لـ DESIGN.md: `.va-title-page`, `.va-title-section`, `.va-body`, `.va-label`.
11. **Stepper موحّد** — تبني AddVideoPage الـ stepper من V1Primitives بدل تعريفه محليًا.

### P2 — قيمة طويلة الأمد

12. **اختصارات لوحة المفاتيح موثّقة بصريًا** داخل الصفحات (يوجد `KeyboardShortcutsDialog` — لكن لا hint داخل الصفحات).
13. **A11y baseline**: تمرير `axe-core` على كل صفحة وإصلاح أول 5 أخطاء.
14. **تحويل الصفحات من `jsx()/jsxs()` runtime إلى JSX حقيقي** — مكلف لكن يضاعف إنتاجية كل تعديل لاحق.
15. **توثيق داخلي**: صفحة `/__styleguide` تعرض V1Primitives بكل الحالات.
16. **Bulk actions bar** موحّد للصفحات: Archive, Users, Collections.
17. **Saved views/filters** في Archive + Search.

---

## 6. خارطة الإصلاح المقترحة (أسبوعيًا)

| الأسبوع | المهام |
|---|---|
| 1 | حسم accent، توحيد tokens في ملف واحد، حذف 80% من overrides بـ `!important` |
| 2 | توسيع V1Primitives (Modal, ConfirmDialog, FilterBar, BulkActionsBar) + Storybook داخلي |
| 3 | استبدال primitives محلية في Dashboard, Search, Archive |
| 4 | استبدال في Collections, Types, Users, Vocabulary, HierarchicalTags |
| 5 | EmptyState + Skeletons في كل صفحات القوائم |
| 6 | تفكيك DataCenterPage + SettingsPage |
| 7 | A11y audit + إصلاحات + double-confirm |
| 8 | typography utilities + dir="auto" + اختصارات مرئية |

---

## 7. مقاييس النجاح بعد الإصلاح

- استخدامات `bg-gray-*`/`text-gray-*` في `src/pages` ≤ 50 (من 457 الآن).
- استخدامات `bg-emerald-*` ≤ 20 (من 164 الآن — لأن النظام يستخدم `var(--va-action)`).
- 100% من صفحات القوائم تستخدم `EmptyState` و`SkeletonBlock`.
- 0 ملف CSS فيه `!important` بحجم > 3 سطور.
- صفر إعادة تعريف لـ `Card/Hero/Metric/Action` خارج `V1Primitives.jsx`.
- aria-label موجود في 100% من الأزرار الأيقونية، و0 خطأ من axe-core بمستوى critical.
