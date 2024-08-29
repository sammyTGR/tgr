import { FC, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SickTimeReport {
  employee_id: number;
  name: string;
  available_sick_time: number;
  used_sick_time: number;
  used_dates: string[];
}

interface SickTimeTableProps {
  data: SickTimeReport[];
  isAllExpanded: boolean;
  onExpandCollapseAll: () => void;
}

export const SickTimeTable: FC<SickTimeTableProps> = ({
  data,
  isAllExpanded,
  onExpandCollapseAll,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isAllExpanded) {
      const expandAll = data.reduce((acc, row) => {
        acc[row.employee_id] = true;
        return acc;
      }, {} as Record<number, boolean>);
      setExpandedRows(expandAll);
    } else {
      setExpandedRows({});
    }
  }, [isAllExpanded, data]);

  const toggleExpand = (employee_id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [employee_id]: !prev[employee_id],
    }));
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Available Sick Time</TableHead>
            <TableHead>Used Sick Time</TableHead>
            <TableHead>Used Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <>
              <TableRow
                key={row.employee_id}
                className="cursor-pointer"
                onClick={() => toggleExpand(row.employee_id)}
              >
                <TableCell>
                  {expandedRows[row.employee_id] ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  {row.available_sick_time.toFixed(2)} hours
                </TableCell>
                <TableCell>{row.used_sick_time.toFixed(2)} hours</TableCell>
                <TableCell>
                  {row.used_dates.length} day
                  {row.used_dates.length !== 1 ? "s" : ""}
                </TableCell>
              </TableRow>
              {expandedRows[row.employee_id] &&
                row.used_dates.map((date, index) => (
                  <TableRow key={`${row.employee_id}-${date}`}>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      {(row.used_sick_time / row.used_dates.length).toFixed(2)}{" "}
                      hours
                    </TableCell>
                    <TableCell>
                      {format(new Date(date), "MM/dd/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
