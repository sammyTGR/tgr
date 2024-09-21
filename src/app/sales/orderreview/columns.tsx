"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../admin/audits/review/data-table-column-header";
import { OrderTableRowActions } from "./order-table-row-actions";
import { statuses } from "./data";
import { includesArrayString } from "./custom-filter";

export type Order = {
  is_read: any;
  id: number;
  employee: string;
  employee_email: string; // Add this line
  customer_type: string;
  inquiry_type: string;
  customer_name: string;
  email: string;
  phone: string;
  manufacturer: string;
  item: string;
  details: string;
  contacted: boolean;
  created_at: string;
  status: string;
};

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export const createColumns = (
  setStatus: (id: number, status: string) => void,
  markAsContacted: (id: number) => void
): ColumnDef<Order>[] => [
  {
    accessorKey: "employee",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employee" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "customer_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Type" />
    ),
    meta: {
      style: { width: "40px", overflow: "hidden" },
    },
  },
  {
    accessorKey: "inquiry_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Inquiry Type" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Name" />
    ),
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    meta: {
      style: { width: "180px" },
    },
  },
  {
    accessorKey: "manufacturer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Manufacturer" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "item",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item/Model" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
    meta: {
      style: { width: "250px", overflow: "hidden" },
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Submitted" />
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find((s) => s.value === row.original.status);
      return status ? status.label : row.original.status;
    },
    meta: {
      style: { width: "150px" },
    },
    filterFn: includesArrayString,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <OrderTableRowActions
        row={row}
        markAsContacted={markAsContacted}
        undoMarkAsContacted={(id) => setStatus(id, "not_contacted")}
        setStatus={setStatus}
      />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
];
