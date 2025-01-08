// src/app/admin/reports/sales/columns-all-employees.tsx

import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { compareAsc, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export interface SalesData {
  id: number;
  Desc: string;
  Date: string;
  Last: string;
  Mfg: string;
  category_label: string;
  subcategory_label: string;
  total_gross: number;
  total_net: number;
}

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export const employeeSalesColumns = (
  onUpdate: (id: number, updates: Partial<SalesData>) => void
): ColumnDef<SalesData>[] => [
  // {
  //   accessorKey: "Invoice",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Invoice" />
  //   ),
  //   meta: {
  //     style: { width: "150px" },
  //   },
  // },
  // {
  //   accessorKey: "Sku",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Sku" />
  //   ),
  //   meta: {
  //     style: { width: "200px" },
  //   },
  // },
  {
    accessorKey: "Date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const originalDate = row.original.Date;
      if (!originalDate) return "";

      try {
        const parsedDate = parseISO(originalDate);
        const utcDate = toZonedTime(parsedDate, "UTC");
        return format(utcDate, "MM/dd/yyyy");
      } catch (error) {
        console.error("Error formatting date:", error);
        return "";
      }
    },
    meta: {
      style: { width: "180px" },
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = rowA.original.Date
        ? parseISO(rowA.original.Date)
        : new Date(0);
      const dateB = rowB.original.Date
        ? parseISO(rowB.original.Date)
        : new Date(0);
      return compareAsc(dateA, dateB);
    },
    filterFn: (row, columnId, filterValue) => {
      const dateValue = row.getValue(columnId);
      if (!dateValue) return false;
      try {
        const date = parseISO(String(dateValue));
        const utcDate = toZonedTime(date, "UTC");
        const formattedDate = format(utcDate, "yyyy-MM-dd");
        return formattedDate.includes(filterValue);
      } catch (error) {
        return false;
      }
    },
  },
  {
    accessorKey: "Lanid",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lanid" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  //   {
  //     accessorKey: "LastName",
  //     header: ({ column }) => (
  //       <DataTableColumnHeader column={column} title="LastName" />
  //     ),
  //     meta: {
  //       style: { width: "150px" },
  //     },
  //   },
  {
    accessorKey: "Desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desc" />
    ),
    meta: {
      style: { width: "600px" },
    },
  },
  // {
  //   accessorKey: "SoldPrice",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Sold Price" />
  //   ),
  //   meta: {
  //     style: { width: "100px" },
  //   },
  // },
  // {
  //   accessorKey: "SoldQty",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Sold Qty" />
  //   ),
  //   meta: {
  //     style: { width: "100px" },
  //   },
  // },
  // {
  //   accessorKey: "Cost",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Cost" />
  //   ),
  //   meta: {
  //     style: { width: "100px" },
  //   },
  // },
  // {
  //   accessorKey: "Acct",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Acct" />
  //   ),
  //   meta: {
  //     style: { width: "100px" },
  //   },
  // },

  // {
  //   accessorKey: "Last",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Last" />
  //   ),
  //   meta: {
  //     style: { width: "180px" },
  //   },
  // },

  // {
  //   accessorKey: "Mfg",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Mfg" />
  //   ),
  //   meta: {
  //     style: { width: "300px" },
  //   },
  // },
  // {
  //   accessorKey: "CustType",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="CustType" />
  //   ),
  //   meta: {
  //     style: { width: "150px" },
  //   },
  // },
  {
    accessorKey: "category_label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category Label" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "subcategory_label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subcategory Label" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "total_gross",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Gross" />
    ),
    meta: {
      style: { width: "100px" },
    },
  },
  {
    accessorKey: "total_net",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Net" />
    ),
    meta: {
      style: { width: "100px" },
    },
  },
];
