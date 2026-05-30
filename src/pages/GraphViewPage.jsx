import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Workflow } from "lucide-react";

import { useAppStore } from "../stores/index.js";
import { MotionPage, PageHero } from "../components/ui/V1Primitives.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { formatNumber } from "../utils/formatting.js";

const MAX_NODES = 60;
const SIZE = 1000;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 80;

function normalizeTag(tag) {
  return String(tag || "").trim().toLowerCase();
}

/**
 * Build a relationship graph: nodes = active items (capped), edges connect
 * items that share tags (and a bonus for same type). Pure; weight = shared
 * tags x2 + same-type. Degree drives node size. Circular layout — no force
 * simulation, no d3/recharts (bundle discipline).
 */
function buildGraph(videoItems, typeById) {
  const items = videoItems.filter((item) => !item.isDeleted).slice(0, MAX_NODES);
  const tagSets = items.map((item) => new Set((item.tags || []).map(normalizeTag).filter(Boolean)));
  const degree = new Map();
  const edges = [];
  for (let a = 0; a < items.length; a += 1) {
    if (!tagSets[a].size) continue;
    for (let b = a + 1; b < items.length; b += 1) {
      let shared = 0;
      tagSets[b].forEach((tag) => { if (tagSets[a].has(tag)) shared += 1; });
      if (shared <= 0) continue;
      const sameType = Boolean(items[a].type) && items[a].type === items[b].type;
      edges.push({ a, b, shared, weight: shared * 2 + (sameType ? 1 : 0) });
      degree.set(a, (degree.get(a) || 0) + 1);
      degree.set(b, (degree.get(b) || 0) + 1);
    }
  }
  const count = items.length || 1;
  const nodes = items.map((item, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const deg = degree.get(index) || 0;
    return {
      index,
      item,
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
      degree: deg,
      r: 10 + Math.min(18, deg * 2.5),
      color: typeById.get(item.type)?.color || "#6366f1"
    };
  });
  const maxWeight = edges.reduce((max, edge) => Math.max(max, edge.weight), 1);
  return { nodes, edges, maxWeight, total: items.length, truncated: videoItems.filter((item) => !item.isDeleted).length > MAX_NODES };
}

export function GraphViewPage() {
  const { videoItems = [], contentTypes = [], setSelectedItemId, setCurrentPage } = useAppStore();
  const [hovered, setHovered] = React.useState(null);

  const typeById = React.useMemo(() => new Map(contentTypes.map((type) => [type.id, type])), [contentTypes]);
  const graph = React.useMemo(() => buildGraph(videoItems, typeById), [videoItems, typeById]);

  const open = (item) => {
    setSelectedItemId?.(item.id);
    setCurrentPage?.("detail");
  };

  const connectedToHovered = React.useMemo(() => {
    if (hovered === null) return null;
    const set = new Set([hovered]);
    graph.edges.forEach((edge) => {
      if (edge.a === hovered) set.add(edge.b);
      if (edge.b === hovered) set.add(edge.a);
    });
    return set;
  }, [hovered, graph.edges]);

  return jsxs(MotionPage, {
    className: "space-y-6 p-4 sm:p-6",
    children: [
      jsx(PageHero, {
        icon: jsx(Workflow, { className: "h-6 w-6 text-emerald-400" }),
        title: "خريطة العلاقات",
        description: "شبكة تربط المواد بالوسوم المشتركة والنوع — مرّر فوق عقدة لإبراز صلاتها، وانقرها لفتح التفاصيل."
      }),
      graph.edges.length === 0 ? jsx("div", { className: "va-card rounded-2xl border border-dashed border-white/10 bg-gray-950/35", children: jsx(EmptyState, {
        type: "archive",
        title: "لا توجد روابط لعرضها",
        description: "أضف وسوماً مشتركة بين المواد لتظهر شبكة العلاقات هنا."
      }) }) : jsxs("section", { className: "va-card rounded-2xl va-surface-muted border p-4 text-right", children: [
        jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400", children: [
          jsxs("span", { children: [formatNumber(graph.total), " مادة · ", formatNumber(graph.edges.length), " صلة"] }),
          graph.truncated ? jsxs("span", { className: "text-gray-500", children: ["عرض أول ", formatNumber(MAX_NODES), " مادة للوضوح"] }) : null
        ] }),
        jsx("div", { className: "overflow-hidden rounded-xl bg-gray-950/30", children: jsxs("svg", {
          viewBox: `0 0 ${SIZE} ${SIZE}`,
          className: "h-auto w-full",
          role: "img",
          "aria-label": "شبكة علاقات المواد",
          children: [
            jsx("g", { children: graph.edges.map((edge, i) => {
              const from = graph.nodes[edge.a];
              const to = graph.nodes[edge.b];
              const active = connectedToHovered && (connectedToHovered.has(edge.a) && connectedToHovered.has(edge.b) && (edge.a === hovered || edge.b === hovered));
              const dim = connectedToHovered && !active;
              return jsx("line", {
                x1: from.x, y1: from.y, x2: to.x, y2: to.y,
                stroke: active ? "#34d399" : "#64748b",
                strokeWidth: 0.6 + (edge.weight / graph.maxWeight) * 3,
                strokeOpacity: dim ? 0.05 : active ? 0.7 : 0.18
              }, `e${i}`);
            }) }),
            jsx("g", { children: graph.nodes.map((node) => {
              const dim = connectedToHovered && !connectedToHovered.has(node.index);
              return jsxs("g", {
                transform: `translate(${node.x}, ${node.y})`,
                style: { cursor: "pointer", opacity: dim ? 0.25 : 1 },
                onMouseEnter: () => setHovered(node.index),
                onMouseLeave: () => setHovered((current) => current === node.index ? null : current),
                onClick: () => open(node.item),
                children: [
                  jsx("circle", { r: node.r, fill: node.color, fillOpacity: 0.85, stroke: "#0a0a0f", strokeWidth: 2 }),
                  (hovered === node.index || node.degree >= 3) ? jsx("text", {
                    y: node.r + 16,
                    textAnchor: "middle",
                    fill: "#cbd5e1",
                    fontSize: 16,
                    children: (node.item.title || "بدون عنوان").slice(0, 18)
                  }) : null
                ]
              }, node.item.id);
            }) })
          ]
        }) })
      ] })
    ]
  });
}

GraphViewPage.pageId = "graph";
GraphViewPage.migrationStatus = "native";

export default GraphViewPage;
