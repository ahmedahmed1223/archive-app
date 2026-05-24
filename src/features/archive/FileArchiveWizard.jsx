import {
  CheckCircle2,
  FileVideo,
  FolderOpen,
  Loader2,
  Upload,
  X
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { createLocalFileValue, createVideoItemValue } from "../videos/viewModel.js";
import { formatFileSize, formatNumber } from "../../utils/formatting.js";

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov", "m4v", "avi", "mkv", "wmv"]);

function getExtension(name = "") {
  return String(name).includes(".") ? String(name).split(".").pop().toLowerCase() : "";
}

function isLikelyVideoFile(file) {
  if (!file) return false;
  if (String(file.type || "").startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.has(getExtension(file.name));
}

function createImportRows(files = [], existingItems = []) {
  const existingFingerprints = new Set(existingItems.map((item) => {
    const title = String(item.title || "").trim().toLowerCase();
    const path = String(item.path || item.filePath || "").trim().toLowerCase();
    return [title, path].filter(Boolean).join("|");
  }));

  return files.filter(isLikelyVideoFile).map((file, index) => {
    const localFile = createLocalFileValue(file);
    const title = file.name?.replace(/\.[^.]+$/, "") || `فيديو ${index + 1}`;
    const path = localFile?.relativePath || localFile?.path || file.name || "";
    const fingerprint = [title.trim().toLowerCase(), path.trim().toLowerCase()].filter(Boolean).join("|");
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      title,
      path,
      localFile,
      duplicate: existingFingerprints.has(fingerprint),
      selected: !existingFingerprints.has(fingerprint)
    };
  });
}

function WizardButton({ children, onClick, disabled = false, tone = "neutral", icon }) {
  const toneClass = tone === "primary"
    ? "border-emerald-500/30 bg-emerald-600 text-white hover:bg-emerald-500"
    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function FileArchiveWizard({
  open,
  onOpenChange,
  contentTypes = [],
  videoItems = [],
  addVideoItem,
  showToast
}) {
  const fileInputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);
  const firstType = contentTypes.find((type) => type.status !== "archived") || contentTypes[0] || null;
  const [rows, setRows] = React.useState([]);
  const [typeId, setTypeId] = React.useState(firstType?.id || "");
  const [subtypeId, setSubtypeId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setRows([]);
      setNotes("");
      setIsSaving(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!typeId && firstType?.id) setTypeId(firstType.id);
  }, [firstType?.id, typeId]);

  const selectedType = contentTypes.find((type) => type.id === typeId);
  const subtypes = selectedType?.subtypes || [];

  React.useEffect(() => {
    if (subtypeId && !subtypes.some((subtype) => subtype.id === subtypeId)) setSubtypeId("");
  }, [subtypeId, subtypes]);

  if (!open) return null;

  const readFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const nextRows = createImportRows(files, videoItems);
    setRows(nextRows);
    if (!nextRows.length) showToast?.("لم يتم العثور على ملفات فيديو قابلة للإضافة", "warning");
  };

  const selectedRows = rows.filter((row) => row.selected);
  const duplicateCount = rows.filter((row) => row.duplicate).length;
  const totalSize = selectedRows.reduce((sum, row) => sum + (row.file?.size || 0), 0);

  const toggleRow = (rowId) => {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, selected: !row.selected } : row));
  };

  const createItems = async () => {
    if (!selectedRows.length) return;
    setIsSaving(true);
    try {
      for (const row of selectedRows) {
        const item = createVideoItemValue({
          title: row.title,
          type: typeId,
          subtype: subtypeId,
          path: row.path,
          notes,
          metadata: {
            localFile: row.localFile,
            importedFrom: "fileArchiveWizard",
            importedAt: new Date().toISOString()
          },
          tags: row.localFile?.extension ? [row.localFile.extension] : []
        });
        await addVideoItem?.(item);
      }
      showToast?.(`تمت إضافة ${selectedRows.length} ملف إلى الأرشيف`, "success");
      onOpenChange?.(false);
    } catch (error) {
      showToast?.(error?.message || "فشل استيراد الملفات", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[9985] overflow-y-auto bg-black/65 p-4 text-right text-white backdrop-blur-sm">
      <section className="mx-auto my-6 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1626] shadow-2xl shadow-black/35">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold">استيراد ملفات إلى الأرشيف</h2>
                <p className="mt-1 text-sm text-slate-400">يتم حفظ بيانات الملف ومساره فقط، ولا يتم تخزين محتوى الفيديو داخل التطبيق.</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange?.(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <main className="space-y-4">
            <div
              className="rounded-3xl border border-dashed border-emerald-500/25 bg-emerald-500/10 p-7 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                readFiles(event.dataTransfer?.files);
              }}
            >
              <FileVideo className="mx-auto h-12 w-12 text-emerald-200" />
              <h3 className="mt-4 text-lg font-bold">اختر ملفات فيديو أو اسحبها هنا</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-emerald-50/70">
                يمكنك اختيار ملفات منفردة أو مجلد كامل. تظهر معاينة ومكررّات محتملة قبل إنشاء العناصر.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <WizardButton icon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()} tone="primary">
                  اختيار ملفات
                </WizardButton>
                <WizardButton icon={<FolderOpen className="h-4 w-4" />} onClick={() => folderInputRef.current?.click()}>
                  اختيار مجلد
                </WizardButton>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="video/*,.mp4,.webm,.ogg,.mov,.m4v,.avi,.mkv,.wmv" className="hidden" onChange={(event) => readFiles(event.target.files)} />
              <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" className="hidden" onChange={(event) => readFiles(event.target.files)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">الملفات المقروءة</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(rows.length)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">المحدد للإضافة</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(selectedRows.length)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">الحجم التقريبي</p>
                <p className="mt-1 text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
            </div>

            {duplicateCount > 0 && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
                تم تعليم {formatNumber(duplicateCount)} ملف كمكرر محتمل. يمكنك تحديده يدويًا إذا أردت إضافته.
              </div>
            )}

            <div className="max-h-[420px] overflow-auto rounded-2xl border border-white/10">
              {rows.length ? rows.map((row) => (
                <label key={row.id} className="grid cursor-pointer gap-3 border-b border-white/5 bg-white/[0.02] p-3 last:border-b-0 hover:bg-white/[0.05] sm:grid-cols-[auto_1fr_auto]">
                  <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.id)} className="mt-1 h-4 w-4 accent-emerald-500" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-100">{row.title}</span>
                    <span dir="ltr" className="mt-1 block truncate text-left text-xs text-slate-500">{row.path || row.file.name}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {row.duplicate && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-100">مكرر محتمل</span>}
                    <span>{formatFileSize(row.file.size || 0)}</span>
                  </span>
                </label>
              )) : (
                <div className="p-8 text-center text-sm text-slate-500">لم يتم اختيار ملفات بعد.</div>
              )}
            </div>
          </main>

          <aside className="h-fit space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 lg:sticky lg:top-5">
            <h3 className="font-bold">إعدادات الإنشاء</h3>
            <label className="block text-sm text-slate-300">
              النوع
              <select value={typeId} onChange={(event) => setTypeId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-white">
                <option value="">بدون نوع</option>
                {contentTypes.filter((type) => type.status !== "archived").map((type) => (
                  <option key={type.id} value={type.id}>{type.name || type.id}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              الفرع
              <select value={subtypeId} onChange={(event) => setSubtypeId(event.target.value)} disabled={!subtypes.length} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-white disabled:opacity-50">
                <option value="">بدون فرع</option>
                {subtypes.map((subtype) => (
                  <option key={subtype.id} value={subtype.id}>{subtype.name || subtype.id}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              ملاحظة مشتركة
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-right text-white" placeholder="اختياري" />
            </label>
            <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-3 text-xs leading-6 text-slate-400">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
              سيتم إنشاء عنصر أرشيف لكل ملف محدد مع حقل metadata باسم <span dir="ltr" className="font-mono text-slate-200">localFile</span>.
            </div>
            <WizardButton
              tone="primary"
              disabled={!selectedRows.length || isSaving}
              onClick={createItems}
              icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            >
              {isSaving ? "جار الإضافة..." : `إضافة ${formatNumber(selectedRows.length)} ملف`}
            </WizardButton>
          </aside>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default FileArchiveWizard;
