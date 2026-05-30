import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

import { EmptyState } from "../../components/common/EmptyState.jsx";
import { formatNumber } from "../../utils/formatting.js";
import { computeCompleteness } from "./completeness.js";
import {
  ARCHIVE_GRID_CLASSES,
  ARCHIVE_ITEM_SIZE_LABELS,
  AnimatedItem,
  ArchivePagination,
  PreviewPanel,
  VideoCard,
  VideoListItem,
  VideoTableView,
  VideoTileItem,
  getGridStyleForColumns
} from "./ArchiveViews.jsx";

function buildItemActionsFor(item, deps) {
  const {
    typeLabel,
    subtypeLabel,
    previewItem,
    showDeleted,
    activeItemSize,
    bulkMode,
    selectedIdSet,
    toggleBulkSelect,
    setPreviewId,
    openItem,
    toggleFavorite,
    confirmDelete,
    restoreVideoItem,
    buildItemContextMenu
  } = deps;
  return {
    item,
    typeLabel: typeLabel(item),
    subtypeLabel: subtypeLabel(item),
    completeness: computeCompleteness(item, deps.typeById?.get?.(item.type)),
    selected: previewItem?.id === item.id,
    showDeleted,
    itemSize: activeItemSize,
    bulkMode,
    bulkSelected: selectedIdSet.has(item.id),
    onBulkToggle: () => toggleBulkSelect?.(item.id),
    onPreview: () => setPreviewId(item.id),
    onOpen: () => openItem(item),
    onFavorite: () => toggleFavorite?.(item.id),
    onDelete: () => confirmDelete(item),
    onRestore: () => restoreVideoItem?.(item.id),
    onContextMenu: (event) => {
      event.preventDefault();
      buildItemContextMenu(item, event);
    }
  };
}

function renderItemsForViewMode(deps) {
  const {
    activeViewMode,
    visibleItems,
    previewItem,
    typeLabel,
    subtypeLabel,
    showDeleted,
    activeItemSize,
    bulkMode,
    isItemSelected,
    toggleBulkSelect,
    allVisibleSelected,
    toggleSelectAllVisible,
    visibleTableColumns,
    handleColumnResize,
    setPreviewId,
    openItem,
    toggleFavorite,
    confirmDelete,
    restoreVideoItem,
    gridContainerRef,
    gridColumns
  } = deps;

  const itemActions = (item) => buildItemActionsFor(item, deps);

  if (activeViewMode === "tiles") {
    return jsx("div", {
      className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
      children: visibleItems.map((item, index) => jsx(AnimatedItem, {
        index,
        itemId: item.id,
        children: jsx(VideoTileItem, itemActions(item))
      }, item.id))
    });
  }
  if (activeViewMode === "list") {
    return jsx("div", {
      className: "space-y-3",
      children: visibleItems.map((item, index) => jsx(AnimatedItem, {
        index,
        itemId: item.id,
        children: jsx(VideoListItem, itemActions(item))
      }, item.id))
    });
  }
  if (activeViewMode === "table") {
    return jsx(VideoTableView, {
      items: visibleItems,
      previewItem,
      typeLabel,
      subtypeLabel,
      showDeleted,
      itemSize: activeItemSize,
      bulkMode,
      isSelected: isItemSelected,
      onBulkToggle: (id) => toggleBulkSelect?.(id),
      allSelected: allVisibleSelected,
      onSelectAll: toggleSelectAllVisible,
      columns: visibleTableColumns,
      onColumnResize: handleColumnResize,
      onPreview: (item) => setPreviewId(item.id),
      onOpen: openItem,
      onFavorite: (item) => toggleFavorite?.(item.id),
      onDelete: confirmDelete,
      onRestore: (item) => restoreVideoItem?.(item.id)
    });
  }
  const explicitColumnsStyle = getGridStyleForColumns(gridColumns);
  return jsx("div", {
    ref: gridContainerRef,
    className: explicitColumnsStyle
      ? "grid gap-3"
      : (ARCHIVE_GRID_CLASSES[activeItemSize] || ARCHIVE_GRID_CLASSES.comfortable),
    style: explicitColumnsStyle,
    children: visibleItems.map((item, index) => jsx(AnimatedItem, {
      index,
      itemId: item.id,
      children: jsx(VideoCard, itemActions(item))
    }, item.id))
  });
}

