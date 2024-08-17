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
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimesheetRowActions } from "./timesheet-row-actions"; // Import the correct RowActions component
import { TimesheetPagination } from "./TimesheetPagination";

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
  fetchTimesheets: () => void; // Function to refresh timesheets after update
}

export function TimesheetDataTable({
  columns,
  data,
  fetchTimesheets,
}: TimesheetDataTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [searchInput, setSearchInput] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } }, // Initialize pagination with a page size of 10
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td>
                  <TimesheetRowActions
                    row={row}
                    fetchTimesheets={fetchTimesheets}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TimesheetPagination table={table} />
      {/* <div className="flex justify-between items-center mt-4 px-6 py-2">
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div> */}
    </div>
  );
}
