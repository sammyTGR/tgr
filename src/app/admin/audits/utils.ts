import { format } from "date-fns";
import * as XLSX from "xlsx";
import DOMPurify from "dompurify";
import { SummaryData, Employee, AuditData } from "./types";

// Improved type safety for sanitization
export const sanitizeData = <T>(data: T): T => {
  if (typeof data === "string") {
    return DOMPurify.sanitize(data) as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as T;
  }
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data as object).map(([key, value]) => [
        key,
        sanitizeData(value),
      ])
    ) as T;
  }
  return data;
};

export const exportToExcel = (
  data: SummaryData[],
  selectedDate: Date,
  showAllEmployees: boolean,
  selectedLanid: string | null
): void => {
  const exportData = data
    .filter((row) => !row.isDivider)
    .map((row) => ({
      "Sales Rep": sanitizeData(row.Lanid),
      Department: sanitizeData(row.Department || ""),
      "Total DROS": row.TotalDros ?? "",
      "Minor Mistakes": row.MinorMistakes ?? "",
      "Major Mistakes": row.MajorMistakes ?? "",
      "Cancelled DROS": row.CancelledDros ?? "",
      "Weighted Error Rate": row.WeightedErrorRate
        ? `${row.WeightedErrorRate.toFixed(2)}%`
        : "",
      "Total Weighted Mistakes": row.TotalWeightedMistakes ?? "",
      Status: sanitizeData(row.DisqualificationReason),
    }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales Contest Results");

  // Add header styling
  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: "center" },
    fill: { fgColor: { rgb: "CCCCCC" } },
  };

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = headerStyle;
  }

  // Auto-size columns
  const colWidths = exportData.reduce((widths: number[], row) => {
    Object.values(row).forEach((value, i) => {
      const width = String(value).length;
      widths[i] = Math.max(widths[i] || 0, width);
    });
    return widths;
  }, []);

  ws["!cols"] = colWidths.map((width) => ({ width }));

  const dateStr = format(selectedDate, "MMM_yyyy");
  const suffix = showAllEmployees
    ? "_all_employees"
    : selectedLanid
      ? `_${selectedLanid}`
      : "";

  XLSX.writeFile(wb, `Sales_Contest_Results_${dateStr}${suffix}.xlsx`);
};

export const formatDate = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export const getDateRange = (date: Date) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

export const filterEmployees = (
  employees: Employee[],
  searchText: string
): Employee[] => {
  const searchLower = searchText.toLowerCase();
  return employees.filter(
    (emp) =>
      emp.lanid?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower)
  );
};

export const calculateWeightedErrorRate = (
  minorMistakes: number,
  majorMistakes: number,
  totalDros: number
): number => {
  if (totalDros === 0) return 0;
  const weightedErrors = minorMistakes + majorMistakes * 2;
  return Number(((weightedErrors / totalDros) * 100).toFixed(2));
};

export const processAuditData = (
  data: AuditData[],
  selectedLanid: string | null,
  showAllEmployees: boolean
): AuditData[] => {
  if (!data) return [];
  if (!showAllEmployees && selectedLanid) {
    return data.filter((item) => item.salesreps === selectedLanid);
  }
  return data;
};

export const validateAuditData = (data: Partial<AuditData>): boolean => {
  const requiredFields = [
    "dros_number",
    "salesreps",
    "audit_type",
    "trans_date",
    "audit_date",
    "error_location",
  ] as const;

  return requiredFields.every((field) => {
    const value = data[field];
    return value !== undefined && value !== null && value !== "";
  });
};

export const formatAuditForDisplay = (audit: AuditData): AuditData => {
  return {
    ...audit,
    trans_date: audit.trans_date
      ? format(new Date(audit.trans_date), "MM/dd/yyyy")
      : "",
    audit_date: audit.audit_date
      ? format(new Date(audit.audit_date), "MM/dd/yyyy")
      : "",
    error_details: sanitizeData(audit.error_details || ""),
    error_notes: sanitizeData(audit.error_notes || ""),
    dros_cancel: audit.dros_cancel || "",
  };
};
