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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import classNames from "classnames";
import styles from "./table.module.css";
import { useSidebar } from "@/components/ui/sidebar";

interface DataTableProps<TData> {
  table: TableType<TData>;
}

export function DataTable<TData>({ table }: DataTableProps<TData>) {
  const { state } = useSidebar();

  return (
    <div
      className={`flex flex-col max-h-full w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] overflow-hidden transition-all duration-300`}
    >
      <div className="flex flex-row items-center justify-between mx-2 my-2 overflow-hidden">
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
        className={`flex-1 overflow-hidden max-h-full rounded-md border w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] mt-2 transition-all duration-300`}
      >
        <div className="overflow-hidden">
          <ScrollArea
            className={classNames(
              styles.noScroll,
              "h-[calc(100vh-20rem)] w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] overflow-hidden relative"
            )}
          >
            <Table className="w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] overflow-hidden transition-all duration-300">
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
              <TableBody className="overflow-hidden">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      className="overflow-hidden"
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
                  <TableRow className="overflow-hidden">
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
      <div
        className={`flex-1 overflow-hidden max-h-full w-full md:w-[calc(100vw-20rem)] lg:w-[calc(100vw-24rem)] transition-all duration-300`}
      >
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
