import React, { FC, useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { ChevronDown, ChevronRight } from "lucide-react";

const TIME_ZONE = "America/Los_Angeles";

interface VacationTimeReport {
  employee_id: number;
  name: string;
  available_vacation_time: number;
  used_vacation_time: number;
  used_dates: string[];
  hours_per_date: number[];
}

interface VacationTimeTableProps {
  data: VacationTimeReport[];
  isAllExpanded: boolean;
  onExpandCollapseAll: () => void;
}

export const VacationTimeTable: FC<VacationTimeTableProps> = ({
  data,
  isAllExpanded,
  onExpandCollapseAll,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const filteredData = useMemo(
    () => data.filter((row) => row.used_vacation_time > 0),
    [data]
  );

  useEffect(() => {
    if (isAllExpanded) {
      const expandAll = filteredData.reduce((acc, row) => {
        acc[row.employee_id] = true;
        return acc;
      }, {} as Record<number, boolean>);
      setExpandedRows(expandAll);
    } else {
      setExpandedRows({});
    }
  }, [isAllExpanded, filteredData]);

  const toggleExpand = (employee_id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [employee_id]: !prev[employee_id],
    }));
  };

  const formatDate = (dateString: string) => {
    // Parse the date and add one day to compensate for UTC conversion
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);

    // Convert to zoned time and format
    const zonedDate = toZonedTime(date, TIME_ZONE);
    return formatInTimeZone(zonedDate, TIME_ZONE, "MM/dd/yyyy");
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Available Vacation Time</TableHead>
            <TableHead>Used Vacation Time</TableHead>
            <TableHead>Used Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((row) => (
            <React.Fragment key={row.employee_id}>
              <TableRow
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
                  {row.available_vacation_time.toFixed(2)} hours
                </TableCell>
                <TableCell>{row.used_vacation_time.toFixed(2)} hours</TableCell>
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
                      {row.hours_per_date[index].toFixed(2)} hours
                    </TableCell>
                    <TableCell>{formatDate(date)}</TableCell>
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
