import {
  parseAppRoute,
  writeAppRoute
} from "../services/router/index.js";
import {
  useAppStore
} from "../stores/index.js";
import {
  ArrowUp,
  Bell,
  BookOpen,
  ChartColumn,
  CircleQuestionMark,
  Database,
  FolderOpen,
  HardDrive,
  History,
  Keyboard,
  LayoutGrid,
  Lightbulb,
  Link,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Tag,
  Tags,
  Upload,
  Users,
  Video
} from "lucide-react";
import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import {
  HELP_FAQ_ITEMS,
  HELP_QUICK_SECTION_LINKS
} from "../features/help/content.js";
import {
  createHelpShortcutList,
  filterHelpFaqItems,
  filterHelpSections,
  normalizeHelpSectionId
} from "../features/help/viewModel.js";
import {
  SHORTCUT_ACTIONS,
  SHORTCUT_DISABLED,
  getEffectiveKeyboardShortcuts
} from "../features/settings/keyboardShortcuts.js";
import {
  MotionPage,
  PageHero,
  StatusBadge
} from "../components/ui/index.js";
import {
  formatNumber
} from "../utils/formatting.js";

function HelpPanel({ title, children, icon = null, className = "" }) {
  return jsxs("section", {
    className: `va-card rounded-2xl va-surface-muted border p-5 text-right backdrop-blur-sm ${className}`,
    dir: "rtl",
    children: [
      jsxs("h3", {
        className: "mb-3 flex items-center gap-2 text-lg font-bold text-white",
        children: [
          icon,
          title
        ]
      }),
      children
    ]
  });
}

function HelpText({ children }) {
  return jsx("p", {
    className: "va-bidi-text text-sm leading-relaxed text-gray-300",
    dir: "rtl",
    children
  });
}

function InfoGrid({ items }) {
  return jsx("div", {
    className: "grid gap-3 sm:grid-cols-2",
    children: items.map(([title, description]) => jsxs("div", {
      className: "rounded-lg border border-white/5 bg-gray-800/30 p-3",
      children: [
        jsx("h4", { className: "mb-1 text-sm font-medium text-emerald-400", children: title }),
        jsx("p", { className: "va-bidi-text text-sm leading-relaxed text-gray-400", dir: "rtl", children: description })
      ]
    }, title))
  });
}

function NumberedList({ items }) {
  return jsx("ol", {
    className: "va-rtl-list va-numbered-list space-y-2 text-sm text-gray-400",
    children: items.map((item) => jsx("li", { children: item }, item))
  });
}

function BulletList({ items }) {
  return jsx("ul", {
    className: "va-rtl-list va-bullet-list space-y-1.5 text-sm text-gray-400",
    children: items.map((item) => jsx("li", { children: item }, item))
  });
}

