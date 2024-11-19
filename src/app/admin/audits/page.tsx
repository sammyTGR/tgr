"use client";

import { createColumnHelper } from "@tanstack/react-table";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTableProfile } from "./contest/data-table-profile";

// Component imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import SubmitAuditForm from "./submit/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SupportNavMenu from "@/components/ui/SupportNavMenu";
import { DataTable } from "@/components/ui/data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { CustomCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import LoadingIndicator from "@/components/LoadingIndicator";
import { WeightedScoringCalculator } from "./contest/WeightedScoringCalculator";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

// Type definitions
interface OptionType {
  label: string;
  value: string;
}

interface CellProps {
  value: any;
  row: {
    original: {
      Qualified: boolean;
      isDivider?: boolean;
      [key: string]: any;
    };
  };
}

interface DataTableColumn {
  Header: string;
  accessor: string;
  Cell?: (props: { value: any; row: { original: any } }) => JSX.Element;
}

interface DataTableProps {
  columns: Array<{
    Header: string;
    accessor: string;
    Cell?: (props: { value: any; row: { original: any } }) => JSX.Element;
  }>;
  data: any[];
  styles?: Record<string, string>;
}

interface DataRow {
  salesreps?: string;
  audits_id?: string;
  dros_number?: string;
  audit_type?: string;
  trans_date?: string;
  audit_date?: string;
  error_location?: string;
  error_details?: string;
  error_notes?: string;
  dros_cancel?: string;
}

interface Employee {
  lanid: string;
  department?: string;
  role?: string;
  status?: string;
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
  error_type: string;
  description?: string;
}

interface Audit {
  audits_id: string;
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
  dros_cancel: string;
  created_at: string;
  updated_at: string;
}

interface SummaryRowData {
  Lanid: string;
  TotalDros: number | null;
  MinorMistakes: number | null;
  MajorMistakes: number | null;
  CancelledDros: number | null;
  WeightedErrorRate: number | null;
  TotalWeightedMistakes: number | null;
  Qualified: boolean;
  DisqualificationReason: string;
  isDivider?: boolean;
  Department?: string;
}

interface SalesData {
  Lanid: string;
  Date: string;
  subcategory_label: string;
  dros_number: string;
  status: string;
  id: number;
  cancelled_dros: number;
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  lanid?: string;
  auditType?: string;
}

interface PageParams {
  tab?: string;
  lanid?: string;
  date?: string;
  showAll?: string;
  search?: string; // Add this
}

interface TableMeta<T> {
  updateMutation: UseMutationResult<
    any,
    Error,
    { auditId: string; data: Partial<Audit> }
  >;
  deleteMutation: UseMutationResult<any, Error, string>;
}

// Create Query Client with configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy loaded components with proper types
const LazyDataTable = dynamic<any>(
  () =>
    import("@/components/ui/data-table").then((mod) => ({
      default: mod.DataTable,
    })),
  {
    loading: () => <LoadingIndicator />,
    ssr: false,
  }
);

