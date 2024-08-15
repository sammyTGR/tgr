import { FC } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SickTimeTableProps {
  data: SickTimeReport[];
}
interface SickTimeReport {
  employee_id: number;
  name: string; // Change this from employee_name to name
  available_sick_time: number;
  used_sick_time: number;
  used_dates: string[];
}

export const SickTimeTable: FC<SickTimeTableProps> = ({ data }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          <TableHead>Available Sick Time</TableHead>
          <TableHead>Used Sick Time</TableHead>
          <TableHead>Used Dates</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.employee_id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.available_sick_time} hours</TableCell>
            <TableCell>{row.used_sick_time} hours</TableCell>
            <TableCell>
              {row.used_dates?.length > 0
                ? row.used_dates
                    .map((date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "2-digit",
                        year: "numeric",
                      })
                    )
                    .join(", ")
                : "No dates available"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
