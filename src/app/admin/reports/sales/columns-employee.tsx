// src/app/admin/reports/sales/columns-employee.tsx

import { format } from "date-fns";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";

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
  //   accessorKey: "Lanid",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Lanid" />
  //   ),
  //   meta: {
  //     style: { width: "150px" },
  //   },
  // },
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
    cell: ({ row }) => format(new Date(row.original.Date), "yyyy-MM-dd"),
    meta: {
      style: { width: "180px" },
    },
    sortingFn: "datetime",
    filterFn: (row, columnId, filterValue) => {
      const formattedDate = format(
        new Date(row.getValue(columnId)),
        "yyyy-MM-dd"
      );
      return formattedDate.includes(filterValue);
    },
  },
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
  //   accessorKey: "LastName",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="LastName" />
  //   ),
  //   meta: {
  //     style: { width: "150px" },
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
