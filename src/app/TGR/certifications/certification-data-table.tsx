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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import classNames from "classnames";
import styles from "./table.module.css";

export interface CertificationData {
  id: string;
  name: string;
  certificate: string;
  number: number;
  expiration: string;
  status: string;
  action_status: string;
  employees?: {
    status: string;
  };
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
  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        throw new Error("Failed to fetch user role");
      }
      const data = await response.json();
      return data;
    },
    staleTime: Infinity,
  });

  const { state } = useSidebar();

  const isAdmin = ["admin", "super admin", "dev", "ceo"].includes(
    userRole?.role
  );

  return (
    <div
      className={`flex flex-col max-h-full ${state === "collapsed" ? "w-[calc(100vw-20rem)]" : "w-[calc(100vw-25rem)]"} overflow-hidden transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev", "ceo"]}>
          <Button variant="outline">
            <PopoverForm
              onSubmit={(_, updates) => onAddCertificate(updates)}
              buttonText="Add A Certificate"
              placeholder="Add a new certificate"
              formType="addCertificate"
              employees={employees}
            />
          </Button>
        </RoleBasedWrapper>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
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

      <div
        className={`flex-1 overflow-hidden max-h-full rounded-md border ${state === "collapsed" ? "w-[calc(100vw-20rem)] mt-2" : "w-[calc(100vw-25rem)] mt-2"} sm:w-full md:w-full lg:max-w-[${state === "collapsed" ? "calc(100vw-40rem)" : "calc(100vw-40rem)"}] transition-all duration-300`}
      >
        <div className="overflow-hidden">
          <ScrollArea
            className={classNames(
              styles.noScroll,
              "h-[calc(100vh-20rem)] w-[calc(100vw-20rem)] overflow-hidden relative"
            )}
          >
            {/* <div className="rounded-md border"> */}
            <Table
              className={`${state === "collapsed" ? "w-[calc(100vw-20rem)]" : "w-[calc(100vw-25rem)]"} overflow-hidden transition-all duration-300`}
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
            {/* </div> */}
          </ScrollArea>
        </div>
      </div>

      <div className="flex-none">
        <CertificationDataTablePagination table={table} />
      </div>
    </div>
  );
}
