import { FC } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse, formatDuration, intervalToDuration } from "date-fns"; // Import date-fns for formatting

interface TimesheetReport {
  id: number;
  employee_id: number;
  name: string | null;
  event_date: string | null;
  start_time: string;
  end_time: string;
  lunch_start: string | null; // Add lunch_start
  lunch_end: string | null; // Add lunch_end
  total_hours: string | null;
}

interface TimesheetTableProps {
  data: TimesheetReport[];
}

export const TimesheetTable: FC<TimesheetTableProps> = ({ data }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Total Hours</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.event_date || "N/A"}</TableCell>
            <TableCell>
              {row.start_time
                ? format(
                    parse(row.start_time, "HH:mm:ss", new Date()),
                    "hh:mm a"
                  )
                : ""}
            </TableCell>
            <TableCell>
              {row.end_time
                ? format(parse(row.end_time, "HH:mm:ss", new Date()), "hh:mm a")
                : ""}
            </TableCell>
            <TableCell>
              {row.start_time && row.end_time
                ? (() => {
                    const start = new Date(
                      `1970-01-01T${row.start_time}Z`
                    ).getTime();
                    const end = new Date(
                      `1970-01-01T${row.end_time}Z`
                    ).getTime();

                    // Calculate lunch duration only if both lunch_start and lunch_end are provided
                    let lunchDuration = 0;
                    if (row.lunch_start && row.lunch_end) {
                      const lunchStart = new Date(
                        `1970-01-01T${row.lunch_start}Z`
                      ).getTime();
                      const lunchEnd = new Date(
                        `1970-01-01T${row.lunch_end}Z`
                      ).getTime();
                      lunchDuration = lunchEnd - lunchStart;
                    }

                    // Subtract lunch duration from work duration
                    const totalDuration = end - start - lunchDuration;

                    // Convert to hours and format
                    const totalHours = totalDuration / (1000 * 60 * 60);
                    return `${totalHours.toFixed(2)} hours`;
                  })()
                : ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
