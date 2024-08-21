"use client";

import * as React from "react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimesheetRowActions } from "./timesheet-row-actions";
import { TimesheetPagination } from "./TimesheetPagination";
import {
  DoubleArrowDownIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

interface TimesheetData {
  id: number;
  employee_id: number;
  start_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  end_time: string | null;
  total_hours: string | null;
  created_at: string | null;
  employee_name: string | null;
  event_date: string | null;
}

interface TimesheetDataTableProps {
  columns: ColumnDef<TimesheetData>[];
  data: TimesheetData[];
  fetchTimesheets: () => void;
}

export function TimesheetDataTable({
  columns,
  data: initialData,
  fetchTimesheets,
}: TimesheetDataTableProps) {
  const [data, setData] = React.useState(initialData);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [searchInput, setSearchInput] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "event_date", desc: true },
  ]);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const updateTimesheet = React.useCallback(
    (updatedTimesheet: TimesheetData) => {
      setData((prevData) =>
        prevData.map((item) =>
          item.id === updatedTimesheet.id ? updatedTimesheet : item
        )
      );
    },
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      expanded,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
      grouping: ["employee_name"],
      sorting: [{ id: "event_date", desc: true }],
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
          placeholder="Search timesheets..."
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
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <tr
                    key={row.id}
                    onClick={() => row.toggleExpanded()}
                    className="cursor-pointer"
                  >
                    <td colSpan={columns.length + 1} className="px-6 py-4">
                      <div className="flex items-center">
                        {row.getIsExpanded() ? (
                          <DoubleArrowDownIcon className="mr-2 h-4 w-4" />
                        ) : (
                          <DoubleArrowRightIcon className="mr-2 h-4 w-4" />
                        )}
                        <span>{row.getValue("employee_name")}</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                  <td>
                    <TimesheetRowActions
                      row={row}
                      fetchTimesheets={fetchTimesheets}
                      updateTimesheet={updateTimesheet}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TimesheetPagination table={table} />
    </div>
  );
}
