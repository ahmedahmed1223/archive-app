import * as XLSX from "xlsx";

export { XLSX };
export const legacyXlsx = XLSX;

export async function loadXlsx() {
  return XLSX;
}
