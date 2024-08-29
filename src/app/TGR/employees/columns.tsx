"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee } from "./types";
import { DataTableColumnHeader } from "./data-table-column-header";
import { EmployeeTableRowActions } from "./employee-table-row-actions";

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
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
      const pay_rate = row.getValue("pay_rate");
      //   console.log("Full row data:", row.original);
      //   console.log("Pay rate value:", pay_rate, typeof pay_rate);

      if (pay_rate === null || pay_rate === undefined) return "";

      const numericPayRate = parseFloat(pay_rate as string);
      if (isNaN(numericPayRate)) return "Invalid";

      if (numericPayRate >= 1000) {
        // Assume it's a salary
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numericPayRate);
        return <div className="text-left font-medium">{formatted}/year</div>;
      } else {
        // Assume it's hourly
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numericPayRate);
        return <div className="text-left font-medium">{formatted}/hour</div>;
      }
    },
  },
  {
    accessorKey: "rank",
    header: "Rank",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => null, // This will be replaced in page.tsx
  },
];