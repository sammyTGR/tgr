"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingIndicator from "@/components/LoadingIndicator";
import { format } from "date-fns";

interface TimeTrackingData {
  id: number;
  employee_id: string;
  name: string;
  date: string;
  work_date_time: string;
  day_total: number;
  over_time: number;
  type: string;
  location: string;
}

interface TimeTrackingDataTableProps {
  data: TimeTrackingData[];
  isLoading: boolean;
}

export function TimeTrackingDataTable({
  data,
  isLoading,
}: TimeTrackingDataTableProps) {
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Work Date/Time</TableHead>
            <TableHead>Day Total</TableHead>
            <TableHead>Over Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{format(new Date(row.date), "MM/dd/yyyy")}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.employee_id}</TableCell>
              <TableCell>{row.work_date_time}</TableCell>
              <TableCell>{row.day_total}</TableCell>
              <TableCell>{row.over_time}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