const LazyDataTableProfile = dynamic<any>(
  () =>
    import("./contest/data-table-profile").then((mod) => ({
      default: mod.DataTableProfile,
    })),
  {
    loading: () => <LoadingIndicator />,
    ssr: false,
  }
);
// API Functions
const api = {
  fetchEmployees: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("lanid", { ascending: true });

    if (error) {
      throw new Error(`Error fetching employees: ${error.message}`);
    }
    return data || [];
  },

  fetchAudits: async (filters?: AuditFilters): Promise<Audit[]> => {
    let query = supabase
      .from("Auditsinput")
      .select("*")
      .order("audit_date", { ascending: false });

    // Only apply filters if they are provided (for the contest tab)
    if (filters) {
      if (filters.startDate) query = query.gte("audit_date", filters.startDate);
      if (filters.endDate) query = query.lte("audit_date", filters.endDate);
      if (filters.lanid) query = query.eq("salesreps", filters.lanid);
      if (filters.auditType) query = query.eq("audit_type", filters.auditType);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error fetching audits: ${error.message}`);
    }
    return data || [];
  },

  fetchPointsCalculation: async (): Promise<PointsCalculation[]> => {
    const { data, error } = await supabase
      .from("points_calculation")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      throw new Error(`Error fetching points calculation: ${error.message}`);
    }
    return data || [];
  },

  fetchSalesData: async (
    startDate: string,
    endDate: string,
    lanid?: string,
    showAllEmployees?: boolean
  ): Promise<SalesData[]> => {
    let query = supabase
      .from("sales_data")
      .select("*")
      .gte("Date", startDate)
      .lte("Date", endDate)
      .not("subcategory_label", "is", null)
      .not("subcategory_label", "eq", "");

    // Only apply lanid filter if not showing all employees and lanid is provided
    if (!showAllEmployees && lanid) {
      query = query.eq("Lanid", lanid);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error fetching sales data: ${error.message}`);
    }

    // If showing all employees, we want ALL data
    if (showAllEmployees) {
      return data || [];
    }

    // If not showing all, filter for the selected employee
    return (data || []).filter((sale) => (lanid ? sale.Lanid === lanid : true));
  },

  updateAudit: async (
    auditId: string,
    updateData: Partial<Audit>
  ): Promise<Audit> => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .update(updateData)
      .eq("audits_id", auditId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating audit: ${error.message}`);
    }
    return data;
  },

  deleteAudit: async (auditId: string): Promise<void> => {
    const { error } = await supabase
      .from("Auditsinput")
      .delete()
      .eq("audits_id", auditId);

    if (error) {
      throw new Error(`Error deleting audit: ${error.message}`);
    }
  },
};

// Utility Functions
const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "span", "div", "br"],
    ALLOWED_ATTR: ["class", "style"],
    ADD_TAGS: [], // Required to avoid type error
    ADD_ATTR: [], // Required to avoid type error
    USE_PROFILES: { html: true }, // Required to enable HTML sanitization
  });
};

const calculateSummaryData = (
  salesData: SalesData[],
  auditData: Audit[],
  pointsCalculation: PointsCalculation[],
  employeesData: Employee[],
  showAllEmployees: boolean,
  selectedLanid: string | null
): SummaryRowData[] => {
  const employeeDepartments = new Map(
    employeesData?.map((emp: Employee) => [emp.lanid, emp.department]) || []
  );

  const lanids = showAllEmployees
    ? Array.from(new Set(salesData.map((sale) => sale.Lanid)))
    : selectedLanid
    ? [selectedLanid]
    : [];

  const calculatedData = lanids
    .map((lanid): SummaryRowData | null => {
      if (!lanid) return null;

      const employeeSalesData = salesData.filter(
        (sale) => sale.Lanid === lanid
      );
      const employeeAuditData = auditData.filter(
        (audit) => audit.salesreps === lanid
      );

      const department = employeeDepartments.get(lanid);
      const isOperations = department?.toString() === "Operations";

      try {
        const calculator = new WeightedScoringCalculator({
          salesData: employeeSalesData.map((sale) => ({
            ...sale,
            // Add default value of "0" if cancelled_dros is undefined or null
            dros_cancel:
              sale.cancelled_dros !== undefined && sale.cancelled_dros !== null
                ? sale.cancelled_dros.toString()
                : "0",
          })),
          auditData: employeeAuditData.map((audit) => ({
            ...audit,
            id: audit.audits_id,
          })),
          pointsCalculation,
          isOperations,
          minimumDros: 20,
        });

        return {
          ...calculator.metrics,
          Department: department || "Unknown",
          Lanid: lanid,
          TotalWeightedMistakes:
            calculator.metrics.TotalWeightedMistakes || null,
        };
      } catch (error) {
        console.error(`Error calculating metrics for ${lanid}:`, error);
        return null;
      }
    })
    .filter((data): data is SummaryRowData => {
      if (!data) return false;
      return (
        "Lanid" in data &&
        "Department" in data &&
        "TotalDros" in data &&
        "MinorMistakes" in data &&
        "MajorMistakes" in data &&
        "CancelledDros" in data &&
        "WeightedErrorRate" in data &&
        "Qualified" in data &&
        "DisqualificationReason" in data &&
        "TotalWeightedMistakes" in data
      );
    });

  // Sort data by qualification status and error rate
  const qualifiedEmployees = calculatedData
    .filter((emp) => emp.Qualified)
    .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0));

  const unqualifiedEmployees = calculatedData
    .filter((emp) => !emp.Qualified)
    .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0));

  if (
    showAllEmployees &&
    qualifiedEmployees.length &&
    unqualifiedEmployees.length
  ) {
    const divider: SummaryRowData = {
      Lanid: "",
      TotalDros: null,
      MinorMistakes: null,
      MajorMistakes: null,
      CancelledDros: null,
      WeightedErrorRate: null,
      TotalWeightedMistakes: null,
      Qualified: false,
      DisqualificationReason: "",
      isDivider: true,
    };
    return [...qualifiedEmployees, divider, ...unqualifiedEmployees];
  }

  return [...qualifiedEmployees, ...unqualifiedEmployees];
};

const formatDate = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

const getMonthDateRange = (
  date: Date
): { startDate: string; endDate: string } => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

// Export Function
const exportToExcel = (
  data: SummaryRowData[],
  selectedDate: Date,
  showAllEmployees: boolean,
  selectedLanid: string | null
): void => {
  const exportData = data
    .filter((row) => !row.isDivider)
    .map((row) => ({
      "Sales Rep": sanitizeHtml(row.Lanid),
      Department: sanitizeHtml(row.Department || ""),
      "Total DROS": row.TotalDros ?? "",
      "Minor Mistakes": row.MinorMistakes ?? "",
      "Major Mistakes": row.MajorMistakes ?? "",
      "Cancelled DROS": row.CancelledDros ?? "",
      "Weighted Error Rate": row.WeightedErrorRate
        ? `${row.WeightedErrorRate.toFixed(2)}%`
        : "",
      "Total Weighted Mistakes": row.TotalWeightedMistakes ?? "",
      Status: sanitizeHtml(row.DisqualificationReason),
    }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales Contest Results");

  // Format headers
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
// Column Definitions and Table Configurations
import type { ColumnDef } from "@tanstack/react-table";
import type { CSSProperties } from "react";

// Column Helper with proper typing
const columnHelper = createColumnHelper<SummaryRowData>();

// Modal handler for edit operations
const openEditModal = async (audit: Audit): Promise<Partial<Audit> | null> => {
  // Implementation would go here - for now returning null
  // This would typically open your modal UI component
  return null;
};

// Audit action handlers
const handleEditAudit = async (
  audit: Audit,
  updateMutation: any
): Promise<void> => {
  try {
    const updatedData = await openEditModal(audit);
    if (updatedData) {
      await updateMutation.mutateAsync({
        auditId: audit.audits_id,
        data: updatedData,
      });
      toast.success("Audit updated successfully");
    }
  } catch (error) {
    toast.error(
      `Failed to edit audit: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const handleDeleteAudit = async (
  auditId: string,
  deleteMutation: any
): Promise<void> => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this audit?"
  );
  if (confirmDelete) {
    try {
      await deleteMutation.mutateAsync(auditId);
      toast.success("Audit deleted successfully");
    } catch (error) {
      toast.error(
        `Failed to delete audit: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
};

// Summary Table Columns
// Update the summaryColumns definition
const summaryColumns: DataTableColumn[] = [
  {
    Header: "Sales Rep",
    accessor: "Lanid",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {sanitizeHtml(original.Lanid)}
      </div>
    ),
  },
  {
    Header: "Department",
    accessor: "Department",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {sanitizeHtml(original.Department || "")}
      </div>
    ),
  },
  {
    Header: "Total DROS",
    accessor: "TotalDros",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {original.TotalDros === null ? "" : original.TotalDros}
      </div>
    ),
  },
  {
    Header: "Minor Mistakes",
    accessor: "MinorMistakes",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {original.MinorMistakes === null ? "" : original.MinorMistakes}
      </div>
    ),
  },
  {
    Header: "Major Mistakes",
    accessor: "MajorMistakes",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {original.MajorMistakes === null ? "" : original.MajorMistakes}
      </div>
    ),
  },
  {
    Header: "Cancelled DROS",
    accessor: "CancelledDros",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {original.CancelledDros === null ? "" : original.CancelledDros}
      </div>
    ),
  },
  {
    Header: "Weighted Error Rate",
    accessor: "WeightedErrorRate",
    Cell: ({ row: { original } }) => (
      <div className={`${!original.Qualified ? "text-gray-400 italic" : ""}`}>
        {original.isDivider
          ? ""
          : original.WeightedErrorRate === null
          ? ""
          : `${original.WeightedErrorRate.toFixed(2)}%`}
      </div>
    ),
  },
  {
    Header: "Status",
    accessor: "DisqualificationReason",
    Cell: ({ row: { original } }) => (
      <div
        className={`${!original.Qualified ? "text-red-500" : "text-green-500"}`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(original.DisqualificationReason, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            ALLOW_ARIA_ATTR: false,
            ALLOW_DATA_ATTR: false,
            USE_PROFILES: { html: false },
          }),
        }}
      />
    ),
  },
];

// Audit Table Columns
// Update to be a function that takes mutations as parameters
const getAuditColumns = (
  updateAuditMutation: UseMutationResult<
    any,
    Error,
    { auditId: string; data: Partial<Audit> }
  >,
  deleteAuditMutation: UseMutationResult<any, Error, string>
): ColumnDef<Audit>[] => [
  {
    id: "dros_number",
    header: "DROS Number",
    accessorKey: "dros_number",
    cell: ({ row }) => sanitizeHtml(row.original.dros_number),
  },
  {
    id: "salesreps",
    header: "Sales Rep",
    accessorKey: "salesreps",
    cell: ({ row }) => sanitizeHtml(row.original.salesreps),
  },
  {
    id: "audit_type",
    header: "Audit Type",
    accessorKey: "audit_type",
    cell: ({ row }) => sanitizeHtml(row.original.audit_type),
  },
  {
    id: "trans_date",
    header: "Transaction Date",
    accessorKey: "trans_date",
    cell: ({ row }) => format(new Date(row.original.trans_date), "MM/dd/yyyy"),
  },
  {
    id: "audit_date",
    header: "Audit Date",
    accessorKey: "audit_date",
    cell: ({ row }) => format(new Date(row.original.audit_date), "MM/dd/yyyy"),
  },
  {
    id: "error_location",
    header: "Error Location",
    accessorKey: "error_location",
    cell: ({ row }) => sanitizeHtml(row.original.error_location),
  },
  {
    id: "error_details",
    header: "Error Details",
    accessorKey: "error_details",
    cell: ({ row }) => (
      <div className="max-w-md whitespace-normal">
        {sanitizeHtml(row.original.error_details)}
      </div>
    ),
  },
  {
    id: "error_notes",
    header: "Notes",
    accessorKey: "error_notes",
    cell: ({ row }) => (
      <div className="max-w-md whitespace-normal">
        {sanitizeHtml(row.original.error_notes)}
      </div>
    ),
  },
  {
    id: "dros_cancel",
    header: "DROS Cancel",
    accessorKey: "dros_cancel",
    cell: ({ row }) => sanitizeHtml(row.original.dros_cancel),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditAudit(row.original, updateAuditMutation)}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Edit</span>
          <Pencil1Icon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            handleDeleteAudit(row.original.audits_id, deleteAuditMutation)
          }
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Delete</span>
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

// Profile Table Columns
const profileTableColumns: ColumnDef<SummaryRowData>[] = [
  {
    id: "TotalDros",
    header: "Total DROS",
    accessorKey: "TotalDros",
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.TotalDros === null ? "" : row.original.TotalDros}
      </div>
    ),
  },
  {
    id: "MinorMistakes",
    header: "Minor Mistakes",
    accessorKey: "MinorMistakes",
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.MinorMistakes === null ? "" : row.original.MinorMistakes}
      </div>
    ),
  },
  {
    id: "MajorMistakes",
    header: "Major Mistakes",
    accessorKey: "MajorMistakes",
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.MajorMistakes === null ? "" : row.original.MajorMistakes}
      </div>
    ),
  },
  {
    id: "WeightedErrorRate",
    header: "Error Rate",
    accessorKey: "WeightedErrorRate",
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.WeightedErrorRate === null
          ? ""
          : `${row.original.WeightedErrorRate.toFixed(2)}%`}
      </div>
    ),
  },
];

// Table Configuration Options
const tableOptions = {
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  enableRowSelection: false,
  enableColumnResizing: true,
  enableAutoResetPage: true,
  manualPagination: false,
  globalFilterFn: "contains",
  getRowId: (row: any) => row.audits_id || row.Lanid,
};

const profileTableOptions = {
  ...tableOptions,
  enablePagination: false,
  enableFiltering: false,
  enableColumnResizing: false,
};

// Custom Table Styles
const tableStyles = {
  table: "w-full border-collapse",
  thead: "bg-gray-100",
  th: "px-4 py-2 text-left font-semibold text-gray-600",
  tr: "border-b border-gray-200 hover:bg-gray-50",
  td: "px-4 py-2",
} as const;

const profileTableStyles = {
  ...tableStyles,
  table: "w-full border-collapse text-center",
  th: "px-4 py-2 text-center font-semibold text-gray-600",
} as const;
// TanStack Query Hooks
import { useCallback } from "react";

const usePageParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tab = searchParams.get("tab") || "submit";
  const selectedLanid = searchParams.get("lanid") || null;
  const showAllEmployees = searchParams.get("showAll") === "true";
  const dateParam = searchParams.get("date");
  const selectedDate = dateParam ? new Date(dateParam) : null;
  const searchText = searchParams.get("search") || "";

  const setParams = useCallback(
    (params: Partial<PageParams>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          current.delete(key);
        } else {
          current.set(key, value.toString());
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    tab,
    selectedLanid,
    showAllEmployees,
    selectedDate,
    searchText,
    setParams,
  };
};

const useAuditsPageQueries = (pageParams: ReturnType<typeof usePageParams>) => {
  const { selectedDate, selectedLanid, showAllEmployees } = pageParams;
  const queryClient = useQueryClient();

  // Base queries
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: api.fetchEmployees,
    staleTime: Infinity,
  });

  const pointsCalculationQuery = useQuery({
    queryKey: ["pointsCalculation"],
    queryFn: api.fetchPointsCalculation,
    staleTime: Infinity,
  });

  // Date-dependent queries
  const dateRange = selectedDate ? getMonthDateRange(selectedDate) : null;

  const auditsQuery = useQuery({
    queryKey: ["audits"],
    queryFn: () => api.fetchAudits(),
    staleTime: 0, // Set to 0 to ensure fresh data on tab change
  });

  const salesDataQuery = useQuery({
    queryKey: [
      "salesData",
      dateRange?.startDate,
      dateRange?.endDate,
      selectedLanid,
      showAllEmployees, // Add this to dependencies
    ],
    queryFn: () =>
      dateRange
        ? api.fetchSalesData(
            dateRange.startDate,
            dateRange.endDate,
            selectedLanid || undefined,
            showAllEmployees // Pass this explicitly
          )
        : Promise.resolve([]),
    enabled: !!dateRange,
  });

  // Mutations
  const updateAuditMutation = useMutation({
    mutationFn: ({
      auditId,
      data,
    }: {
      auditId: string;
      data: Partial<Audit>;
    }) => api.updateAudit(auditId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      toast.success("Audit updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update audit: ${error.message}`);
    },
  });

  const deleteAuditMutation = useMutation({
    mutationFn: (auditId: string) => api.deleteAudit(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      toast.success("Audit deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete audit: ${error.message}`);
    },
  });

  // Computed summary data
  const summaryData = useMemo(() => {
    if (
      !salesDataQuery.data ||
      !auditsQuery.data ||
      !pointsCalculationQuery.data ||
      !employeesQuery.data
    ) {
      return [];
    }

    return calculateSummaryData(
      salesDataQuery.data,
      auditsQuery.data,
      pointsCalculationQuery.data,
      employeesQuery.data,
      showAllEmployees,
      selectedLanid
    );
  }, [
    salesDataQuery.data,
    auditsQuery.data,
    pointsCalculationQuery.data,
    employeesQuery.data,
    showAllEmployees, // Make sure this dependency is included
    selectedLanid,
  ]);

  // Event handlers that update URL params
  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : null;
      pageParams.setParams({ date: formattedDate || undefined });
    },
    [pageParams.setParams]
  );

  const handleEmployeeChange = useCallback(
    (lanid: string) => {
      pageParams.setParams({
        lanid,
        showAll: "false",
      });
    },
    [pageParams.setParams]
  );

  const handleShowAllChange = useCallback(
    (checked: boolean) => {
      // Always reset the query cache when toggling view
      queryClient.invalidateQueries({
        queryKey: ["salesData"],
      });

      pageParams.setParams({
        showAll: checked.toString(),
        lanid: undefined, // Clear the selected lanid when showing all employees
      });
    },
    [pageParams.setParams, queryClient]
  );

  const handleReset = useCallback(() => {
    pageParams.setParams({
      date: undefined,
      lanid: undefined,
      showAll: undefined,
      search: undefined,
    });
  }, [pageParams.setParams]);

  const handleExport = useCallback(() => {
    if (selectedDate) {
      exportToExcel(summaryData, selectedDate, showAllEmployees, selectedLanid);
    } else {
      toast.error("Please select a date before exporting");
    }
  }, [summaryData, selectedDate, showAllEmployees, selectedLanid]);

  const handleTabChange = useCallback(
    (value: string) => {
      pageParams.setParams({ tab: value });
    },
    [pageParams.setParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      pageParams.setParams({ search: value || undefined });
    },
    [pageParams.setParams]
  );

  const summaryTableData = useMemo(() => {
    if (showAllEmployees) {
      // If showing all employees, include divider between qualified and unqualified
      const qualifiedEmployees = summaryData.filter((emp) => emp.Qualified);
      const unqualifiedEmployees = summaryData.filter((emp) => !emp.Qualified);

      if (qualifiedEmployees.length && unqualifiedEmployees.length) {
        return [
          ...qualifiedEmployees,
          {
            Lanid: "",
            TotalDros: null,
            MinorMistakes: null,
            MajorMistakes: null,
            CancelledDros: null,
            WeightedErrorRate: null,
            TotalWeightedMistakes: null,
            Qualified: false,
            DisqualificationReason: "",
            isDivider: true,
          },
          ...unqualifiedEmployees,
        ];
      }
      return summaryData;
    }
    // If not showing all, filter for selected employee
    return summaryData.filter((item) => item.Lanid === selectedLanid);
  }, [showAllEmployees, summaryData, selectedLanid]);

  return {
    // Queries
    employeesQuery,
    pointsCalculationQuery,
    auditsQuery,
    salesDataQuery,

    // Mutations
    updateAuditMutation,
    deleteAuditMutation,

    // Computed data
    summaryData,
    summaryTableData,

    // Loading states
    isLoading:
      employeesQuery.isLoading ||
      pointsCalculationQuery.isLoading ||
      auditsQuery.isLoading ||
      salesDataQuery.isLoading,

    isError:
      employeesQuery.isError ||
      pointsCalculationQuery.isError ||
      auditsQuery.isError ||
      salesDataQuery.isError,

    error:
      employeesQuery.error ||
      pointsCalculationQuery.error ||
      auditsQuery.error ||
      salesDataQuery.error,

    // Handlers
    handlers: {
      handleDateChange,
      handleEmployeeChange,
      handleShowAllChange,
      handleReset,
      handleExport,
      handleTabChange,
      handleSearchChange,
    },
  };
};

