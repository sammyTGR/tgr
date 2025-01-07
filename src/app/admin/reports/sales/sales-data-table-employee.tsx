// src/app/admin/reports/sales/sales-data-table-employee.tsx
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import { DataTableEmployee } from "./data-table-employee";
import { employeeSalesColumns } from "./columns-employee";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";

interface SalesData {
  id: number;
  Lanid: string;
  Desc: string;
  Date: string;
  Last: string;
  Mfg: string;
  category_label: string;
  subcategory_label: string;
  total_gross: number;
  total_net: number;
}

interface SalesDataTableEmployeeProps {
  employeeId: number;
}

const SalesDataTableEmployee: React.FC<SalesDataTableEmployeeProps> = ({
  employeeId,
}) => {
  const queryClient = useQueryClient();
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

  // Fetch sales data query with date range
  const { data: salesData, isLoading } = useQuery({
    queryKey: [
      "employeeSales",
      employeeId,
      pageIndex,
      pageSize,
      filters,
      sorting,
      dateRange,
    ],
    queryFn: async () => {
      const response = await fetch("/api/fetch-employee-sales-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          pageIndex,
          pageSize,
          filters,
          sorting,
          dateRange,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      return result;
    },
  });

  // Update sales data mutation
  const updateSalesMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<SalesData>;
    }) => {
      const response = await fetch(`/api/update-sales-data/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Labels updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["employeeSales"] });
    },
    onError: () => {
      toast.error("Failed to update labels.");
    },
  });

  const table = useReactTable({
    data: salesData?.data ?? [],
    columns: employeeSalesColumns((id, updates) => {
      updateSalesMutation.mutate({ id, updates });
    }),
    pageCount: salesData ? Math.ceil(salesData.count / pageSize) : -1,
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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
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
              onSelect={(range: DateRange | undefined) =>
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          onClick={() => setDateRange({ from: undefined, to: undefined })}
        >
          Reset Dates
        </Button>
      </div>
      <DataTableEmployee table={table} />
    </div>
  );
};

export default SalesDataTableEmployee;
