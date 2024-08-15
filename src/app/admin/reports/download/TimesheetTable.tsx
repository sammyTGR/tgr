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
              {row.total_hours ? `${row.total_hours} hours` : ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
