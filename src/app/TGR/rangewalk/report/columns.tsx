"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { UUID } from "crypto";
import { DataTableRowActions } from "./data-table-row-actions";

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export type RangeWalkData = {
  id: number;
  user_uuid: string;
  user_name: string;
  date_of_walk: string; // Assuming it's a string in ISO format from the database
  lanes: string;
  lanes_with_problems: string;
  description: string;
  status?: string | null;
  repair_notes?: string;
  repair_notes_user?: string;
};

export const columns: ColumnDef<RangeWalkData>[] = [
  {
    accessorKey: "user_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted By" />
    ),
    meta: {
      style: { width: "125px" },
    },
  },
  {
    accessorKey: "date_of_walk",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date of Walk" />
    ),
    sortingFn: (a, b) =>
      new Date(a.original.date_of_walk).getTime() -
      new Date(b.original.date_of_walk).getTime(),
    meta: {
      style: { width: "125px" },
    },
  },
  // {
  //   accessorKey: "lanes",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Checked Lanes" />
  //   ),
  //   meta: {
  //     style: { width: "80px" },
  //   },
  // },
  {
    accessorKey: "lanes_with_problems",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lanes with Problems" />
    ),
    meta: {
      style: { width: "250px" },
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details Of Problems" />
    ),
    meta: {
      style: { width: "450px" },
    },
  },
  // {
  //   accessorKey: "status",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Status" />
  //   ),
  //   meta: {
  //     style: { width: "150px" },
  //   },
  // },
  {
    accessorKey: "repair_notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Repair Notes" />
    ),
    meta: {
      style: { width: "350px" },
    },
  },
  {
    accessorKey: "repair_notes_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Repaired By" />
    ),
    meta: {
      style: { width: "75px" },
    },
  },
];
