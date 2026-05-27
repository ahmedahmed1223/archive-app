import {
  Copy,
  Eye,
  FolderOpen,
  PenLine,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  Video
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

import { appConfirm } from "../components/common/ConfirmDialog.js";
import { ContextMenu } from "../components/common/ContextMenu.jsx";
import { FloatingActionBar, MotionPage } from "../components/ui/V1Primitives.jsx";
import {
  ArchiveFilterChips
} from "../features/archive/ArchiveToolbar.jsx";
import { ToolbarButton } from "../features/archive/ArchiveViews.jsx";
import { BulkActionBar } from "../features/archive/BulkActionBar.jsx";
import { FileArchiveWizard } from "../features/archive/FileArchiveWizard.jsx";
import { SavedViewsBar } from "../features/archive/SavedViewsBar.jsx";
import { ArchivePageDetailedFilters } from "../features/archive/ArchivePageDetailedFilters.jsx";
import { ArchivePageHero } from "../features/archive/ArchivePageHero.jsx";
import { ArchivePageResults } from "../features/archive/ArchivePageResults.jsx";
import { useArchivePageState } from "../features/archive/useArchivePageState.js";
import { useTypeToJump } from "../features/archive/useTypeToJump.js";

export function ArchivePage() {
  const state = useArchivePageState();
  const {
    videoItems, contentTypes, virtualCollections, showToast, storeSelectedItems,
    addVideoItem, toggleFavorite, restoreVideoItem,
    clearSelection, bulkDeleteItems, bulkRestoreItems, bulkAddTags, bulkMoveToCollection,
    filterType, filterSubtype, setFilterType, setFilterSubtype,
    localSearch, setLocalSearch, showDeleted, showFavoritesOnly,
    resetFilters, activeTopMode,
    visibleItems, visibleIds, typeById, typeCounts, subtypes,
    setPreviewId, allVisibleSelected, toggleSelectAllVisible,
    bulkMode, exitBulkMode,
    showFileImportWizard, setShowFileImportWizard,
    contextMenu, setContextMenu,
    savedViews, currentFiltersForSave, applySavedView, saveCurrentView, removeView, canSaveCurrentView,
    openAdd, openItem, openImport, confirmDelete
  } = state;

  // Type-to-jump — Windows Explorer-style. Find the first visible item
  // whose normalized title starts with what the user types and scroll
  // it into view via the data-archive-item-id attribute.
  useTypeToJump({
    items: visibleItems,
    enabled: !bulkMode && !contextMenu,
    onMatch: (item) => {
      setPreviewId(item.id);
      const node = typeof document !== "undefined"
        ? document.querySelector(`[data-archive-item-id="${item.id}"]`)
        : null;
      node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });

  const buildItemContextMenu = React.useCallback((item, event) => {
    const items = [];
    items.push({ id: "preview", label: "معاينة", icon: Eye, onSelect: () => setPreviewId(item.id) });
    items.push({ id: "open", label: "فتح التفاصيل", icon: FolderOpen, kbd: "Enter", onSelect: () => openItem(item) });
    if (!showDeleted) {
      items.push({ type: "separator" });
      items.push({ id: "favorite", label: item.isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة", icon: Star, onSelect: () => toggleFavorite?.(item.id) });
      items.push({ id: "edit", label: "تعديل", icon: PenLine, onSelect: () => openItem(item) });
    }
    if (item.path) {
      items.push({
        id: "copy-path",
        label: "نسخ المسار",
        icon: Copy,
        onSelect: async () => {
          try {
            await navigator.clipboard?.writeText(item.path);
            showToast?.("تم نسخ المسار", "success");
          } catch (error) {
            showToast?.(error?.message || "تعذر النسخ", "error");
          }
        }
      });
    }
    items.push({ type: "separator" });
    if (showDeleted) {
      items.push({ id: "restore", label: "استعادة", icon: RotateCcw, onSelect: () => restoreVideoItem?.(item.id) });
    } else {
      items.push({ id: "delete", label: "نقل لسلة المحذوفات", icon: Trash2, danger: true, kbd: "Del", onSelect: () => confirmDelete(item) });
    }
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      heading: item.title || "بدون عنوان",
      title: `إجراءات: ${item.title || "العنصر"}`,
      items
    });
  }, [confirmDelete, openItem, restoreVideoItem, setContextMenu, setPreviewId, showDeleted, showToast, toggleFavorite]);

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6 pb-24",
    children: [
      jsx(ArchivePageHero, { ...state, openImport, openAdd }),
      jsx(FileArchiveWizard, {
        open: showFileImportWizard,
        onOpenChange: setShowFileImportWizard,
        contentTypes,
        videoItems,
        addVideoItem,
        showToast
      }),
      jsx(ContextMenu, { menu: contextMenu, onClose: () => setContextMenu(null) }),
      jsx(BulkActionBar, {
        selectedCount: storeSelectedItems.length,
        totalVisible: visibleIds.length,
        allSelected: allVisibleSelected,
        showRestore: showDeleted,
        collections: virtualCollections,
        onSelectAll: toggleSelectAllVisible,
        onClear: exitBulkMode,
        onDelete: async () => {
          if (!storeSelectedItems.length) return;
          const confirmed = await appConfirm(`حذف ${storeSelectedItems.length} عنصر إلى سلة المحذوفات؟`, {
            title: "حذف متعدد",
            kind: "warning",
            confirmLabel: "حذف"
          });
          if (!confirmed) return;
          await bulkDeleteItems?.([...storeSelectedItems]);
        },
        onRestore: async () => {
          if (!storeSelectedItems.length) return;
          await bulkRestoreItems?.([...storeSelectedItems]);
        },
        onAddTags: async (tags) => {
          if (!storeSelectedItems.length || !tags?.length) return;
          await bulkAddTags?.([...storeSelectedItems], tags);
        },
        onMoveToCollection: async (collectionId) => {
          if (!collectionId) {
            showToast?.("أنشئ مجموعة أولاً من صفحة المجموعات.", "warning");
            return;
          }
          if (!storeSelectedItems.length) return;
          await bulkMoveToCollection?.([...storeSelectedItems], collectionId);
        }
      }),
      activeTopMode === "detailed" && jsx(ArchivePageDetailedFilters, { ...state }),
      jsx(ArchiveFilterChips, {
        searchQuery: localSearch,
        filterTypeLabel: filterType !== "all" ? typeById.get(filterType)?.name || filterType : null,
        filterSubtypeLabel: filterSubtype !== "all" ? typeById.get(filterType)?.subtypes?.find((sub) => sub.id === filterSubtype)?.name || filterSubtype : null,
        showFavoritesOnly, showDeleted,
        onClearSearch: () => setLocalSearch(""),
        onClearType: () => { setFilterType?.("all"); setFilterSubtype?.("all"); },
        onClearSubtype: () => setFilterSubtype?.("all"),
        onClearFavorites: () => state.setShowFavoritesOnly(false),
        onClearDeleted: () => state.setShowDeleted(false),
        onResetAll: resetFilters
      }),
      jsx(SavedViewsBar, {
        views: savedViews,
        currentFilters: currentFiltersForSave,
        canSave: canSaveCurrentView,
        onApply: applySavedView,
        onSave: saveCurrentView,
        onRemove: removeView
      }),
      jsx(ArchivePageResults, { ...state, buildItemContextMenu }),
      jsxs(FloatingActionBar, {
        children: [
          jsx(ToolbarButton, { onClick: openImport, icon: jsx(Upload, { className: "h-4 w-4" }), children: "استيراد ملفات" }, "import"),
          jsxs("button", {
            type: "button",
            onClick: openAdd,
            className: "va-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white",
            children: [jsx(Video, { className: "h-4 w-4" }), "إضافة فيديو"]
          }, "add")
        ]
      })
    ]
  });
}

ArchivePage.pageId = "archive";
ArchivePage.migrationStatus = "native";

export default ArchivePage;
