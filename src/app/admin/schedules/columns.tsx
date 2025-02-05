"use client";
import { ColumnDef as BaseColumnDef } from "@tanstack/react-table";
import { ScheduleColumnHeader } from "./schedule-column-header";
import { parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<
  TData,
  TValue
> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export type ScheduleData = {
  id: number;
  employee_id: number;
  employee_name: string | null;
  day_of_week: string;
  start_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  end_time: string;
  total_hours: string | null;
  event_date: string | null;
};

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeZone = "America/Los_Angeles";

export const columns: ColumnDef<ScheduleData>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee Name",
    enableGrouping: true,
  },
  {
    accessorKey: "event_date",
    header: "Date",
    sortDescFirst: true,
  },
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
    cell: ({ row }) => {
      const day = row.getValue("day_of_week");
      // console.log("Row data:", row.original);
      // console.log("Day of week:", day);
      return day;
    },
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    cell: ({ row }) => {
      const startTime = row.getValue("start_time");
      if (typeof startTime === "string") {
        try {
          const date = parseISO(`2000-01-01T${startTime}`);
          const zonedDate = toZonedTime(date, timeZone);
          return formatInTimeZone(zonedDate, timeZone, "h:mm a");
        } catch (error) {
          console.error("Error formatting start time:", error);
          return startTime; // Return original value if parsing fails
        }
      }
      return startTime;
    },
    meta: {
      style: { width: "100px" },
    },
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    cell: ({ row }) => {
      const endTime = row.getValue("end_time");
      if (typeof endTime === "string") {
        try {
          const date = parseISO(`2000-01-01T${endTime}`);
          const zonedDate = toZonedTime(date, timeZone);
          return formatInTimeZone(zonedDate, timeZone, "h:mm a");
        } catch (error) {
          console.error("Error formatting end time:", error);
          return endTime; // Return original value if parsing fails
        }
      }
      return endTime;
    },
    meta: {
      style: { width: "100px" },
    },
  },
  {
    accessorKey: "total_hours",
    header: "Total Hours",
    cell: ({ row }) => {
      const totalHours = row.getValue("total_hours");
      if (typeof totalHours === "string") {
        const hours = parseFloat(totalHours);
        return hours.toFixed(2);
      }
      return totalHours;
    },
    meta: {
      style: { width: "100px" },
    },
  },
  {
    accessorKey: "overtime",
    header: "Overtime",
    cell: ({ row }) => {
      // This will be handled in the grouped row view
      // Individual rows don't show overtime
      return "";
    },
    meta: {
      style: { width: "100px" },
    },
  },
];
