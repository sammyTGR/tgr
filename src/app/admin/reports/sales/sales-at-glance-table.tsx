import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import { DataTableEmployee } from "./data-table-employee";
import { employeeSalesColumns } from "./columns-all-employees";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@radix-ui/react-icons";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface SalesAtGlanceTableProps {
  period: "1day" | "7days" | "14days" | "30days";
  selectedEmployees: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Add the export interface
interface ExportRow {
  Date: string;
  Invoice: string;
  Employee: string;
  "Employee Name": string;
  SKU: string;
  Description: string;
  Category: string;
  Subcategory: string;
  "Sold Price": number;
  "Sold Quantity": number;
  Cost: number;
  "Total Gross": number;
  "Total Net": number;
}

// Add interfaces for the summary data
interface EmployeeSummary {
  Lanid: string;
  employee_name: string;
  total_gross: number;
  total_net: number;
}

export const SalesAtGlanceTable: React.FC<SalesAtGlanceTableProps> = ({
  period,
  selectedEmployees,
}) => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "Date", desc: true },
  ]);

  // Calculate date range based on period
  const dateRange = React.useMemo(() => {
    const yesterday = subDays(new Date(), 1);
    const end = endOfDay(yesterday);

    // Calculate start date based on period
    let daysToSubtract;
    switch (period) {
      case "1day":
        daysToSubtract = 0; // Just yesterday
        break;
      case "7days":
        daysToSubtract = 6; // Yesterday plus 6 previous days = 7 days total
        break;
      case "14days":
        daysToSubtract = 13; // Yesterday plus 13 previous days = 14 days total
        break;
      case "30days":
        daysToSubtract = 29; // Yesterday plus 29 previous days = 30 days total
        break;
      default:
        daysToSubtract = 0;
    }

    const start = startOfDay(subDays(yesterday, daysToSubtract));

    // Debug logging
    // console.log("Date Range Calculation:", {
    //   period,
    //   yesterday: format(yesterday, "yyyy-MM-dd"),
    //   start: format(start, "yyyy-MM-dd"),
    //   end: format(end, "yyyy-MM-dd"),
    //   daysToSubtract,
    //   daysDifference: Math.ceil(
    //     (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    //   ),
    // });

    return { start, end };
  }, [period]);

  // Fetch sales data
  const salesQuery = useQuery({
    queryKey: [
      "glanceSales",
      period,
      pageIndex,
      pageSize,
      sorting,
      selectedEmployees,
    ],
    queryFn: async () => {
      const response = await fetch("/api/fetch-all-employees-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIndex: Number(pageIndex),
          pageSize: Number(pageSize),
          sorting: sorting || [],
          dateRange: {
            from: format(dateRange.start, "yyyy-MM-dd"),
            to: format(dateRange.end, "yyyy-MM-dd"),
          },
          employeeLanids: selectedEmployees.includes("all")
            ? null
            : selectedEmployees,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }

      return response.json();
    },
    refetchInterval: 300000,
  });

  const table = useReactTable({
    data: salesQuery.data?.data ?? [],
    columns: employeeSalesColumns(() => {}),
    pageCount: Math.max(1, Math.ceil((salesQuery.data?.count ?? 0) / pageSize)),
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
    },
    onPaginationChange: (updater) => {
      const newPaginationState =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPaginationState.pageIndex);
      setPageSize(newPaginationState.pageSize);
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  // Add loading state
  const [isExporting, setIsExporting] = React.useState(false);

  // Add export query
  const exportQuery = useQuery({
    queryKey: ["exportGlanceSales", period, selectedEmployees, dateRange],
    queryFn: async () => {
      const response = await fetch("/api/fetch-all-employees-sales-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRange: {
            from: format(dateRange.start, "yyyy-MM-dd'T'00:00:00.000'Z'"),
            to: format(dateRange.end, "yyyy-MM-dd'T'23:59:59.999'Z'"),
          },
          employeeLanids: selectedEmployees.includes("all")
            ? null
            : selectedEmployees,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch export data");
      }

      return response.json();
    },
    enabled: false,
  });

  // Add this near your other queries
  const employeeSummaryQuery = useQuery({
    queryKey: ["employeeSummary", period, selectedEmployees, dateRange],
    queryFn: async () => {
      const response = await fetch("/api/fetch-employee-sales-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRange: {
            from: format(dateRange.start, "yyyy-MM-dd"),
            to: format(dateRange.end, "yyyy-MM-dd"),
          },
          employeeLanids: selectedEmployees.includes("all")
            ? null
            : selectedEmployees,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employee summary");
      }

      const data: EmployeeSummary[] = await response.json();
      return data;
    },
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const [salesResponse, summaryResponse] = await Promise.all([
        fetch("/api/fetch-all-employees-sales-export", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRange: {
              from: format(dateRange.start, "yyyy-MM-dd'T'00:00:00.000'Z'"),
              to: format(dateRange.end, "yyyy-MM-dd'T'23:59:59.999'Z'"),
            },
            employeeLanids: selectedEmployees.includes("all")
              ? null
              : selectedEmployees,
          }),
        }),
        fetch("/api/fetch-employee-sales-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRange: {
              from: format(dateRange.start, "yyyy-MM-dd"),
              to: format(dateRange.end, "yyyy-MM-dd"),
            },
            employeeLanids: selectedEmployees.includes("all")
              ? null
              : selectedEmployees,
          }),
        }),
      ]);

      if (!salesResponse.ok || !summaryResponse.ok) {
        throw new Error("Failed to fetch export data");
      }

      const [salesData, summaryData] = await Promise.all([
        salesResponse.json(),
        summaryResponse.json(),
      ]);

      if (!salesData?.data?.length) {
        toast.error("No data found for the selected range");
        return;
      }

      const wb = XLSX.utils.book_new();

      // Add summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(
        summaryData.map((summary: EmployeeSummary) => ({
          "Employee Name": summary.employee_name,
          "Total Gross": summary.total_gross,
          "Total Net": summary.total_net,
        }))
      );
      XLSX.utils.book_append_sheet(wb, summarySheet, `Summary_${period}`);

      // Add detailed sales sheet
      const detailsSheet = XLSX.utils.json_to_sheet(
        salesData.data.map((row: any) => ({
          Date: row.Date,
          Invoice: row.Invoice,
          Employee: row.Lanid,
          "Employee Name": row.employee_name,
          Description: row.Desc,
          Category: row.category_label,
          Subcategory: row.subcategory_label,
          "Sold Price": row.SoldPrice,
          "Sold Quantity": row.SoldQty,
          Cost: row.Cost,
          "Total Gross": row.total_gross,
          "Total Net": row.total_net,
        }))
      );
      XLSX.utils.book_append_sheet(wb, detailsSheet, `Details_${period}`);

      const filename = `sales_report_${period}_${
        selectedEmployees.includes("all")
          ? "all_employees"
          : selectedEmployees.join(",")
      }_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  if (salesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={
            isExporting ||
            salesQuery.isLoading ||
            !salesQuery.data?.data?.length
          }
        >
          {isExporting ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Exporting...
            </>
          ) : (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export to Excel
            </>
          )}
        </Button>
      </div>

      {/* Employee Summary Section */}
      <div className="mb-6">
        {employeeSummaryQuery.isLoading ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground">Loading summaries...</p>
          </div>
        ) : employeeSummaryQuery.isError ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground">Error loading summaries</p>
          </div>
        ) : employeeSummaryQuery.data &&
          employeeSummaryQuery.data.length > 0 ? (
          <div className="p-6 rounded-lg  bg-card text-card-foreground shadow-sm">
            {/* <h2 className="font-semibold text-xl mb-4">Sales Summary</h2> */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4">
              {employeeSummaryQuery.data.map((summary) => (
                <div key={summary.Lanid} className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    {summary.employee_name}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        Total Net
                      </span>
                      <span className="font-medium">
                        $
                        {summary.total_net.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        Total Gross
                      </span>
                      <span className="font-medium">
                        $
                        {summary.total_gross.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <p className="text-muted-foreground">
              No sales data available for the selected period
            </p>
          </div>
        )}
      </div>

      {/* <DataTableEmployee table={table} /> */}
    </div>
  );
};
