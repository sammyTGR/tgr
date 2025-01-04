import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import styles from "./table.module.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { DataTablePagination } from "./pagination";
import { ColumnDef, RangeWalkData } from "./columns";
import { DataTableRowActions } from "./data-table-row-actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import classNames from "classnames";
import { useQueryClient } from "@tanstack/react-query";

interface DataTableProps<TData extends RangeWalkData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  userRole: string;
  userUuid: string;
  onStatusChange: (id: number, status: string | null) => void;
  onNotesChange: (id: number, notes: string, userName: string) => void;
}

export function DataTable<TData extends RangeWalkData, TValue>({
  columns,
  data,
  userRole,
  userUuid,
  onStatusChange,
  onNotesChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [userNameFilter, setUserNameFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
  });

  const hasActiveFilters = () => {
    return Boolean(userNameFilter || dateFilter);
  };

  const clearFilters = () => {
    setUserNameFilter("");
    setDateFilter("");

    table.getColumn("user_name")?.setFilterValue("");
    table.getColumn("date_of_walk")?.setFilterValue("");
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-row items-center gap-2 my-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Filter By Employee..."
            value={userNameFilter}
            onChange={(event) => {
              setUserNameFilter(event.target.value);
              table.getColumn("user_name")?.setFilterValue(event.target.value);
            }}
            className="max-w-sm"
          />
          <Input
            placeholder="Filter By Date..."
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              table
                .getColumn("date_of_walk")
                ?.setFilterValue(event.target.value);
            }}
            className="max-w-sm"
          />
          {hasActiveFilters() && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Columns Dropdown */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
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
        </DropdownMenu> */}
      </div>
      <div className="flex-1 overflow-hidden rounded-md border w-full">
        <div className="max-h-[calc(100vh-100px)] overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const metaStyle = (
                      header.column.columnDef.meta as {
                        style?: React.CSSProperties;
                      }
                    )?.style;
                    return (
                      <TableHead key={header.id} style={metaStyle}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const metaStyle = (
                        cell.column.columnDef.meta as {
                          style?: React.CSSProperties;
                        }
                      )?.style;
                      return (
                        <TableCell key={cell.id} style={metaStyle}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex-none mt-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
