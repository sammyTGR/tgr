"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { labels } from "./data";
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./data-table-row-actions";
import { UUID } from "crypto";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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
  audits_id: string;
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes?: string | null;
  dros_cancel: string | null;
  label?: string;
};

export const createColumns = (
  refreshData: () => void
): ColumnDef<AuditData>[] => [
  {
    accessorKey: "dros_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="DROS Number" />
    ),
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label);

      return (
        <div className="flex space-x-2">
          {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("dros_number")}
          </span>
        </div>
      );
    },
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "salesreps",
    header: "Sales Reps",
    meta: {
      style: { width: "100px" },
    },
  },
  // {
  //   accessorKey: "audit_type",
  //   header: "Audit Type",
  //   meta: {
  //     style: { width: "100px" },
  //   },
  // },
  {
    accessorKey: "trans_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Date" />
    ),
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label);
      const dateStr = row.getValue("trans_date") as string;

      // Create date in UTC to avoid timezone shifts
      const date = new Date(dateStr + "T12:00:00Z");
      const formattedDate = format(date, "MM/dd/yyyy");

      return (
        <div className="flex space-x-2">
          {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {formattedDate}
          </span>
        </div>
      );
    },
    meta: {
      style: { width: "60px" },
    },
  },
  {
    id: "audit_date",
    header: "Audit Date",
    accessorKey: "audit_date",
    cell: ({ row }) => {
      const dateStr = row.getValue("audit_date") as string;
      // Create date in UTC to avoid timezone shifts
      const date = new Date(dateStr + "T12:00:00Z");
      const formattedDate = format(date, "MM/dd/yyyy");
      return formattedDate;
    },
  },
  {
    accessorKey: "error_location",
    header: "Error Location",
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "error_details",
    header: "Error Details",
    meta: {
      style: { width: "400px" },
    },
  },
  {
    accessorKey: "error_notes",
    header: "Notes",
    meta: {
      style: { width: "450px" },
    },
  },
  {
    accessorKey: "dros_cancel",
    header: "DROS Cancelled",
    meta: {
      style: { width: "150px" },
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions row={row} onAuditUpdated={refreshData} />
    ),
  },
];
export default createColumns;