// Realtime subscription hook
const useRealtimeSubscription = () => {
  const queryClient = useQueryClient();

  const subscription = useQuery({
    queryKey: ["realtime-subscription"],
    queryFn: () => {
      const channel = supabase
        .channel("Auditsinput_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Auditsinput",
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["audits"] });
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => channel.unsubscribe();
    },
    gcTime: Infinity,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return subscription;
};

// Export combined hook for component use
const useAuditsPage = () => {
  const pageParams = usePageParams();
  const queries = useAuditsPageQueries(pageParams);
  useRealtimeSubscription();

  return {
    ...pageParams,
    ...queries,
  };
};

// Main Component Implementation
function AuditsPage() {
  const {
    // URL Params
    tab,
    selectedLanid,
    showAllEmployees,
    selectedDate,
    searchText,

    // Queries
    employeesQuery,
    pointsCalculationQuery,
    auditsQuery,
    salesDataQuery,

    // Mutations
    updateAuditMutation,
    deleteAuditMutation,

    // Computed data
    summaryData,
    summaryTableData,
    // Loading states
    isLoading,
    isError,
    error,

    // Handlers
    handlers: {
      handleDateChange,
      handleEmployeeChange,
      handleShowAllChange,
      handleReset,
      handleExport,
      handleTabChange,
      handleSearchChange,
    },
  } = useAuditsPage();

  // Error boundary
  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {error instanceof Error
                ? error.message
                : "An error occurred while loading the page"}
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin", "dev"]}>
      {isLoading && <LoadingIndicator />}

      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mb-10 my-8">
          <SupportNavMenu />
        </div>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="flex items-center space-x-2">
            <TabsList>
              <TabsTrigger value="submit">Submit Audits</TabsTrigger>
              <TabsTrigger value="review">Review Audits</TabsTrigger>
              <TabsTrigger value="contest">Sales Contest</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="submit">
            <Card>
              <CardContent className="pt-6">
                <SubmitAuditForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardContent className="pt-6">
                {auditsQuery.isLoading ? (
                  <LoadingIndicator />
                ) : auditsQuery.data ? (
                  <DataTable
                    columns={getAuditColumns(
                      updateAuditMutation,
                      deleteAuditMutation
                    )}
                    data={auditsQuery.data}
                  />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contest">
            <h1 className="text-xl font-bold mb-2 ml-2">
              <TextGenerateEffect words="Monthly Sales" />
            </h1>

            {/* Controls Grid */}
            <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {/* Employee Selection Card */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Sales Rep</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full">
                    <Select
                      value={selectedLanid || ""}
                      onValueChange={handleEmployeeChange}
                      disabled={showAllEmployees}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <Input
                          placeholder="Search Employee..."
                          value={searchText}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full px-3 py-2"
                        />
                        {employeesQuery.data
                          ?.filter((emp) =>
                            emp.lanid
                              ?.toLowerCase()
                              .includes(searchText.toLowerCase())
                          )
                          .map((emp) => (
                            <SelectItem key={emp.lanid} value={emp.lanid}>
                              {emp.lanid}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="show-all"
                      checked={showAllEmployees}
                      onCheckedChange={handleShowAllChange}
                    />
                    <Label htmlFor="show-all">
                      {showAllEmployees
                        ? "Showing All Employees"
                        : "Showing Selected Employee"}
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection Card */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Select A Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {selectedDate ? (
                          format(selectedDate, "MMMM yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CustomCalendar
                        selectedDate={selectedDate || new Date()}
                        onDateChange={handleDateChange}
                        disabledDays={() => false}
                      />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    Mistake Definitions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-primary mb-2">
                      Minor Mistakes
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Correctable mistakes that can be resolved during pickup
                      without requiring the customer to return.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    Mistake Definitions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-primary mb-2">
                      Major Mistakes
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Serious errors that require the customer to make an
                      additional trip back after pickup to resolve the issue.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleReset}
                    >
                      Clear All Selections
                    </Button>
                    <Button
                      onClick={handleExport}
                      className="w-full"
                      disabled={!selectedDate}
                    >
                      Export to Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Grid - Only shown for individual employee view */}
            {/* Metrics Grid - Only shown for individual employee view */}
            <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {!showAllEmployees && selectedLanid && (
                <>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Total # Of DROS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Total DROS",
                              accessor: "TotalDros",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => (
                                <div className="text-center font-semibold text-lg">
                                  {value}
                                </div>
                              ),
                            },
                          ]}
                          data={summaryTableData}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Minor Mistakes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Minor Mistakes",
                              accessor: "MinorMistakes",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => (
                                <div className="text-center font-semibold text-lg">
                                  {value}
                                </div>
                              ),
                            },
                          ]}
                          data={summaryTableData}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Major Mistakes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Major Mistakes",
                              accessor: "MajorMistakes",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => (
                                <div className="text-center font-semibold text-lg">
                                  {value}
                                </div>
                              ),
                            },
                          ]}
                          data={summaryTableData}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Cancelled DROS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Cancelled DROS",
                              accessor: "CancelledDros",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => (
                                <div className="text-center font-semibold text-lg">
                                  {value}
                                </div>
                              ),
                            },
                          ]}
                          data={summaryTableData}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Error Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Error Rate",
                              accessor: "WeightedErrorRate",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => (
                                <div className="text-center font-semibold text-lg">
                                  {value}%
                                </div>
                              ),
                            },
                          ]}
                          data={summaryTableData}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Summary Table */}
            <Card>
              <CardContent>
                {selectedDate && (
                  <DataTableProfile
                    columns={summaryColumns.map((col) => ({
                      Header: col.Header as string,
                      accessor: col.accessor as string,
                      Cell: col.Cell as any,
                    }))}
                    data={summaryTableData}
                    {...tableOptions}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}

// Export with Query Client Provider
const AuditsPageWithProvider = () => (
  <QueryClientProvider client={queryClient}>
    <AuditsPage />
  </QueryClientProvider>
);

export default AuditsPageWithProvider;
