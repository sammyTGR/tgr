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
  PaginationState,
  ColumnDef,
} from "@tanstack/react-table";

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
import { CertificationDataTablePagination } from "./data-table-pagination"; // Ensure the correct import path
import { CertificationData } from "./types"; // Import the extended type and CertificationData type
import { PopoverForm } from "./PopoverForm"; // Import the PopoverForm component
import { useRole } from "@/context/RoleContext"; // Import the useRole hook

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pageIndex: number;
  setPageIndex: (pageIndex: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  filters: any[];
  handleAddCertificate: (
    id: string,
    updates: Partial<CertificationData>
  ) => Promise<void>; // Updated signature
  employees: { employee_id: number; name: string }[];
}

export function CertificationDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex,
  setPageIndex,
  pageSize,
  setPageSize,
  filters,
  handleAddCertificate, // Destructure the function
  employees, // Destructure the employees data
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const { role } = useRole(); // Get the user's role

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const { pageIndex: newPageIndex, pageSize: newPageSize } = updater({
          pageIndex,
          pageSize,
        });
        setPageIndex(newPageIndex);
        setPageSize(newPageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // Set based on your data handling strategy
    pageCount,
  });

  return (
    <div className="flex flex-col h-full max-w-7xl">
      <div className="flex flex-row items-center justify-between mx-2">
        {/* Add A Certificate Button - Only for Admins and Super Admins */}
        {(role === "admin" || role === "super admin" || role === "dev") && (
          <Button variant="linkHover1">
            <PopoverForm
              onSubmit={handleAddCertificate} // Now matches the expected signature
              buttonText="Add A Certificate"
              placeholder="Add a new certificate"
              formType="addCertificate"
              employees={employees} // Pass the employees data
            />
          </Button>
        )}

        {/* Columns Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="linkHover2" className="ml-auto mb-2">
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
      <div className="flex-1 overflow-hidden rounded-md border w-full max-w-7xl sm:w-full md:w-full ">
        <div className="h-[calc(100vh-200px)] overflow-auto">
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
        <CertificationDataTablePagination table={table} />
      </div>
    </div>
  );
}