function createHelpSections(keyboardShortcuts) {
  return [
    {
      id: "getting-started",
      title: "البدء",
      icon: jsx(BookOpen, { className: "h-4 w-4" }),
      searchText: "تشغيل أول استخدام مدير حماية لوحة التحكم",
      content: jsxs(Fragment, {
        children: [
          jsx(HelpText, { children: "أرشيف الفيديو نظام محلي لإدارة محتوى الفيديو داخل المتصفح. ابدأ بالحماية، ثم أنشئ أنواع المحتوى، وبعدها أضف العناصر أو استوردها." }),
          jsx("div", { className: "mt-4 rounded-xl border border-white/5 bg-gray-800/30 p-4", children: jsxs(Fragment, {
            children: [
              jsxs("h4", { className: "mb-2 flex items-center gap-2 font-medium text-white", children: [jsx(Lightbulb, { className: "h-4 w-4 text-amber-400" }), "خطوات البدء السريع"] }),
              jsx(NumberedList, { items: [
                "عيّن كلمة المرور الرئيسية أو اختر البدء السريع بوعي.",
                "استعرض لوحة التحكم لمعرفة جاهزية النظام.",
                "أضف أول نوع محتوى أو استخدم الأنواع الحالية.",
                "أضف فيديو أو استورد ملفات من جهازك.",
                "أنشئ نسخة احتياطية قبل نقل البيانات."
              ] })
            ]
          }) })
        ]
      })
    },
    {
      id: "dashboard-archive",
      title: "لوحة التحكم والأرشيف",
      icon: jsx(LayoutGrid, { className: "h-4 w-4" }),
      searchText: "أرشيف فلاتر معاينة بطاقات إضافة فيديو",
      content: jsxs(Fragment, {
        children: [
          jsx(HelpText, { children: "لوحة التحكم هي بداية الاستخدام اليومي، أما الأرشيف فهو مساحة العمل للفلاتر والمعاينة والتحديد المتعدد." }),
          jsx("div", { className: "mt-4", children: jsx(InfoGrid, { items: [
            ["زر إضافة فيديو", "يبقى المسار الأساسي لإدخال المحتوى واضحاً من لوحة التحكم والأرشيف."],
            ["الفلاتر الحية", "البحث والنوع والفرع والمفضلة والمحذوفة تحفظ في الرابط."],
            ["المعاينة", "يمكن مراجعة تفاصيل العنصر دون فقد سياق التصفح."],
            ["التحديد المتعدد", "استخدمه للحذف أو الوسوم أو التصدير على عدة عناصر."]
          ] }) })
        ]
      })
    },
    {
      id: "content-types",
      title: "أنواع المحتوى",
      icon: jsx(Tags, { className: "h-4 w-4" }),
      searchText: "حقول فروع radio checkbox أنواع",
      content: jsx(InfoGrid, { items: [
        ["الأنواع والفروع", "قسّم الأرشيف إلى أفلام، برامج، وثائقيات، أو أي بنية تناسبك."],
        ["الحقول المخصصة", "أضف نصوصاً وقوائم وتواريخ وأرقاماً ووسوماً حسب النوع."],
        ["الاختيارات", "خيارات radio وcheckbox تظهر كصفوف قابلة للنقر ومناسبة لـ RTL."],
        ["الأيقونات والأغلفة", "يمكن استخدام أيقونات مدمجة أو رموز ونصوص وروابط خارجية حسب الإعدادات."]
      ] })
    },
    {
      id: "adding-videos",
      title: "إضافة الفيديوهات",
      icon: jsx(Video, { className: "h-4 w-4" }),
      searchText: "نموذج إضافة تعديل حفظ وسوم حقول",
      content: jsxs(Fragment, {
        children: [
          jsx(HelpText, { children: "اختر نوع المحتوى أولاً، ثم املأ البيانات الأساسية والحقول الديناميكية. استخدم الوسوم والقاموس لتوحيد الإدخال." }),
          jsx("div", { className: "mt-4", children: jsx(InfoGrid, { items: [
            ["حفظ وعودة", "استخدمه عند إنهاء إدخال عنصر واحد والرجوع للأرشيف."],
            ["حفظ وإضافة آخر", "مناسب للإدخال المتكرر اليومي."],
            ["استدعاء @", "يعرض مصطلحات القاموس داخل حقول النص."],
            ["استدعاء #", "يعرض الوسوم الهرمية والوسوم المستخدمة سابقاً."]
          ] }) })
        ]
      })
    },
    {
      id: "searching",
      title: "البحث",
      icon: jsx(Search, { className: "h-4 w-4" }),
      searchText: "بحث متقدم فلاتر نتائج",
      content: jsxs(Fragment, {
        children: [
          jsx(HelpText, { children: "استخدم البحث للعثور على العناصر بالعنوان أو الوسوم أو الملاحظات أو الحقول المخصصة." }),
          jsx("div", { className: "mt-4", children: jsx(BulletList, { items: [
            "اكتب جزءاً من الكلمة للوصول السريع.",
            "استخدم الفلاتر لتقليل النتائج.",
            "احفظ الرابط إذا أردت الرجوع لنفس الفلترة.",
            "استخدم الاختصار الحالي للبحث من نافذة الاختصارات."
          ] }) })
        ]
      })
    },
    {
      id: "collections",
      title: "المجموعات",
      icon: jsx(FolderOpen, { className: "h-4 w-4" }),
      searchText: "مجموعات ذكية يدوية",
      content: jsx(InfoGrid, { items: [
        ["مجموعات يدوية", "اجمع عناصر مرتبطة بمشروع أو برنامج أو قائمة مراجعة."],
        ["مجموعات ذكية", "يمكن بناؤها لاحقاً على شروط مثل النوع أو الوسوم."],
        ["الأغلفة", "تدعم المجموعات حقول غلاف ومصدر مثل الأنواع."],
        ["عدم التكرار", "العنصر يمكن أن يظهر في عدة مجموعات دون نسخه."]
      ] })
    },
    {
      id: "tags",
      title: "الوسوم",
      icon: jsx(Tag, { className: "h-4 w-4" }),
      searchText: "وسوم هرمية #",
      content: jsx(InfoGrid, { items: [
        ["وسوم عادية", "تُضاف مباشرة إلى الفيديو لتسهيل البحث."],
        ["وسوم هرمية", "تظهر بمسار كامل مثل الأصل / الفرع عند الاختيار."],
        ["استدعاء #", "يفتح قائمة الوسوم الهرمية والوسوم المستخدمة سابقاً."],
        ["منع التكرار", "الاختيار من الاقتراحات يقلل اختلاف الكتابة."]
      ] })
    },
    {
      id: "vocabulary-autocomplete",
      title: "القاموس و @/#",
      icon: jsx(BookOpen, { className: "h-4 w-4" }),
      searchText: "قاموس مصطلحات @ autocomplete",
      content: jsx(InfoGrid, { items: [
        ["مصطلحات القاموس", "اكتب @ داخل النص لاستدعاء مصطلح موحد."],
        ["الوسوم", "اكتب # لاستدعاء وسم أو مسار هرمي."],
        ["تخصيص الرموز", "يمكن تغيير رمزي @ و# من الإعدادات مع منع التعارض."],
        ["دعم RTL", "الرموز التقنية تبقى LTR محلياً دون قلب اتجاه الفقرة."]
      ] })
    },
    {
      id: "file-import",
      title: "استيراد الملفات",
      icon: jsx(Upload, { className: "h-4 w-4" }),
      searchText: "استيراد ملفات مجلد روابط",
      content: jsxs(Fragment, {
        children: [
          jsx(HelpText, { children: "استيراد الملفات يساعدك على إنشاء عناصر من مجموعة فيديوهات. قبل العمليات الكبيرة، استخدم المعاينة والنسخ الاحتياطي." }),
          jsx("div", { className: "mt-4", children: jsx(NumberedList, { items: [
            "افتح الأرشيف ثم استيراد ملفات.",
            "اختر الملفات أو المجلد.",
            "راجع الملخص وحدد النوع أو الفرع.",
            "أنشئ العناصر بعد التأكد من المعاينة."
          ] }) })
        ]
      })
    },
    {
      id: "backup-import",
      title: "النسخ الاحتياطي والاستيراد",
      icon: jsx(Database, { className: "h-4 w-4" }),
      searchText: "نسخ احتياطي استيراد Excel JSON rollback checksum",
      content: jsx(InfoGrid, { items: [
        ["JSON للنقل", "الخيار الموصى به بين الأجهزة مع checksum وملخص محتوى."],
        ["Excel صادر من التطبيق", "يدعم الاستيراد فقط إذا احتوى ورقة payload المخفية."],
        ["دمج آمن", "الوضع الافتراضي عند الاستيراد لتقليل خطر فقد البيانات."],
        ["Rollback", "عند فشل الكتابة لا تُطبق البيانات التالفة على الأرشيف الحالي."]
      ] })
    },
    {
      id: "transfer-export",
      title: "النقل بين الأجهزة",
      icon: jsx(HardDrive, { className: "h-4 w-4" }),
      searchText: "نقل جهاز آخر checksum دمج استبدال",
      content: jsx(InfoGrid, { items: [
        ["قبل النقل", "أنشئ نسخة احتياطية وتأكد من آخر فحص نظام."],
        ["ملف النقل", "يحتوي checksum وملخصاً ولا يتضمن كلمات المرور."],
        ["الدمج", "يناسب نقل بيانات إلى جهاز يحتوي بيانات سابقة."],
        ["الاستبدال", "متاح بتحذير واضح وتأكيد صريح."]
      ] })
    },
    {
      id: "troubleshooting",
      title: "حل المشاكل",
      icon: jsx(Shield, { className: "h-4 w-4" }),
      searchText: "خطأ تحذير فشل تخزين IndexedDB SQLite",
      content: jsx(InfoGrid, { items: [
        ["IndexedDB غير متاح", "تأكد أن المتصفح لا يمنع التخزين المحلي ثم أعد تشغيل التطبيق."],
        ["SQLite", "غير مفعّل في هذه النسخة. التخزين المحلي يعمل عبر IndexedDB ويمكن متابعة العمل طبيعيًا."],
        ["فشل الاستيراد", "راجع checksum ونوع الملف. الملفات الخارجية العادية لا تُستورد كبيانات v1."],
        ["رسائل الخطأ", "تعرض ماذا حدث، هل تم التراجع، وما الإجراء التالي."]
      ] })
    },
    {
      id: "reports-settings",
      title: "التقارير والتخصيص",
      icon: jsx(ChartColumn, { className: "h-4 w-4" }),
      searchText: "تقارير إعدادات ثيم ألوان كثافة",
      content: jsx(InfoGrid, { items: [
        ["التقارير", "تعرض ملخصات النشاط والتوزيع حسب الأنواع والسجلات."],
        ["الثيم", "يدعم Ink Slate للوضع الليلي وWarm Off-white للوضع النهاري."],
        ["لون accent", "الفيروزي افتراضي مع دعم النيلي وخيارات أخرى."],
        ["كثافة الواجهة", "تساعد على الموازنة بين الراحة وكثافة البيانات."]
      ] })
    },
    {
      id: "users",
      title: "المستخدمون والصلاحيات",
      icon: jsx(Users, { className: "h-4 w-4" }),
      searchText: "مستخدمون أدوار صلاحيات مدير محرر مشاهد",
      content: jsx(InfoGrid, { items: [
        ["مدير", "صلاحيات كاملة للإعدادات والبيانات والمستخدمين."],
        ["محرر", "إضافة وتعديل وإدارة المحتوى اليومي."],
        ["مشاهد", "عرض وبحث دون تعديل."],
        ["كلمات المرور", "لا تدخل في ملفات النقل أو Excel."]
      ] })
    },
    {
      id: "notifications-guide",
      title: "الإشعارات والرسائل",
      icon: jsx(Bell, { className: "h-4 w-4" }),
      searchText: "إشعارات رسائل أخطاء تأكيد",
      content: jsx(InfoGrid, { items: [
        ["مركز الرسائل", "يجمع الأخطاء والتحذيرات والتنبيهات الأخيرة."],
        ["التأكيد", "العمليات الحساسة تعرض تأكيداً واضحاً قبل التطبيق."],
        ["RTL", "الرسائل والقوائم تعرض باتجاه عربي مع عزل الرموز التقنية."],
        ["الإجراء التالي", "رسائل الخطأ تقترح خطوة عملية بدل الاكتفاء بوصف المشكلة."]
      ] })
    },
    {
      id: "navigation-links",
      title: "التنقل والروابط",
      icon: jsx(History, { className: "h-4 w-4" }),
      searchText: "History API hash روابط back forward",
      content: jsx(InfoGrid, { items: [
        ["Hash routing", "يعمل عند فتح التطبيق من file:// مثل #/archive."],
        ["History API", "متاح عند التشغيل من سيرفر محلي للروابط النظيفة."],
        ["حالة الفلاتر", "تُحفظ في الرابط وتستعاد عند الرجوع."],
        ["روابط المساعدة", "مثل #/help?section=shortcuts أو #/help?section=troubleshooting."]
      ] })
    },
    {
      id: "shortcuts",
      title: "اختصارات لوحة المفاتيح",
      icon: jsx(Keyboard, { className: "h-4 w-4" }),
      searchText: "اختصارات Ctrl لوحة مفاتيح",
      content: jsxs(Fragment, {
        children: [
          jsx(HelpText, { children: "هذه القائمة تعرض الاختصارات الفعلية من إعداداتك الحالية، بما في ذلك الاختصارات المعطلة." }),
          jsx("div", {
            className: "mt-4 space-y-2",
            children: keyboardShortcuts.map((shortcut) => jsxs("div", {
              className: "flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-gray-800/30 p-3",
              children: [
                jsxs("span", {
                  className: "min-w-0",
                  children: [
                    jsx("span", { className: "block text-sm text-gray-300", children: shortcut.description }),
                    jsx("span", { className: "block text-xs text-gray-500", children: shortcut.category })
                  ]
                }),
                jsx("div", {
                  className: "va-shortcut-sequence flex items-center gap-1",
                  dir: "ltr",
                  children: shortcut.keys.map((key, index) => jsxs("span", {
                    children: [
                      jsx("kbd", {
                        className: `va-mixed-token rounded border px-2 py-1 font-mono text-xs ${shortcut.disabled ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-white/10 bg-gray-700 text-gray-200"}`,
                        children: key
                      }),
                      !shortcut.disabled && index < shortcut.keys.length - 1 && jsx("span", { className: "mx-1 text-gray-600", children: "+" })
                    ]
                  }, `${shortcut.id}-${key}-${index}`))
                })
              ]
            }, shortcut.id))
          })
        ]
      })
    }
  ];
}

