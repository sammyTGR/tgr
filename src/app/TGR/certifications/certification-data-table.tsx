// src/app/TGR/certifications/certification-data-table.tsx
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  Table as TanstackTable,
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
import { CertificationDataTablePagination } from "./data-table-pagination";
import { PopoverForm } from "./PopoverForm";
import { useRole } from "@/context/RoleContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface CertificationData {
  id: string;
  name: string;
  certificate: string;
  number: number;
  expiration: string;
  status: string;
  action_status: string;
}

export interface Employee {
  employee_id: number;
  name: string;
}

interface CertificationDataTableProps {
  data: CertificationData[];
  table: TanstackTable<CertificationData>;
  employees: Employee[];
  onAddCertificate: (cert: Partial<CertificationData>) => void;
}

export function CertificationDataTable({
  data,
  table,
  employees,
  onAddCertificate,
}: CertificationDataTableProps) {
  const { role } = useRole();
  const isAdmin = role === "admin" || role === "super admin" || role === "dev";

  return (
    <div className="flex flex-col h-full max-w-7xl">
      <div className="flex flex-row items-center justify-between mx-2">
        {isAdmin && (
          <Button variant="linkHover1">
            <PopoverForm
              onSubmit={(_, updates) => onAddCertificate(updates)}
              buttonText="Add A Certificate"
              placeholder="Add a new certificate"
              formType="addCertificate"
              employees={employees}
            />
          </Button>
        )}

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
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-hidden rounded-md border w-full max-w-7xl sm:w-full md:w-full">
        <div className="h-[calc(100vh-300px)] mx-auto overflow-hidden">
          <ScrollArea>
            <div className="max-h-[calc(100vh-300px)] max-w-[calc(100vw-20px)] overflow-auto relative">
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
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-none mt-4">
        <CertificationDataTablePagination table={table} />
      </div>
    </div>
  );
}
