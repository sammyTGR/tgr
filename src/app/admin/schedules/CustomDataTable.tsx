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
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  fetchReferenceSchedules: () => void;
  fetchActualSchedules: () => void;
  showPagination?: boolean;
}

export function CustomDataTable<TData, TValue>({
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

  const formattedColumns = React.useMemo(() => {
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
      if (column.id === "start_time" || column.id === "end_time") {
        return {
          ...column,
          cell: ({ getValue }: { getValue: () => any }) => {
            const value = getValue();
            if (typeof value === "string") {
              // Handle HH:mm:ss or HH:mm format
              const match = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
              if (match) {
                const [_, hours, minutes] = match;
                const date = new Date(
                  2000,
                  0,
                  1,
                  parseInt(hours),
                  parseInt(minutes)
                );
                const zonedDate = toZonedTime(date, timeZone);
                return formatInTimeZone(zonedDate, timeZone, "h:mm a");
              }
            }
            if (value instanceof Date) {
              const zonedDate = toZonedTime(value, timeZone);
              return formatInTimeZone(zonedDate, timeZone, "h:mm a");
            }
            return value;
          },
        };
      }
      return column;
    });
  }, [columns]);

  const table = useReactTable({
    data,
    columns: formattedColumns,
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
      </div>
    </div>
  );
}
