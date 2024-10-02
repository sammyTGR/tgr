"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Employee } from "./types";
import { DataTableColumnHeader } from "./data-table-column-header";
import { format, toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

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
    accessorKey: "extension",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Extension" />
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
    ),
  },
  // {
  //   accessorKey: "position",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Position" />
  //   ),
  // },
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
  // {
  //   accessorKey: "lanid",
  //   header: "LANID",
  // },
  // {
  //   accessorKey: "pay_type",
  //   header: "Pay Type",
  // },
  {
    accessorKey: "pay_rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pay Rate" />
    ),
    cell: ({ row }) => {
      const employee = row.original;
      if (employee.pay_rate === null) return "N/A";
      const formattedRate = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(employee.pay_rate);
      return `${formattedRate}${
        employee.pay_type === "salary" ? "/year" : "/hour"
      }`;
    },
  },
  {
    accessorKey: "hire_date",
    header: "Hire Date",
    cell: ({ row }) => {
      const date = row.getValue("hire_date");
      if (!date || typeof date !== "string") return null;
      try {
        const zonedDate = toZonedTime(new Date(date), timeZone);
        return format(zonedDate, "M-dd-yy", { timeZone });
      } catch {
        return "Invalid Date";
      }
    },
  },
  {
    accessorKey: "birthday",
    header: "Birthday",
    cell: ({ row }) => {
      const date = row.getValue("birthday");
      if (!date || typeof date !== "string") return null;
      try {
        const zonedDate = toZonedTime(new Date(date), timeZone);
        return format(zonedDate, "M-dd-yy", { timeZone });
      } catch {
        return "Invalid Date";
      }
    },
  },
  {
    accessorKey: "promotion_date",
    header: "Promotion Date",
    cell: ({ row }) => {
      const date = row.getValue("promotion_date");
      if (!date || typeof date !== "string") return null;
      try {
        const zonedDate = toZonedTime(new Date(date), timeZone);
        return format(zonedDate, "M-dd-yy", { timeZone });
      } catch {
        return "Invalid Date";
      }
    },
  },
  // {
  //   accessorKey: "rank",
  //   header: "Employee Number",
  // },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  // },
  {
    accessorKey: "term_date",
    header: "Termination Date",
    cell: ({ row }) => {
      const date = row.getValue("term_date");
      if (!date || typeof date !== "string") return null;
      try {
        const zonedDate = toZonedTime(new Date(date), timeZone);
        return format(zonedDate, "M-dd-yy", { timeZone });
      } catch {
        return "Invalid Date";
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => null, // This will be replaced in page.tsx
  },
];
