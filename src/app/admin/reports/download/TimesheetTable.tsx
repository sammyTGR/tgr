import { FC, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { CustomCalendarMulti } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabase/client";

interface TimesheetReport {
  id: number;
  employee_id: number;
  name: string | null;
  event_date: string | null;
  start_time: string;
  end_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  total_hours: string | null;
}

interface TimesheetTableProps {
  data: TimesheetReport[];
}

export const TimesheetTable: FC<TimesheetTableProps> = ({ data }) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [employees, setEmployees] = useState<
    { employee_id: number; name: string }[]
  >([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );

  // Fetch employee list
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name");
      if (error) {
        console.error("Error fetching employees:", error);
      } else {
        setEmployees(data || []);
      }
    };
    fetchEmployees();
  }, []);

  // Filter data based on selected dates and employee
  const filteredData = data.filter((row) => {
    const rowDate = new Date(row.event_date || "");

    // Normalize the dates to ensure they all represent the same time (e.g., midnight)
    const selectedDatesSet = new Set(
      selectedDates.map((date) => new Date(date.setHours(0, 0, 0, 0)).getTime())
    );
    const normalizedRowDate = new Date(rowDate.setHours(0, 0, 0, 0)).getTime();

    const isInRange = selectedDates.length
      ? selectedDatesSet.has(normalizedRowDate)
      : true;

    const isSelectedEmployee = selectedEmployeeId
      ? row.employee_id === selectedEmployeeId
      : true;

    return isInRange && isSelectedEmployee;
  });

  // Group and sort data by employee and event_date
  const groupedData = filteredData.reduce((acc, row) => {
    if (!acc[row.employee_id]) {
      acc[row.employee_id] = [];
    }
    acc[row.employee_id].push(row);
    return acc;
  }, {} as Record<number, TimesheetReport[]>);

  Object.keys(groupedData).forEach((employee_id) => {
    groupedData[parseInt(employee_id)].sort((a, b) => {
      const dateA = a.event_date ? new Date(a.event_date) : new Date();
      const dateB = b.event_date ? new Date(b.event_date) : new Date();
      return dateA.getTime() - dateB.getTime();
    });
  });

  const toggleExpand = (employee_id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [employee_id]: !prev[employee_id],
    }));
  };

  return (
    <div>
      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card className="mb-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Select Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full text-center">
                  {selectedDates.length > 0 ? (
                    <>
                      {format(
                        new Date(
                          Math.min(
                            ...selectedDates.map((date) => date.getTime())
                          )
                        ),
                        "M/dd"
                      )}{" "}
                      -{" "}
                      {format(
                        new Date(
                          Math.max(
                            ...selectedDates.map((date) => date.getTime())
                          )
                        ),
                        "M/dd"
                      )}
                    </>
                  ) : (
                    <span>Pick dates</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CustomCalendarMulti
                  selectedDates={selectedDates}
                  onDatesChange={setSelectedDates}
                  disabledDays={() => false}
                />
              </PopoverContent>
              <Button variant="linkHover1" onClick={() => setSelectedDates([])}>
                Clear Dates
              </Button>
            </Popover>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Select Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedEmployeeId ? selectedEmployeeId.toString() : ""}
              onValueChange={(value) => setSelectedEmployeeId(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem
                    key={employee.employee_id}
                    value={employee.employee_id.toString()}
                  >
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="linkHover1"
              onClick={() => setSelectedEmployeeId(null)}
              className="mt-2"
            >
              Clear
            </Button>
          </CardContent>
        </Card>
      </div>

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
          {Object.keys(groupedData).map((employee_id) => {
            const employeeRows = groupedData[parseInt(employee_id)];
            const firstRow = employeeRows[0];
            const isExpanded = expandedRows[parseInt(employee_id)];

            return (
              <>
                <TableRow
                  key={firstRow.id}
                  onClick={() => toggleExpand(parseInt(employee_id))}
                  className="cursor-pointer"
                >
                  <TableCell>{firstRow.name}</TableCell>
                  <TableCell>
                    {firstRow.event_date
                      ? format(new Date(firstRow.event_date), "M-dd-yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {firstRow.start_time
                      ? format(
                          parse(firstRow.start_time, "HH:mm:ss", new Date()),
                          "hh:mm a"
                        )
                      : ""}
                  </TableCell>
                  <TableCell>
                    {firstRow.end_time
                      ? format(
                          parse(firstRow.end_time, "HH:mm:ss", new Date()),
                          "hh:mm a"
                        )
                      : ""}
                  </TableCell>
                  <TableCell>
                    {firstRow.start_time && firstRow.end_time
                      ? (() => {
                          const start = new Date(
                            `1970-01-01T${firstRow.start_time}Z`
                          ).getTime();
                          const end = new Date(
                            `1970-01-01T${firstRow.end_time}Z`
                          ).getTime();

                          let lunchDuration = 0;
                          if (firstRow.lunch_start && firstRow.lunch_end) {
                            const lunchStart = new Date(
                              `1970-01-01T${firstRow.lunch_start}Z`
                            ).getTime();
                            const lunchEnd = new Date(
                              `1970-01-01T${firstRow.lunch_end}Z`
                            ).getTime();
                            lunchDuration = lunchEnd - lunchStart;
                          }

                          const totalDuration = end - start - lunchDuration;
                          const totalHours = totalDuration / (1000 * 60 * 60);
                          return `${totalHours.toFixed(2)} hours`;
                        })()
                      : ""}
                  </TableCell>
                </TableRow>
                {isExpanded &&
                  employeeRows.slice(1).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        {row.event_date
                          ? format(new Date(row.event_date), "M-dd-yyyy")
                          : "N/A"}
                      </TableCell>
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
                          ? format(
                              parse(row.end_time, "HH:mm:ss", new Date()),
                              "hh:mm a"
                            )
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

                              const totalDuration = end - start - lunchDuration;
                              const totalHours =
                                totalDuration / (1000 * 60 * 60);
                              return `${totalHours.toFixed(2)} hours`;
                            })()
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
