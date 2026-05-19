# أرشيف الفيديو - Vite

تم تحويل التطبيق من ملف SPA واحد إلى مشروع Vite منظم مع الحفاظ على واجهات التطبيق وإمكاناته.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح العنوان الذي يعرضه Vite، عادة:

```text
http://127.0.0.1:5173/
```

## البناء كملف واحد

```bash
npm run build
```

يستخدم المشروع `vite-plugin-singlefile` أثناء البناء، لذلك يكون الناتج الأساسي:

```text
dist/index.html
```

يتم تضمين JavaScript وCSS داخل ملف HTML النهائي ليعمل التطبيق كحزمة محلية واحدة.

## البنية

```text
index.html
src/
  main.js
  app/
    startVideoArchive.js
  runtime/
    videoArchiveRuntime.js
  styles/
    generated-tailwind.css
    app-overrides.css
  theme/
    applyInitialTheme.js
    themeStorage.js
```

- `src/main.js`: نقطة دخول Vite.
- `src/app/startVideoArchive.js`: تشغيل التطبيق وربطه بعنصر `#root`.
- `src/runtime/videoArchiveRuntime.js`: منطق التطبيق الأصلي المستخرج من ملف الـ SPA مع تحويل التشغيل التلقائي إلى دالة قابلة للاستدعاء.
- `src/styles/`: الأنماط المستخرجة والمنظمة في ملفات مستقلة.
- `src/theme/`: منطق تهيئة الثيم قبل تشغيل التطبيق.
