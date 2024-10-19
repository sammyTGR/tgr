"use client";

import * as React from "react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnFiltersState,
  SortingState,
  GroupingState,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScheduleRowActions } from "./schedule-row-actions";
import { SchedulePagination } from "./schedule-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  fetchReferenceSchedules: () => void; // Function to refresh schedules after update
  fetchActualSchedules: () => void; // Function to refresh schedules after update
  showPagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  sorting,
  onSortingChange,
  fetchReferenceSchedules,
  fetchActualSchedules,
  showPagination = true,
}: DataTableProps<TData, TValue>) {
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [searchInput, setSearchInput] = React.useState("");

  const [grouping, setGrouping] = React.useState<GroupingState>([
    "employee_name",
  ]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const sortedColumns = React.useMemo(() => {
    return columns.map((column) => {
      if (column.id === "day_of_week") {
        return {
          ...column,
          sortingFn: (rowA: any, rowB: any, columnId: string) => {
            const days = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ];
            return (
              days.indexOf(rowA.getValue(columnId)) -
              days.indexOf(rowB.getValue(columnId))
            );
          },
        };
      }
      return column;
    });
  }, [columns]);

  const table = useReactTable({
    data,
    columns: sortedColumns,
    state: {
      columnFilters,
      sorting: sorting || [],
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function"
          ? updater(sorting || localSorting)
          : updater;
      if (onSortingChange) {
        onSortingChange(newSorting);
      } else {
        setLocalSorting(newSorting);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: showPagination ? 7 : data.length },
      sorting: [
        { id: "employee_name", desc: false },
        { id: "day_of_week", desc: false },
      ],
    },
  });

  const handleResetFilter = () => {
    table.getColumn("employee_name")?.setFilterValue("");
    setSearchInput("");
  };

  return (
    <div className="flex flex-col h-full w-full max-h-[80vh]">
      <div className="flex flex-row items-center justify-between mx-2 my-2">
        <Input
          placeholder="Search schedules..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            table
              .getColumn("employee_name")
              ?.setFilterValue(event.target.value);
          }}
          className="max-w-sm w-full"
        />
        {searchInput && (
          <Button onClick={handleResetFilter}>Reset Filter</Button>
        )}
      </div>
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td>
                  <ScheduleRowActions
                    row={row}
                    fetchReferenceSchedules={fetchReferenceSchedules}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showPagination && <SchedulePagination table={table} />}
      </div>
    </div>
  );
}
