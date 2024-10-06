// src/app/admin/reports/sales/sales-data-table.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
  ColumnFiltersState,
  VisibilityState,
  OnChangeFn,
} from "@tanstack/react-table";
import { SalesTableToolbar } from "./sales-table-toolbar";
import { salesColumns } from "./columns";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { SalesDataTablePagination } from "./data-table-pagination";
import { Input } from "@/components/ui/input";
import { format, startOfDay, endOfDay, parseISO, addDays } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import classNames from "classnames";
import styles from "./table.module.css";

interface SalesData {
  id: number;
  Lanid: string;
  Invoice: number;
  Sku: string;
  Desc: string;
  SoldPrice: number;
  SoldQty: number;
  Cost: number;
  Acct: number;
  Date: string;
  Disc: number;
  Type: string;
  Spiff: number;
  Last: string;
  LastName: string;
  Legacy: string;
  Stloc: number;
  Cat: number;
  Sub: number;
  Mfg: string;
  CustType: string;
  category_label: string;
  subcategory_label: string;
  status: string;
  total_gross: number; // new column
  total_net: number; // new column
}

interface SalesDataTableProps {
  startDate?: string;
  endDate?: string;
}

const SalesDataTable: React.FC<SalesDataTableProps> = ({
  startDate,
  endDate,
}) => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const onUpdate = async (id: number, updates: Partial<SalesData>) => {
    const { error } = await supabase
      .from("sales_data")
      .update(updates)
      .eq("id", id);
    if (error) {
      //console.("Error updating sales data:", error);
      toast.error("Failed to update labels.");
    } else {
      setSales((currentSales) =>
        currentSales.map((sale) =>
          sale.id === id ? { ...sale, ...updates } : sale
        )
      );
      toast.success("Labels updated successfully.");
    }
  };

  const columns = useMemo(() => salesColumns(onUpdate), []);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const initialVisibility: VisibilityState = {};
      columns.forEach((column) => {
        if (column.id) {
          initialVisibility[column.id] = column.initial !== false;
        }
      });
      return initialVisibility;
    }
  );

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      // console.log("Fetching data with dates:", { startDate, endDate });
      const response = await fetch("/api/fetch-sales-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data, count } = await response.json();
      // console.log("Raw data received:", data);
      if (Array.isArray(data)) {
        // Convert dates to UTC
        const formattedData = data.map((item) => ({
          ...item,
          Date: new Date(item.Date + "T00:00:00Z").toISOString().split("T")[0],
        }));
        // console.log("Formatted data:", formattedData);

        // Filter data based on UTC dates
        const filteredData = formattedData.filter((item) => {
          const itemDate = new Date(item.Date + "T00:00:00Z");
          const start = new Date(startDate + "T00:00:00Z");
          const end = new Date(endDate + "T23:59:59.999Z");

          // console.log("Comparing dates:", {
          //   itemDate: itemDate.toISOString(),
          //   start: start.toISOString(),
          //   end: end.toISOString(),
          //   isWithinRange: itemDate >= start && itemDate <= end
          // });

          return itemDate >= start && itemDate <= end;
        });

        // console.log("Filtered data:", filteredData);
        setSales(filteredData);
        setPageCount(Math.ceil(filteredData.length / pageSize));
      } else {
        //console.("Unexpected data format:", data);
        toast.error("Received unexpected data format");
      }
    } catch (error) {
      //console.("Failed to fetch sales data:", error);
      toast.error("Failed to fetch sales data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchSalesData();
    }
  }, [startDate, endDate, pageIndex, pageSize, sorting, columnFilters]);

  const handleFilterChange: OnChangeFn<ColumnFiltersState> = (
    updaterOrValue
  ) => {
    setColumnFilters((old) =>
      typeof updaterOrValue === "function"
        ? updaterOrValue(old)
        : updaterOrValue
    );
  };

  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    setSorting((old) =>
      typeof updaterOrValue === "function"
        ? updaterOrValue(old)
        : updaterOrValue
    );
  };

  // const columns = useMemo(() => salesColumns(onUpdate), []);

  const table = useReactTable({
    data: sales,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleFilterChange,
    onColumnVisibilityChange: setColumnVisibility,

    onPaginationChange: (updater) => {
      const newPaginationState =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPaginationState.pageIndex);
      setPageSize(newPaginationState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    // manualSorting: true,
  });

  return (
    <div className="flex flex-col max-h-full w-full overflow-hidden">
      <div className="flex flex-row items-center justify-between mx-2 my-2 overflow-hidden">
        <Input
          placeholder="Filter sales by rep..."
          value={(table.getColumn("Lanid")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("Lanid")?.setFilterValue(event.target.value)
          }
          className=" max-w-sm w-full"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-hidden max-h-full rounded-md border w-full sm:w-full md:w-full lg:min-w-8xl lg:max-w-8xl">
        <div className="overflow-hidden">
          <ScrollArea
            className={classNames(
              styles.noScroll,
              "h-[calc(100vh-500px)] w-[calc(100vw-100px)] overflow-auto"
            )}
          >
            <Table className="w-full overflow-hidden">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="overflow-hidden">
                {isLoading ? (
                  <TableRow className="overflow-hidden">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="overflow-hidden">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-left"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <div className="flex flex-col mt-4">
        <SalesDataTablePagination table={table} />
      </div>
    </div>
  );
};

export default SalesDataTable;
