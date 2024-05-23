"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/app/auditreview/data-table-column-header";
import { labels } from "@/app/auditreview/data";
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./data-table-row-actions";
import { UUID } from "crypto";

// Extend the ColumnDef type to include a meta property with a style field
export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export type AuditData = {
  label: string;
  id: UUID;
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes?: string;
  dros_cancel: boolean;
};

export const columns: ColumnDef<AuditData>[] = [
  {
    accessorKey: "dros_number",
    header: "DROS Number",
    meta: {
      style: { width: "300px" },
    },
  },
  {
    accessorKey: "salesreps",
    header: "Sales Reps",
    meta: {
      style: { width: "300px" },
    },
  },
  {
    accessorKey: "audit_type",
    header: "Audit Type",
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "trans_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Date" />
    ),
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label);

      return (
        <div className="flex space-x-2">
          {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("trans_date")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "audit_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Audit Date" />
    ),
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label);

      return (
        <div className="flex space-x-2">
          {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("audit_date")}
          </span>
        </div>
      );
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
];
