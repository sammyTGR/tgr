"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { ScheduleColumnHeader } from "./schedule-column-header";

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<TData, TValue> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export type ScheduleData = {
  id: number;
  employee_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

export const columns: ColumnDef<ScheduleData>[] = [
  {
    accessorKey: "employee_id",
    header: ({ column }) => (
      <ScheduleColumnHeader column={column} title="Employee ID" />
    ),
    meta: {
      style: { width: "150px" },
    },
  },
  {
    accessorKey: "day_of_week",
    header: "Day of Week",
    meta: {
      style: { width: "100px" },
    },
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    meta: {
      style: { width: "100px" },
    },
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    meta: {
      style: { width: "100px" },
    },
  },
];
