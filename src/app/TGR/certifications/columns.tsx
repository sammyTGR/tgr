// src/app/TGR/certifications/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, isValid } from "date-fns";
import { CertificationData } from "./types";
import { DataTableColumnHeader } from "./data-table-column-header";
import CertificationTableRowActions from "./certification-table-row-actions";
import { includesArrayString } from "./custom-filter";

export const certificationColumns = (
  onUpdate: (id: string, updates: Partial<CertificationData>) => void
): ColumnDef<CertificationData, unknown>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "certificate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Certificate" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Number" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "expiration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expiration" />
    ),
    cell: ({ row }) => {
      const date = parseISO(row.original.expiration);
      return isValid(date) ? format(date, "yyyy-MM-dd") : "Invalid Date";
    },
    meta: {
      style: { width: "150px" },
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = parseISO(rowA.getValue(columnId));
      const dateB = parseISO(rowB.getValue(columnId));
      return dateA.getTime() - dateB.getTime();
    },
    filterFn: (row, columnId, filterValue) => {
      const formattedDate = format(
        new Date(row.getValue(columnId)),
        "yyyy-MM-dd"
      );
      return formattedDate.includes(filterValue);
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: {
      style: { width: "150px" },
    },
    filterFn: includesArrayString,
  },
  {
    accessorKey: "action_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action Status" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <CertificationTableRowActions
        certification={row.original}
        onUpdate={onUpdate}
      />
    ),
    meta: {
      style: { width: "100px" },
    },
  },
];