/**
 * The "main content" of the archive page: the result-count summary bar,
 * the view-mode-aware item grid/list/table, pagination, and the
 * right-side preview panel. Renders an EmptyState when filteredItems
 * is empty.
 */
export function ArchivePageResults(props) {
  const {
    filteredItems,
    visibleItems,
    rangeText,
    currentPage,
    totalPages,
    activeViewMode,
    activeItemSize,
    activeGridRows,
    activePageSize,
    gridColumnCount,
    hasFilters,
    showDeleted,
    goToPage,
    openAdd,
    resetFilters,
    previewItem,
    typeLabel,
    subtypeLabel,
    openItem
  } = props;

  return jsxs("section", {
    className: "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]",
    children: [
      filteredItems.length === 0 ? jsx("div", {
        className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-950/35",
        children: jsx(EmptyState, {
          type: showDeleted ? "trash" : "archive",
          title: showDeleted ? "سلة المحذوفات فارغة" : hasFilters ? "لا توجد نتائج مطابقة" : "الأرشيف فارغ",
          description: showDeleted
            ? "لا توجد عناصر محذوفة حالياً."
            : hasFilters
              ? "جرّب مسح الفلاتر أو كلمة بحث أقصر."
              : "ابدأ بإضافة فيديو أو استيراد بيانات من جهازك.",
          actionLabel: !showDeleted ? "إضافة فيديو" : undefined,
          onAction: !showDeleted ? openAdd : undefined,
          secondaryActionLabel: hasFilters ? "مسح الفلاتر" : undefined,
          onSecondaryAction: hasFilters ? resetFilters : undefined
        })
      }) : jsxs("div", {
        className: "space-y-4",
        children: [
          jsxs("div", {
            className: "va-control-surface flex flex-wrap items-center justify-between gap-3 va-surface-muted rounded-2xl border p-3 text-sm",
            children: [
              jsxs("div", {
                className: "min-w-0",
                children: [
                  jsx("p", { className: "font-semibold text-white", children: rangeText }),
                  jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: `الصفحة ${formatNumber(currentPage)} من ${formatNumber(totalPages)}` })
                ]
              }),
              jsxs("div", {
                className: "flex flex-wrap gap-2 text-xs text-gray-400",
                children: [
                  jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: `العرض: ${activeViewMode === "grid" ? "شبكة" : activeViewMode === "tiles" ? "بلاطات" : activeViewMode === "list" ? "قائمة" : "تفاصيل"}` }),
                  jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: `الحجم: ${ARCHIVE_ITEM_SIZE_LABELS[activeItemSize]}` }),
                  jsx("span", { className: "rounded-full border border-white/10 bg-gray-900/60 px-2.5 py-1", children: activeViewMode === "grid" ? `${formatNumber(activeGridRows)} صفوف × ${formatNumber(gridColumnCount)} أعمدة` : `${formatNumber(activePageSize)} عنصر/صفحة` })
                ]
              })
            ]
          }),
          renderItemsForViewMode(props),
          jsx(ArchivePagination, {
            currentPage,
            totalPages,
            onPageChange: goToPage
          })
        ]
      }),
      jsx(PreviewPanel, {
        item: previewItem,
        typeLabel: previewItem ? typeLabel(previewItem) : "",
        subtypeLabel: previewItem ? subtypeLabel(previewItem) : "",
        onOpen: () => previewItem && openItem(previewItem)
      })
    ]
  });
}

export default ArchivePageResults;
