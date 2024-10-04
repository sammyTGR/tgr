import { FC, useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isSameDay, parse } from "date-fns";
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
import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { TimesheetRowActions } from "./timesheet-row-actions";
import { ReconcileDialogForm } from "./reconcile-popoverform";
import { addDays, startOfWeek, endOfWeek } from "date-fns";

export interface TimesheetReport {
  id: number;
  employee_id: number;
  name: string;
  event_date: string | null;
  start_time: string;
  end_time: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  stored_total_hours: string | null;
  calculated_total_hours: string | null;
  scheduled_hours: number;
  sick_time_usage: number;
  vacation_time_usage: number;
  regular_time: number;
  overtime: number;
  available_sick_time: number;
  hoursToReconcile?: number;
  total_hours_with_sick?: number;
}

interface TimesheetTableProps {
  data: TimesheetReport[];
  onDataUpdate: (
    updater: (prevData: TimesheetReport[]) => TimesheetReport[]
  ) => void;
  onFilteredDataUpdate: (filteredData: TimesheetReport[]) => void;
  selectedPayPeriod: string | null;
}

export const TimesheetTable: FC<TimesheetTableProps> = ({
  data,
  onDataUpdate,
  onFilteredDataUpdate,
  selectedPayPeriod: initialSelectedPayPeriod,
}) => {
  const [localSelectedPayPeriod, setLocalSelectedPayPeriod] = useState<
    string | null
  >(initialSelectedPayPeriod);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<number | null>(null);
  const [sickTimeData, setSickTimeData] = useState<
    { employee_id: number; available_sick_time: number }[]
  >([]);
  const [employees, setEmployees] = useState<
    { employee_id: number; name: string }[]
  >([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string | null>(
    null
  );

  // Fetch employee list
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name");
      if (error) {
        //console.("Error fetching employees:", error);
      } else {
        setEmployees(data || []);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch sick time data
  useEffect(() => {
    const fetchSickTimeData = async () => {
      const { data, error } = await supabase.rpc("get_all_sick_time_data");
      if (error) {
        //console.("Error fetching sick time data:", error);
      } else {
        setSickTimeData(data);
      }
    };
    fetchSickTimeData();
  }, []);

  // Function to generate pay periods
  const generatePayPeriods = () => {
    const periods = [];
    const startDate = new Date(2023, 8, 24); // September 24, 2023 (a Sunday)
    const today = new Date();
    let currentDate = startDate;

    while (currentDate <= today) {
      const periodStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 represents Sunday
      const periodEnd = endOfWeek(addDays(periodStart, 13), {
        weekStartsOn: 0,
      });
      periods.push({
        label: `${format(periodStart, "MMM d")} - ${format(
          periodEnd,
          "MMM d, yyyy"
        )}`,
        start: periodStart,
        end: periodEnd,
      });
      currentDate = addDays(periodEnd, 1);
    }

    return periods.reverse(); // Most recent first
  };

  const payPeriods = useMemo(() => generatePayPeriods(), []);

  // Function to filter data based on selected pay period
  const filterByPayPeriod = useCallback(
    (data: TimesheetReport[]) => {
      if (!localSelectedPayPeriod) return data;

      const selectedPeriod = payPeriods.find(
        (p) => p.label === localSelectedPayPeriod
      );
      if (!selectedPeriod) return data;

      return data.filter((row) => {
        if (!row.event_date) return false;
        const rowDate = new Date(row.event_date);
        return rowDate >= selectedPeriod.start && rowDate <= selectedPeriod.end;
      });
    },
    [localSelectedPayPeriod, payPeriods]
  );

  const handleReconcileHours = async (
    row: TimesheetReport,
    hoursToReconcile: number
  ) => {
    console.log("Reconciling hours:", { row, hoursToReconcile });
    try {
      const response = await fetch("/api/reconcile-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: row.employee_id,
          eventDate: row.event_date,
          hoursToReconcile: hoursToReconcile,
          scheduledHours: row.scheduled_hours,
          calculatedTotalHours: row.calculated_total_hours,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reconcile hours");
      }

      const updatedRow = await response.json();
      console.log("Updated row:", updatedRow);

      // Update the local state immediately
      onDataUpdate((prevData) =>
        prevData.map((item) =>
          item.id === row.id
            ? {
                ...item,
                sick_time_usage: hoursToReconcile,
                available_sick_time: updatedRow.available_sick_time,
              }
            : item
        )
      );

      // Trigger a refresh of the data
      setLatestUpdate(Date.now());

      toast.success("Hours reconciled successfully");
    } catch (error: any) {
      //console.("Error reconciling hours:", error);
      toast.error(error.message || "Failed to reconcile hours");
    }
  };

  useEffect(() => {
    if (latestUpdate) {
      const refreshData = async () => {
        const { data, error } = await supabase.rpc("get_timesheet_data");
        if (error) {
          // console.error(
          //   "Error fetching updated timesheet data:",
          //   error.message
          // );
          toast.error("Failed to refresh data");
        } else {
          onDataUpdate(() => data as TimesheetReport[]);
          console.log("Data refreshed successfully");
        }
      };

      refreshData();
    }
  }, [latestUpdate]);

  const handlePayPeriodChange = (value: string | null) => {
    setLocalSelectedPayPeriod(value);
    const newFilteredData = filterData(
      data,
      value,
      selectedDates,
      selectedEmployeeId
    );
    onFilteredDataUpdate(newFilteredData);
  };

  // Add this function to centralize filtering logic
  const filterData = (
    data: TimesheetReport[],
    payPeriod: string | null,
    dates: Date[],
    employeeId: number | null
  ) => {
    return data.filter((row) => {
      const rowDate = new Date(row.event_date || "");

      // Pay period filter
      const isPeriodMatch = payPeriod
        ? isDateInPayPeriod(rowDate, payPeriod, payPeriods)
        : true;

      // Date range filter
      const isInDateRange =
        dates.length === 0 || dates.some((date) => isSameDay(date, rowDate));

      // Employee filter
      const isEmployeeMatch = !employeeId || row.employee_id === employeeId;

      return isPeriodMatch && isInDateRange && isEmployeeMatch;
    });
  };

  // Helper function to check if a date is within a pay period
  const isDateInPayPeriod = (
    date: Date,
    payPeriodLabel: string,
    periods: any[]
  ) => {
    const period = periods.find((p) => p.label === payPeriodLabel);
    return period ? date >= period.start && date <= period.end : false;
  };

  // Filter data based on selected dates and employee
  const filteredData = useMemo(() => {
    return filterData(
      data,
      localSelectedPayPeriod,
      selectedDates,
      selectedEmployeeId
    );
  }, [data, localSelectedPayPeriod, selectedDates, selectedEmployeeId]);

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
      return dateB.getTime() - dateA.getTime();
    });
  });

  const toggleExpand = (employee_id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [employee_id]: !prev[employee_id],
    }));
  };

  const handleExpandCollapseAll = () => {
    const allEmployeeIds = Object.keys(groupedData).map(Number);
    if (isAllExpanded) {
      setExpandedRows({});
    } else {
      const expandAll = allEmployeeIds.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<number, boolean>);
      setExpandedRows(expandAll);
    }
    setIsAllExpanded(!isAllExpanded);
  };

  return (
    <div>
      <div className="grid p-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
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
                  onDatesChange={(dates) => {
                    setSelectedDates(dates);
                    const newFilteredData = filteredData.filter((row) => {
                      // Apply date range filter
                      // This is a simplified version, you may need to adjust based on your needs
                      return true;
                    });
                    onFilteredDataUpdate(newFilteredData);
                  }}
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
              onValueChange={(value) => {
                const newEmployeeId = Number(value);
                setSelectedEmployeeId(newEmployeeId);
                const newFilteredData = filteredData.filter((row) =>
                  newEmployeeId ? row.employee_id === newEmployeeId : true
                );
                onFilteredDataUpdate(newFilteredData);
              }}
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

        <Card className="mb-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Select Pay Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={localSelectedPayPeriod || ""}
              onValueChange={handlePayPeriodChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Pay Period" />
              </SelectTrigger>
              <SelectContent>
                {payPeriods.map((period) => (
                  <SelectItem key={period.label} value={period.label}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="linkHover1"
              onClick={() => handlePayPeriodChange(null)}
              className="mt-2"
            >
              Clear
            </Button>
          </CardContent>
        </Card>

        <div className="mr-2 ml-auto">
          <Button variant="linkHover1" onClick={handleExpandCollapseAll}>
            {isAllExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            {/* <TableHead>Lunch Start</TableHead>
            <TableHead>Lunch End</TableHead> */}
            <TableHead>Total Hours Logged</TableHead>
            <TableHead>Scheduled Hours</TableHead>
            <TableHead>Sick Time Usage</TableHead>
            <TableHead>Vacation Time Usage</TableHead>
            <TableHead>Regular Time</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Available Sick Time</TableHead>
            <TableHead>Total Hours</TableHead> {/* New column */}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedData).map(([employee_id, employeeRows]) => (
            <React.Fragment key={`employee-${employee_id}`}>
              <TableRow
                onClick={() => toggleExpand(parseInt(employee_id))}
                className="cursor-pointer"
              >
                <TableCell>
                  {expandedRows[parseInt(employee_id)] ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </TableCell>
                <TableCell>{employeeRows[0].name}</TableCell>
                <TableCell colSpan={11}></TableCell>
              </TableRow>
              {expandedRows[parseInt(employee_id)] &&
                employeeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell></TableCell>
                    <TableCell>
                      {row.event_date
                        ? format(new Date(row.event_date), "M-dd-yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{row.start_time}</TableCell>
                    <TableCell>{row.end_time}</TableCell>
                    <TableCell>{row.calculated_total_hours || "N/A"}</TableCell>
                    <TableCell>{row.scheduled_hours?.toFixed(2)}</TableCell>
                    <TableCell>
                      {row.sick_time_usage?.toFixed(2) || "N/A"}
                    </TableCell>
                    <TableCell>
                      {row.vacation_time_usage?.toFixed(2) || "N/A"}
                    </TableCell>
                    <TableCell>{row.regular_time.toFixed(2)}</TableCell>
                    <TableCell>{row.overtime.toFixed(2)}</TableCell>
                    <TableCell>
                      {row.available_sick_time?.toFixed(2) || "N/A"}
                    </TableCell>
                    <TableCell>
                      {row.total_hours_with_sick?.toFixed(2) || "N/A"}
                    </TableCell>
                    <TableCell>
                      <TimesheetRowActions
                        row={row}
                        onReconcile={(row, hours) =>
                          handleReconcileHours(row, hours)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
