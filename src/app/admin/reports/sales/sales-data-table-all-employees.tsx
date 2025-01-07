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
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { type DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DownloadIcon } from "@radix-ui/react-icons";
import * as XLSX from "xlsx";

const TIMEZONE = "America/Los_Angeles";

interface Employee {
  employee_id: number;
  lanid: string | null;
  name: string | null;
  last_name: string | null;
  status: string | null;
}

// Add an interface for the exported row data
interface ExportRow {
  Date: string;
  Invoice: string;
  Employee: string;
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

const SalesDataTableAllEmployees: React.FC = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "Date", desc: true },
  ]);
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("all");

  // Fetch employees query
  const employeesQuery = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch(
        `/api/fetchEmployees?select=employee_id,lanid,name,last_name&status=active&order=name.asc`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      return response.json();
    },
  });

  // Filter out employees with no lanid
  const validEmployees = employeesQuery.data?.filter(
    (employee): employee is Employee & { lanid: string } =>
      Boolean(employee.lanid)
  );

  // Fetch sales data query with timezone handling
  const salesQuery = useQuery({
    queryKey: [
      "allEmployeesSales",
      pageIndex,
      pageSize,
      filters,
      sorting,
      dateRange,
      selectedEmployee,
    ],
    queryFn: async () => {
      const adjustedDateRange = {
        from: dateRange.from
          ? toZonedTime(
              new Date(dateRange.from.setHours(0, 0, 0, 0)),
              TIMEZONE
            ).toISOString()
          : undefined,
        to: dateRange.to
          ? toZonedTime(
              new Date(dateRange.to.setHours(23, 59, 59, 999)),
              TIMEZONE
            ).toISOString()
          : undefined,
      };

      const response = await fetch("/api/fetch-all-employees-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIndex: Number(pageIndex),
          pageSize: Number(pageSize),
          filters: filters || [],
          sorting: sorting || [],
          dateRange: adjustedDateRange,
          employeeLanid: selectedEmployee === "all" ? null : selectedEmployee,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }

      return response.json();
    },
    initialData: { data: [], count: 0 },
  });

  // Add a new query for fetching all data for export
  const exportQuery = useQuery({
    queryKey: ["exportSales", dateRange, selectedEmployee],
    queryFn: async () => {
      const adjustedDateRange = {
        from: dateRange.from
          ? toZonedTime(
              new Date(dateRange.from.setHours(0, 0, 0, 0)),
              TIMEZONE
            ).toISOString()
          : undefined,
        to: dateRange.to
          ? toZonedTime(
              new Date(dateRange.to.setHours(23, 59, 59, 999)),
              TIMEZONE
            ).toISOString()
          : undefined,
      };

      const response = await fetch("/api/fetch-all-employees-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIndex: 0,
          pageSize: 1000000, // Large number to get all records
          filters: filters || [],
          sorting: sorting || [],
          dateRange: adjustedDateRange,
          employeeLanid: selectedEmployee === "all" ? null : selectedEmployee,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch export data");
      }

      return response.json();
    },
    enabled: false, // Only run when explicitly requested
  });

  const handleExport = async () => {
    try {
      if (!dateRange.from || !dateRange.to) {
        console.error("Date range is required");
        return;
      }

      // Create new Date objects to avoid mutating the original dates
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);

      // Format dates in Pacific timezone with exact start/end times
      const adjustedDateRange = {
        from: formatInTimeZone(from, TIMEZONE, "yyyy-MM-dd'T'00:00:00.000XXX"),
        to: formatInTimeZone(to, TIMEZONE, "yyyy-MM-dd'T'23:59:59.999XXX"),
      };

      const response = await fetch("/api/fetch-all-employees-sales-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRange: adjustedDateRange,
          employeeLanid: selectedEmployee === "all" ? null : selectedEmployee,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch export data: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data?.data?.length) {
        console.log("No data found for the selected range");
        return;
      }

      // Format the export data
      const exportData = data.data.map((row: any) => ({
        Date: row.Date, // The date is already formatted by the API
        Invoice: row.Invoice,
        Employee: row.Lanid,
        SKU: row.Sku,
        Description: row.Desc,
        Category: row.category_label,
        Subcategory: row.subcategory_label,
        "Sold Price": row.SoldPrice,
        "Sold Quantity": row.SoldQty,
        Cost: row.Cost,
        "Total Gross": row.total_gross,
        "Total Net": row.total_net,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Data");

      // Use the original dates for the filename
      const filename = `sales_report_${
        selectedEmployee === "all" ? "all_employees" : selectedEmployee
      }_${format(from, "yyyy-MM-dd")}_to_${format(to, "yyyy-MM-dd")}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const table = useReactTable({
    data: salesQuery.data?.data ?? [],
    columns: employeeSalesColumns(() => {}),
    pageCount: Math.max(1, Math.ceil((salesQuery.data?.count ?? 0) / pageSize)),
    state: {
      pagination: { pageIndex, pageSize },
      columnFilters: filters,
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
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const showEmptyState =
    !salesQuery.data?.data?.length && !salesQuery.isLoading;

  if (salesQuery.isLoading || employeesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedEmployee}
          onValueChange={(value) => {
            setSelectedEmployee(value);
            setPageIndex(0);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {validEmployees?.map((employee) => (
              <SelectItem key={employee.employee_id} value={employee.lanid}>
                {`${employee.name || ""} ${employee.last_name || ""}`.trim() ||
                  "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range: DateRange | undefined) => {
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                });
                setPageIndex(0);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          onClick={() => {
            setDateRange({ from: undefined, to: undefined });
            setSelectedEmployee("all");
            setPageIndex(0);
          }}
        >
          Reset Filters
        </Button>

        <Button
          onClick={handleExport}
          disabled={exportQuery.isFetching}
          className="ml-auto" // Push to right side
        >
          {exportQuery.isFetching ? (
            "Exporting..."
          ) : (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export to Excel
            </>
          )}
        </Button>
      </div>
      <Card className="p-4">
        {showEmptyState ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : (
          <DataTableEmployee table={table} />
        )}
      </Card>
    </div>
  );
};

export default SalesDataTableAllEmployees;