export function HelpPage() {
  const { settings, updateSettings, setCurrentPage } = useAppStore();
  const [activeSection, setActiveSection] = React.useState(settings.ui?.lastHelpSection || "getting-started");
  const [helpQuery, setHelpQuery] = React.useState("");
  const contentRef = React.useRef(null);
  const effectiveShortcuts = getEffectiveKeyboardShortcuts(settings);
  const keyboardShortcuts = createHelpShortcutList(SHORTCUT_ACTIONS, effectiveShortcuts, SHORTCUT_DISABLED);
  const sections = React.useMemo(() => createHelpSections(keyboardShortcuts), [settings.keyboardShortcuts]);
  const filteredSections = React.useMemo(() => filterHelpSections(sections, helpQuery), [sections, helpQuery]);
  const filteredFaqItems = React.useMemo(() => filterHelpFaqItems(HELP_FAQ_ITEMS, helpQuery), [helpQuery]);

  const scrollToSection = React.useCallback((sectionId, options = {}) => {
    const normalizedSectionId = normalizeHelpSectionId(sectionId);
    setActiveSection(normalizedSectionId);
    updateSettings({ ui: { ...(settings.ui || {}), lastHelpSection: normalizedSectionId } });
    if (!options.skipRoute) {
      writeAppRoute("help", { section: normalizedSectionId }, settings, false);
    }
    const el = document.getElementById(`section-${normalizedSectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [settings, updateSettings]);

  React.useEffect(() => {
    const applyHelpSectionFromRoute = () => {
      const route = parseAppRoute();
      if (route.page !== "help") return;
      const sectionId = normalizeHelpSectionId(route.section || settings.ui?.lastHelpSection || "getting-started");
      setActiveSection(sectionId);
      window.requestAnimationFrame?.(() => {
        document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    applyHelpSectionFromRoute();
    window.addEventListener("popstate", applyHelpSectionFromRoute);
    window.addEventListener("hashchange", applyHelpSectionFromRoute);
    return () => {
      window.removeEventListener("popstate", applyHelpSectionFromRoute);
      window.removeEventListener("hashchange", applyHelpSectionFromRoute);
    };
  }, [settings.ui?.lastHelpSection]);

  const restartV1Tour = () => {
    updateSettings({ ui: { ...(settings.ui || {}), v1TourCompleted: false, lastOnboardingStep: "tour-restart" } });
  };

  return jsxs(MotionPage, {
    className: "va-enter help-page flex h-[calc(100vh-4rem)] gap-6 p-4 text-right sm:p-6",
    role: "main",
    "aria-label": "المساعدة والدليل",
    children: [
      jsx("aside", {
        className: "hidden w-56 shrink-0 lg:block",
        children: jsxs("div", {
          className: "va-tab-surface sticky top-6 rounded-2xl va-surface-muted border backdrop-blur-sm",
          children: [
            jsxs("div", {
              className: "flex items-center gap-2 border-b border-white/5 p-4 text-sm font-semibold text-white",
              children: [jsx(BookOpen, { className: "h-4 w-4 text-emerald-400" }), "فهرس المحتوى"]
            }),
            jsxs("nav", {
              className: "space-y-1 p-2",
              "aria-label": "فهرس المساعدة",
              children: [
                filteredSections.map((section) => jsxs("button", {
                  type: "button",
                  onClick: () => scrollToSection(section.id),
                  className: `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors ${activeSection === section.id ? "bg-emerald-500/10 text-emerald-400" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                  "aria-current": activeSection === section.id ? "true" : void 0,
                  children: [section.icon, section.title]
                }, section.id)),
                jsx("div", { className: "my-2 h-px bg-white/5" }),
                jsxs("button", {
                  type: "button",
                  onClick: () => scrollToSection("faq"),
                  className: `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors ${activeSection === "faq" ? "bg-emerald-500/10 text-emerald-400" : "text-gray-400 hover:bg-white/5 hover:text-white"}`,
                  children: [jsx(MessageCircle, { className: "h-4 w-4" }), "أسئلة شائعة"]
                })
              ]
            })
          ]
        })
      }),
      jsxs("div", {
        className: "min-w-0 flex-1",
        children: [
          jsx(PageHero, {
            className: "mb-6",
            icon: jsx(CircleQuestionMark, { className: "h-6 w-6 text-emerald-400" }),
            title: "المساعدة والدليل",
            description: "مركز معرفة قابل للبحث، بروابط مباشرة للأقسام، ومصمم ليعطي المستخدم إجابة عملية بدون مغادرة السياق.",
            actions: jsxs(Fragment, {
              children: [
                jsxs("button", {
                  type: "button",
                  onClick: restartV1Tour,
                  className: "va-secondary-button inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5",
                  children: [jsx(Sparkles, { className: "h-4 w-4 text-amber-300" }), "إعادة الجولة"]
                }),
                jsxs("button", {
                  type: "button",
                  onClick: () => setCurrentPage?.("settings"),
                  className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white",
                  children: [jsx(Shield, { className: "h-4 w-4" }), "الإعدادات"]
                })
              ]
            }),
            children: jsxs("div", {
              className: "mt-5 space-y-4",
              children: [
                jsxs("div", {
                  className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]",
                  children: [
                    jsxs("div", {
                      className: "relative",
                      role: "search",
                      children: [
                        jsx(Search, { className: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
                        jsx("input", {
                          value: helpQuery,
                          onChange: (event) => setHelpQuery(event.target.value),
                          placeholder: "ابحث في المساعدة، الاستيراد، النسخ الاحتياطي، الاختصارات...",
                          dir: "auto",
                          className: "va-bidi-input w-full va-surface-deep rounded-xl border py-3 pl-3 pr-10 text-sm text-white outline-none focus:border-emerald-500/50"
                        })
                      ]
                    }),
                    jsxs("div", {
                      className: "flex flex-wrap items-center gap-2",
                      children: [
                        jsx(StatusBadge, { tone: "emerald", children: `${formatNumber(filteredSections.length)} قسم` }),
                        jsx(StatusBadge, { tone: "slate", children: `${formatNumber(keyboardShortcuts.length)} اختصار` })
                      ]
                    })
                  ]
                }),
                jsx("div", {
                  className: "flex flex-wrap gap-2",
                  children: HELP_QUICK_SECTION_LINKS.map(([sectionId, label]) => jsx("button", {
                    type: "button",
                    onClick: () => scrollToSection(sectionId),
                    className: `va-tool-button rounded-xl border px-3 py-2 text-sm ${activeSection === sectionId ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-100" : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"}`,
                    children: label
                  }, sectionId))
                })
              ]
            })
          }),
          jsx("div", {
            className: "mb-4 lg:hidden",
            children: jsx("div", {
              className: "va-tab-surface rounded-xl va-surface-muted border p-3",
              children: jsx("div", {
                className: "flex flex-wrap gap-2",
                children: filteredSections.map((section) => jsxs("button", {
                  type: "button",
                  onClick: () => scrollToSection(section.id),
                  className: `flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${activeSection === section.id ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-gray-800/50 text-gray-400"}`,
                  children: [section.icon, section.title]
                }, section.id))
              })
            })
          }),
          jsx("div", {
            ref: contentRef,
            className: "h-[calc(100vh-18rem)] overflow-y-auto pr-1",
            children: jsxs("div", {
              className: "space-y-6 pb-4",
              children: [
                filteredSections.length === 0 && jsx("div", {
                  className: "rounded-xl va-surface-muted border p-6 text-center text-gray-400",
                  children: "لا توجد أقسام مطابقة. جرّب كلمة أبسط أو افتح الأسئلة الشائعة."
                }),
                filteredSections.map((section) => jsx("div", {
                  id: `section-${section.id}`,
                  children: jsx(HelpPanel, { title: section.title, icon: section.icon, children: section.content })
                }, section.id)),
                jsx("div", {
                  id: "section-faq",
                  children: jsx(HelpPanel, {
                    title: "الأسئلة الشائعة",
                    icon: jsx(MessageCircle, { className: "h-5 w-5 text-emerald-400" }),
                    children: jsx("div", {
                      className: "space-y-4",
                      children: filteredFaqItems.length === 0 ? jsx("p", {
                        className: "py-6 text-center text-sm text-gray-500",
                        children: "لا توجد أسئلة مطابقة للبحث الحالي"
                      }) : filteredFaqItems.map((faq, index) => jsxs("div", {
                        className: "rounded-xl border border-white/5 bg-gray-800/30 p-4",
                        children: [
                          jsxs("h4", {
                            className: "flex items-center gap-2 text-sm font-medium text-white",
                            children: [
                              jsx(CircleQuestionMark, { className: "h-4 w-4 shrink-0 text-emerald-400" }),
                              jsx("span", { dir: "auto", className: "va-bidi-text", children: faq.question })
                            ]
                          }),
                          jsx("p", {
                            dir: "auto",
                            className: "va-bidi-text mr-6 mt-2 text-sm leading-relaxed text-gray-400",
                            children: faq.answer
                          })
                        ]
                      }, index))
                    })
                  })
                }),
                jsx("div", {
                  className: "flex justify-center pb-4",
                  children: jsxs("button", {
                    type: "button",
                    onClick: () => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
                    className: "inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white",
                    children: [jsx(ArrowUp, { className: "h-4 w-4" }), "العودة للأعلى"]
                  })
                })
              ]
            })
          })
        ]
      })
    ]
  });
}

HelpPage.pageId = "help";
HelpPage.pageTitle = "المساعدة";
HelpPage.migrationStatus = "native";

export default HelpPage;
