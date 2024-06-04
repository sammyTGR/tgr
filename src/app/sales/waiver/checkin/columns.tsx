// src/app/sales/waiver/checkin/columns.tsx
"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import WaiverTableRowActions from "./waiver-table-row-actions";
import { Waiver } from "./types";
import { includesArrayString } from "./custom-filter";

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export const waiverColumns = (
  onStatusChange: (id: string, status: "checked_in" | "checked_out") => void
): ColumnDef<Waiver>[] => [
  {
    accessorKey: "first_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    meta: {
      style: { width: "150px" },
    },
    // filterFn: includesString,
  },
  {
    accessorKey: "last_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    meta: {
      style: { width: "150px" },
    },
    // filterFn: includesString,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: {
      style: { width: "200px" },
    },
    // filterFn: includesString,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    meta: {
      style: { width: "120px" },
    },
    // filterFn: includesString,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Signed" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    },
    meta: {
      style: { width: "120px" },
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      return row.original.status === "checked_in" ? "Checked in" : "";
    },
    meta: {
      style: { width: "100px" },
    },
    filterFn: includesArrayString, // Use the custom filter function
  },
  {
    accessorKey: "misdemeanor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Misdemeanor" />
    ),
    cell: ({ row }) => (row.original.misdemeanor === "yes" ? "Yes" : ""),
    meta: {
      style: { width: "100px" },
    },
    // filterFn: includesString,
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <WaiverTableRowActions
        waiver={row.original}
        onStatusChange={onStatusChange}
      />
    ),
    meta: {
      style: { width: "100px" },
    },
  },
];

export type { Waiver };
