
"use client"
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/app/auditreview/data-table-column-header";
import { labels, priorities, statuses } from "@/app/auditreview/data";
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./data-table-row-actions";

type UUID = string; // Define it as a string if you do not have a specific UUID type.

export type AuditData = {
    label: string;
    id: UUID;
    dros_number: string;
    salesreps: string;
    audit_type: string;
    trans_date: string;
    audit_date?: string;
    error_location: string;
    error_details: string;
    error_notes?: string;
    dros_cancel: boolean;
};

export const columns: ColumnDef<AuditData>[] = [
    {
        accessorKey: "dros_number",
        header: "DROS Number",
    },
    {
        accessorKey: "salesreps",
        header: "Sales Reps",
    },
    {
        accessorKey: "audit_type",
        header: "Audit Type",
    },
    {
        accessorKey: "trans_date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Transaction Date" />
          ),
          cell: ({ row }) => {
            const label = labels.find((label) => label.value === row.original.label)
      
            return (
              <div className="flex space-x-2">
                {label && <Badge variant="outline">{label.label}</Badge>}
                <span className="max-w-[500px] truncate font-medium">
                  {row.getValue("trans_date")}
                </span>
              </div>
            )
          },
        },
    {
        accessorKey: "audit_date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Audit Date" />
          ),
          cell: ({ row }) => {
            const label = labels.find((label) => label.value === row.original.label)
      
            return (
              <div className="flex space-x-2">
                {label && <Badge variant="outline">{label.label}</Badge>}
                <span className="max-w-[500px] truncate font-medium">
                  {row.getValue("audit_date")}
                </span>
              </div>
            )
          },
        },
    {
        accessorKey: "error_location",
        header: "Error Location",
    },
    {
        accessorKey: "error_details",
        header: "Error Details",
    },
    {
        accessorKey: "error_notes",
        header: "Notes",
    },
    {
        accessorKey: "dros_cancel",
        header: "DROS Cancelled",
    },
    {
        id: "actions",
        cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
