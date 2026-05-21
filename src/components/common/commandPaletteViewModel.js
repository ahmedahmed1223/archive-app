import { normalizeArabicSearchText } from "../../utils/formatting.js";

export function filterCommandPaletteCommands(commands = [], query = "") {
  const normalizedQuery = normalizeArabicSearchText(query);
  if (!normalizedQuery) return commands;
  return commands.filter((command) => {
    const haystack = normalizeArabicSearchText(`${command.label || ""} ${command.detail || ""} ${command.keys || ""}`);
    return haystack.includes(normalizedQuery);
  });
}
