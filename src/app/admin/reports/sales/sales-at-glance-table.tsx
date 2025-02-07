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
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@radix-ui/react-icons";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface SalesAtGlanceTableProps {
  period: "1day" | "7days" | "14days" | "30days" | "lastMonth" | "custom";
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

// Add this interface for period totals
interface PeriodTotals {
  totalNet: number;
  totalGross: number;
}

// Add the MonthSelect component
const MonthSelect: React.FC<{
  value: Date;
  onChange: (date: Date) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value, "MMMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (date) {
              onChange(date);
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export const SalesAtGlanceTable: React.FC<SalesAtGlanceTableProps> = ({
  period,
  selectedEmployees,
}) => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "Date", desc: true },
  ]);

  // Add state for selected month
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(
    subMonths(new Date(), 1)
  );

  // Calculate date range based on period
  const dateRange = React.useMemo(() => {
    const yesterday = subDays(new Date(), 1);
    let start: Date;
    let end: Date;

    switch (period) {
      case "1day":
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      case "7days":
        start = startOfDay(subDays(yesterday, 6));
        end = endOfDay(yesterday);
        break;
      case "14days":
        start = startOfDay(subDays(yesterday, 13));
        end = endOfDay(yesterday);
        break;
      case "30days":
        start = startOfDay(subDays(yesterday, 29));
        end = endOfDay(yesterday);
        break;
      case "lastMonth":
      case "custom":
        // Use the selected month for both lastMonth and custom periods
        start = startOfMonth(selectedMonth);
        end = endOfMonth(selectedMonth);
        break;
      default:
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
    }

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
  }, [period, selectedMonth]);

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
          sorting:
            sorting.map((sort) => ({
              ...sort,
              // Map the Date field to SoldDate for sorting
              id: sort.id === "Date" ? "SoldDate" : sort.id,
            })) || [],
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

  // Add a query for period totals
  const periodTotalsQuery = useQuery({
    queryKey: ["periodTotals", period, selectedEmployees, dateRange],
    queryFn: async () => {
      const response = await fetch("/api/fetch-period-totals", {
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
        throw new Error("Failed to fetch period totals");
      }

      return response.json() as Promise<PeriodTotals>;
    },
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const [salesResponse, periodTotalsResponse] = await Promise.all([
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
        // Fetch period totals separately
        fetch("/api/fetch-period-totals", {
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

      if (!salesResponse.ok || !periodTotalsResponse.ok) {
        throw new Error("Failed to fetch export data");
      }

      const [{ data, summary }, periodTotals] = await Promise.all([
        salesResponse.json(),
        periodTotalsResponse.json(),
      ]);

      if (!data?.length) {
        toast.error("No data found for the selected range");
        return;
      }

      const wb = XLSX.utils.book_new();

      // Add period totals sheet with safe values
      const periodTotalsSheet = XLSX.utils.json_to_sheet([
        {
          "Total Transactions": data.length,
          "Total Gross Revenue": periodTotals?.totalGross || 0,
          "Total Net Revenue": periodTotals?.totalNet || 0,
          "Average Transaction Value": data.length
            ? ((periodTotals?.totalGross || 0) / data.length).toFixed(2)
            : "0.00",
        },
      ]);
      XLSX.utils.book_append_sheet(wb, periodTotalsSheet, "Period_Summary");

      // Add employee summary sheet
      const summaryData =
        summary ||
        data.reduce((acc: any[], row: any) => {
          const existingEmployee = acc.find((e) => e.Lanid === row.Lanid);
          if (existingEmployee) {
            existingEmployee.total_gross += row.total_gross || 0;
            existingEmployee.total_net += row.Margin || 0;
            existingEmployee.transaction_count += 1;
          } else {
            acc.push({
              "Employee Name": row.employee_name,
              "Total Gross": row.total_gross || 0,
              "Total Net": row.Margin || 0,
              "Transaction Count": 1,
            });
          }
          return acc;
        }, []);

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Employee_Summary");

      // Add detailed transactions sheet
      const detailsSheet = XLSX.utils.json_to_sheet(
        data.map((row: any) => ({
          Date: row.SoldDate,
          Invoice: row.SoldRef,
          Employee: row.Lanid,
          "Employee Name": row.employee_name,
          Description: row.Desc,
          Category: row.CatDesc,
          Subcategory: row.SubDesc,
          "Sold Price": row.SoldPrice,
          "Sold Quantity": row.Qty,
          Cost: row.Cost,
          "Total Gross": row.total_gross,
          "Total Net": row.Margin,
        }))
      );
      XLSX.utils.book_append_sheet(wb, detailsSheet, "Detailed_Transactions");

      // Set column widths and formatting
      const sheets = [
        "Period_Summary",
        "Employee_Summary",
        "Detailed_Transactions",
      ];
      sheets.forEach((sheet) => {
        const ws = wb.Sheets[sheet];
        const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

        // Set column widths
        const cols = [];
        for (let i = 0; i <= range.e.c; ++i) {
          cols.push({ wch: 15 }); // Set width to 15 characters
        }
        ws["!cols"] = cols;
      });

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
      {/* Add Month Picker when custom period or lastMonth is selected */}
      {(period === "custom" || period === "lastMonth") && (
        <div className="mb-6">
          <MonthSelect value={selectedMonth} onChange={setSelectedMonth} />
        </div>
      )}

      {/* Period Totals Card */}
      <div className="mb-6">
        <div className="p-6 rounded-lg bg-card text-card-foreground shadow-sm">
          <h2 className="font-semibold text-xl mb-4">
            {period === "lastMonth" ? "Sales Summary" : "Period Summary"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm text-muted-foreground">
                Total Net (Period)
              </h3>
              <p className="text-2xl font-bold">
                {periodTotalsQuery.data
                  ? `$${periodTotalsQuery.data.totalNet.toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                  : "Loading..."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm text-muted-foreground">
                Total Gross (Period)
              </h3>
              <p className="text-2xl font-bold">
                {periodTotalsQuery.data
                  ? `$${periodTotalsQuery.data.totalGross.toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                  : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

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
                        {summary.total_net?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? "0.00"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        Total Gross
                      </span>
                      <span className="font-medium">
                        $
                        {summary.total_gross?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? "0.00"}
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
