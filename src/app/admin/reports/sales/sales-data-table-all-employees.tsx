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
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollBar, ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";

const TIMEZONE = "America/Los_Angeles";

interface Employee {
  employee_id: number;
  lanid: string | null;
  name: string | null;
  last_name: string | null;
  status: string | null;
  department: string | null;
}

// Add an interface for the exported row data
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
  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([
    "all",
  ]);
  const [commandOpen, setCommandOpen] = React.useState(false);

  // Add loading state for export
  const [isExporting, setIsExporting] = React.useState(false);

  // Add search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [descriptionSearch, setDescriptionSearch] = React.useState("");

  // Fetch employees query
  const employeesQuery = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id,lanid,name,last_name,status,department")
        .eq("status", "active")
        .in("department", ["Sales", "Range", "Operations"])
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Filter out employees with no lanid
  const validEmployees = employeesQuery.data?.filter(
    (employee): employee is Employee & { lanid: string } =>
      Boolean(employee.lanid) &&
      employee.status === "active" &&
      ["Sales", "Range", "Operations"].includes(employee.department || "")
  );

  // Filter employees based on search query with improved search logic
  const filteredEmployees = React.useMemo(() => {
    if (!validEmployees) return [];
    if (!searchQuery.trim()) return validEmployees;

    return validEmployees.filter((employee) => {
      const fullName = `${employee.name || ""} ${employee.last_name || ""}`
        .toLowerCase()
        .trim();
      const searchTerm = searchQuery.toLowerCase().trim();

      // Check if the search term appears in the full name
      return fullName.includes(searchTerm);
    });
  }, [validEmployees, searchQuery]);

  // Add some debug logging
  // console.log({
  //   searchQuery,
  //   validEmployeesCount: validEmployees?.length,
  //   filteredEmployeesCount: filteredEmployees?.length,
  //   filteredEmployees,
  // });

  // Fetch sales data query with simplified date handling
  const salesQuery = useQuery({
    queryKey: [
      "allEmployeesSales",
      pageIndex,
      pageSize,
      filters,
      sorting,
      dateRange,
      selectedEmployees,
      descriptionSearch,
    ],
    queryFn: async () => {
      try {
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
            dateRange:
              dateRange.from && dateRange.to
                ? {
                    from: format(
                      toZonedTime(startOfDay(dateRange.from), TIMEZONE),
                      "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
                    ),
                    to: format(
                      toZonedTime(endOfDay(dateRange.to), TIMEZONE),
                      "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
                    ),
                  }
                : undefined,
            employeeLanids: selectedEmployees.includes("all")
              ? null
              : selectedEmployees,
            descriptionSearch: descriptionSearch.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Sales data fetch error:", errorData);
          throw new Error(
            `Failed to fetch sales data: ${errorData.message || response.statusText}`
          );
        }

        return response.json();
      } catch (error) {
        console.error("Sales query error:", error);
        throw error;
      }
    },
    initialData: { data: [], count: 0 },
  });

  const handleExport = async () => {
    try {
      if (!dateRange.from || !dateRange.to) {
        console.error("Date range is required");
        return;
      }

      setIsExporting(true);

      const response = await fetch("/api/fetch-all-employees-sales-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRange: {
            from: format(
              toZonedTime(startOfDay(dateRange.from), TIMEZONE),
              "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
            ),
            to: format(
              toZonedTime(endOfDay(dateRange.to), TIMEZONE),
              "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
            ),
          },
          employeeLanids: selectedEmployees.includes("all")
            ? null
            : selectedEmployees,
          descriptionSearch: descriptionSearch.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch export data: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data?.data?.length) {
        // console.log("No data found for the selected range");
        return;
      }

      const exportData = data.data.map((row: any) => ({
        Date: format(
          toZonedTime(new Date(row.SoldDate), TIMEZONE),
          "yyyy-MM-dd HH:mm:ss"
        ),
        Invoice: row.Invoice,
        Employee: row.Lanid,
        "Employee Name": row.employee_name,
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

      const filename = `sales_report_${
        selectedEmployees.includes("all")
          ? "all_employees"
          : selectedEmployees.join(",")
      }_${format(new Date(dateRange.from), "yyyy-MM-dd")}_to_${format(
        new Date(dateRange.to),
        "yyyy-MM-dd"
      )}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Export failed:", error);
      // You might want to show an error toast here
    } finally {
      setIsExporting(false); // End loading state
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

  if (salesQuery.isError) {
    console.error("Sales query error:", salesQuery.error);
    return (
      <div className="text-center py-8 text-red-500">
        Error loading sales data. Please try again.
      </div>
    );
  }

  if (salesQuery.isLoading) {
    return (
      <div className="text-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Popover open={commandOpen} onOpenChange={setCommandOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex max-w-[700px] justify-start"
            >
              {selectedEmployees.includes("all") ? (
                "All Employees"
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {selectedEmployees.map((id) => {
                    const emp = validEmployees?.find((e) => e.lanid === id);
                    return (
                      <Badge key={id} variant="secondary" className="mr-1">
                        {`${emp?.name || ""} ${emp?.last_name || ""}`.trim() ||
                          "Unknown"}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            {employeesQuery.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search employees..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {filteredEmployees.length === 0 && searchQuery ? (
                    <CommandEmpty>No employee found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedEmployees(["all"]);
                          setCommandOpen(false);
                          setPageIndex(0);
                          setSearchQuery("");
                        }}
                      >
                        All Employees
                      </CommandItem>
                      {filteredEmployees.map((employee) => (
                        <CommandItem
                          key={employee.employee_id}
                          onSelect={() => {
                            setSelectedEmployees((prev) => {
                              if (prev.includes("all")) {
                                return [employee.lanid];
                              }
                              if (prev.includes(employee.lanid)) {
                                return prev.filter(
                                  (id) => id !== employee.lanid
                                );
                              }
                              return [...prev, employee.lanid];
                            });
                            setPageIndex(0);
                          }}
                        >
                          {`${employee.name || ""}`.trim() || "Unknown"}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            )}
          </PopoverContent>
        </Popover>

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

        <Input
          placeholder="Search by description..."
          value={descriptionSearch}
          onChange={(e) => {
            setDescriptionSearch(e.target.value);
            setPageIndex(0);
          }}
          className="max-w-sm"
        />

        <Button
          variant="outline"
          onClick={() => {
            setDateRange({ from: undefined, to: undefined });
            setSelectedEmployees(["all"]);
            setDescriptionSearch("");
            setSearchQuery("");
            setPageIndex(0);
          }}
        >
          Reset Filters
        </Button>

        <Button
          onClick={handleExport}
          disabled={isExporting || !dateRange.from || !dateRange.to}
          className="ml-auto"
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

      <div className="flex gap-4"></div>

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
