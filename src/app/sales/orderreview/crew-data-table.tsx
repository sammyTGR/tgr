// src/app/sales/orderreview/data-table.tsx

import * as React from "react";
import { flexRender, Table as TableType } from "@tanstack/react-table";
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
import { DataTablePagination } from "@/app/admin/audits/review/pagination";
import { useSidebar } from "@/components/ui/sidebar";
import classNames from "classnames";
import styles from "./table.module.css";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DataTableProps<TData> {
  table: TableType<TData>;
}

export function DataTable<TData>({ table }: DataTableProps<TData>) {
  const { state } = useSidebar();

  return (
    <div
      className={`flex flex-col max-h-full ${state === "collapsed" ? "w-[calc(100vw-40rem)]" : "w-[calc(100vw-40rem)]"} overflow-hidden transition-all duration-300`}
    >
      <div className="flex flex-row items-center justify-between mx-2 my-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button> */}
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
      <div
        className={`flex-1 overflow-hidden max-h-full rounded-md border ${state === "collapsed" ? "w-[calc(100vw-40rem)]" : "w-[calc(100vw-40rem)]"} sm:w-full md:w-full lg:max-w-[${state === "collapsed" ? "calc(100vw-40rem)" : "calc(100vw-40rem)"}] transition-all duration-300`}
      >
        <div className="overflow-hidden">
          <ScrollArea
            className={classNames(
              styles.noScroll,
              "h-[calc(100vh-500px)] w-[calc(100vw-40rem)] overflow-hidden relative"
            )}
          >
            <Table
              className={`${state === "collapsed" ? "w-[calc(100vw-40rem)]" : "w-[calc(100vw-40rem)]"} overflow-hidden transition-all duration-300`}
            >
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
                      colSpan={table.getAllColumns().length}
                      className="h-24 text-center"
                    >
                      No results.
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
      <div className="flex-none mt-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
