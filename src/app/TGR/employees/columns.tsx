"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Employee } from "./types";
import { DataTableColumnHeader } from "./data-table-column-header";

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
  },
  {
    accessorKey: "last_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
    ),
  },
  {
    accessorKey: "position",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
  },
  {
    accessorKey: "contact_info",
    header: "Contact Info",
  },
  // {
  //   accessorKey: "phone_number",
  //   header: "Phone Number",
  // },
  {
    accessorKey: "lanid",
    header: "LANID",
  },
  {
    accessorKey: "pay_type",
    header: "Pay Type",
  },
  {
    accessorKey: "pay_rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pay Rate" />
    ),
    cell: ({ row }) => {
      const pay_rate = parseFloat(row.getValue("pay_rate"));
      const pay_type = row.getValue("pay_type");

      if (isNaN(pay_rate)) return "Invalid";

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(pay_rate);

      return (
        <div className="text-left font-medium">
          {formatted}/{pay_type === "salary" ? "year" : "hour"}
        </div>
      );
    },
  },
  {
    accessorKey: "hire_date",
    header: "Hire Date",
  },
  {
    accessorKey: "birthday",
    header: "Birthday",
  },
  // {
  //   accessorKey: "promotion_date",
  //   header: "Promotion Date",
  // },
  // {
  //   accessorKey: "rank",
  //   header: "Employee Number",
  // },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => null, // This will be replaced in page.tsx
  },
];
