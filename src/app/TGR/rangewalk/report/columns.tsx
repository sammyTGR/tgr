"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { UUID } from "crypto";

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export type RangeWalkData = {
  id: UUID;
  user_uuid: UUID;
  user_name: string;
  date_of_walk: string;
  lanes: string;
  lanes_with_problems: string;
  description: string;
  created_at: string;
  role: string;
};

export const columns: ColumnDef<RangeWalkData>[] = [
  {
    accessorKey: "user_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User Name" />
    ),
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "date_of_walk",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date of Walk" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "lanes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lanes" />
    ),
    meta: {
      style: { width: "200px" },
    },
  },
  {
    accessorKey: "lanes_with_problems",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lanes with Problems" />
    ),
    meta: {
      style: { width: "300px" },
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    meta: {
      style: { width: "400px" },
    },
  },
  //   {
  //     accessorKey: "created_at",
  //     header: ({ column }) => (
  //       <DataTableColumnHeader column={column} title="Created At" />
  //     ),
  //     meta: {
  //       style: { width: "150px" },
  //     },
  //   },
  //   {
  //     accessorKey: "role",
  //     header: ({ column }) => (
  //       <DataTableColumnHeader column={column} title="Role" />
  //     ),
  //     meta: {
  //       style: { width: "150px" },
  //     },
  //   },
];
