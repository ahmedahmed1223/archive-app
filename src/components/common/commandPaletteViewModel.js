import { normalizeArabicSearchText } from "../../utils/formatting.js";

function fuzzyScore(haystack, needle) {
  if (!needle) return 1;
  if (!haystack) return 0;
  // Exact substring earns the highest score plus a position bonus.
  const exactIndex = haystack.indexOf(needle);
  if (exactIndex !== -1) {
    return 1000 + Math.max(0, 200 - exactIndex);
  }
  // Walk the haystack consuming needle chars in order; reward consecutive matches.
  let score = 0;
  let consecutive = 0;
  let h = 0;
  for (let n = 0; n < needle.length; n += 1) {
    const target = needle[n];
    let found = false;
    while (h < haystack.length) {
      if (haystack[h] === target) {
        score += 4 + consecutive * 3;
        consecutive += 1;
        h += 1;
        found = true;
        break;
      }
      consecutive = 0;
      h += 1;
    }
    if (!found) return 0;
  }
  // Reward shorter haystacks that still matched (more focused result).
  return score + Math.max(0, 50 - haystack.length);
}

export function filterCommandPaletteCommands(commands = [], query = "") {
  const normalizedQuery = normalizeArabicSearchText(query);
  if (!normalizedQuery) return commands;
  const scored = [];
  for (const command of commands) {
    const haystack = normalizeArabicSearchText(`${command.label || ""} ${command.detail || ""} ${command.keys || ""}`);
    const score = fuzzyScore(haystack, normalizedQuery);
    if (score > 0) {
      scored.push({ command, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.command);
}

export function buildVideoItemCommands(videoItems = [], { query = "", limit = 5, onOpen } = {}) {
  if (!Array.isArray(videoItems) || videoItems.length === 0 || typeof onOpen !== "function") return [];
  const normalizedQuery = normalizeArabicSearchText(query);
  const candidates = [];
  for (const item of videoItems) {
    if (!item || item.isDeleted) continue;
    const title = item.title || "بدون عنوان";
    const command = {
      id: `video-${item.id}`,
      label: `افتح فيديو: ${title}`,
      detail: [item.subtype, item.type, item.id].filter(Boolean).join(" · ") || "عنصر أرشيف",
      keys: [title, item.tagsText, ...(item.tags || [])].filter(Boolean).join(" "),
      kind: "item",
      run: () => onOpen(item)
    };
    if (!normalizedQuery) {
      candidates.push({ command, score: 1 });
    } else {
      const haystack = normalizeArabicSearchText(`${title} ${command.keys}`);
      const score = fuzzyScore(haystack, normalizedQuery);
      if (score > 0) candidates.push({ command, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit).map((entry) => entry.command);
}
