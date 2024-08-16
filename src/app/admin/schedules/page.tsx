"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { SchedulePagination } from "./schedule-pagination";
import { PopoverForm } from "./PopoverForm";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { DataTable } from "./DataTable";
import { TimesheetDataTable } from "./TimesheetDataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toZonedTime, format as formatTZ } from "date-fns-tz";

interface ScheduleData {
  id: number;
  employee_id: number;
  employee_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  user_uuid: string;
}

interface TimesheetData {
  id: number;
  employee_id: number;
  start_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  end_time: string | null;
  total_hours: string | null;
  created_at: string | null;
  employee_name: string | null;
  event_date: string | null;
}

const timeZone = "America/Los_Angeles"; // Define the timezone

const scheduleColumns: ColumnDef<ScheduleData>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "day_of_week",
    header: "Day of Week",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    cell: (info) => info.getValue(),
  },
];

const timesheetColumns: ColumnDef<TimesheetData>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "event_date",
    header: "Date",
    cell: (info) =>
      info.getValue()
        ? new Date(info.getValue() as string).toLocaleDateString()
        : "N/A",
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    cell: (info) => info.getValue(), // Ensure this properly accesses the formatted time
  },
  {
    accessorKey: "lunch_start",
    header: "Lunch Start",
    cell: (info) => info.getValue(), // Ensure this properly accesses the formatted time
  },
  {
    accessorKey: "lunch_end",
    header: "Lunch End",
    cell: (info) => info.getValue(), // Ensure this properly accesses the formatted time
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    cell: (info) => info.getValue(), // Ensure this properly accesses the formatted time
  },
  {
    accessorKey: "total_hours",
    header: "Total Hours",
    cell: (info) => info.getValue() || "N/A",
  },
];

const ManageSchedules = () => {
  const { user } = useRole();
  const [referenceSchedules, setReferenceSchedules] = useState<ScheduleData[]>(
    []
  );
  const [employees, setEmployees] = useState<
    { employee_id: number; name: string }[]
  >([]);
  const [timesheets, setTimesheets] = useState<TimesheetData[]>([]);
  useEffect(() => {
    fetchReferenceSchedules();
    fetchEmployees();
    fetchTimesheets();
  }, []);

  const fetchReferenceSchedules = async () => {
    const { data: schedules, error: schedulesError } = await supabase
      .from("reference_schedules")
      .select("*");
    if (schedulesError) {
      console.error("Error fetching reference schedules:", schedulesError);
      return;
    }

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("employee_id, name");
    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      return;
    }

    const schedulesWithNames = schedules.map((schedule) => {
      const employee = employees.find(
        (emp) => emp.employee_id === schedule.employee_id
      );

      const startTimeValid =
        schedule.start_time &&
        !isNaN(Date.parse(`1970-01-01T${schedule.start_time}`));
      const endTimeValid =
        schedule.end_time &&
        !isNaN(Date.parse(`1970-01-01T${schedule.end_time}`));

      return {
        ...schedule,
        employee_name: employee ? employee.name : "Unknown",
        start_time: startTimeValid
          ? formatTZ(
              toZonedTime(
                new Date(`1970-01-01T${schedule.start_time}`),
                timeZone
              ),
              "hh:mma",
              { timeZone }
            )
          : "",
        end_time: endTimeValid
          ? formatTZ(
              toZonedTime(
                new Date(`1970-01-01T${schedule.end_time}`),
                timeZone
              ),
              "hh:mma",
              { timeZone }
            )
          : "",
      };
    });

    setReferenceSchedules(schedulesWithNames);
  };

  const fetchEmployees = async () => {
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("employee_id, name");
    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      return;
    }
    setEmployees(employees);
  };

  const fetchTimesheets = async () => {
    const { data: timesheets, error: timesheetsError } = await supabase
      .from("employee_clock_events")
      .select("*");

    if (timesheetsError) {
      console.error("Error fetching timesheets:", timesheetsError);
      return;
    }

    const formattedTimesheets = timesheets.map((timesheet) => ({
      ...timesheet,
      start_time: timesheet.start_time
        ? formatTZ(
            toZonedTime(
              new Date(`1970-01-01T${timesheet.start_time}`),
              timeZone
            ),
            "hh:mm a",
            { timeZone }
          )
        : "N/A",
      lunch_start: timesheet.lunch_start
        ? formatTZ(
            toZonedTime(
              new Date(`1970-01-01T${timesheet.lunch_start}`),
              timeZone
            ),
            "hh:mm a",
            { timeZone }
          )
        : "N/A",
      lunch_end: timesheet.lunch_end
        ? formatTZ(
            toZonedTime(
              new Date(`1970-01-01T${timesheet.lunch_end}`),
              timeZone
            ),
            "hh:mm a",
            { timeZone }
          )
        : "N/A",
      end_time: timesheet.end_time
        ? formatTZ(
            toZonedTime(new Date(`1970-01-01T${timesheet.end_time}`), timeZone),
            "hh:mm a",
            { timeZone }
          )
        : "N/A",
    }));

    // console.log("Formatted Timesheet Data:", formattedTimesheets); // Ensure this logs the correct data

    setTimesheets(formattedTimesheets);
  };

  const handleEditTimesheet = async (
    id: number,
    lunch_start: string | null,
    lunch_end: string | null
  ) => {
    const { error } = await supabase
      .from("employee_clock_events")
      .update({ lunch_start, lunch_end })
      .eq("id", id);

    if (error) {
      console.error("Error updating timesheet:", error);
    } else {
      // console.log("Timesheet updated successfully.");
      fetchTimesheets();
    }
  };

  const handleGenerateSingleSchedule = async (
    employeeName: string,
    weeks?: string
  ) => {
    const employee = employees.find((emp) => emp.name === employeeName);
    if (!employee) {
      console.error("Employee not found:", employeeName);
      return;
    }

    const { error } = await supabase.rpc(
      "generate_schedules_for_employees_by_name",
      {
        employee_name: employeeName,
        weeks: parseInt(weeks || "0", 10),
      }
    );

    // Add the name field to the schedule
    if (!error) {
      const { error: updateError } = await supabase
        .from("schedules")
        .update({ name: employee.name })
        .eq("employee_id", employee.employee_id);
      if (updateError) {
        console.error(
          "Error updating employee name in schedules:",
          updateError
        );
      } else {
        // console.log("Schedules generated successfully.");
        fetchReferenceSchedules();
      }
    } else {
      console.error("Error generating schedules:", error);
    }
  };

  const handleClearSchedule = async (employeeName: string, weeks?: string) => {
    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id")
      .ilike("name", `%${employeeName}%`);

    if (employeeError) {
      console.error("Error fetching employee ID:", employeeError);
      return;
    }

    if (employees.length === 0) {
      alert("No employee found with that name.");
      return;
    }

    const employeeId = employees[0].employee_id;

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("employee_id", employeeId)
      .eq("status", "scheduled");

    if (error) {
      console.error("Error clearing schedules:", error);
    } else {
      // console.log("Schedules cleared for employee:", employeeName);
      fetchReferenceSchedules();
    }
  };

  const handleGenerateAllSchedules = async (weeks?: string) => {
    const parsedWeeks = parseInt(weeks || "0", 10);
    if (isNaN(parsedWeeks)) {
      console.error("Invalid number of weeks:", weeks);
      return;
    }

    const { data: schedules, error } = await supabase.rpc(
      "generate_schedules_for_all_employees",
      {
        weeks: parsedWeeks,
      }
    );

    if (error) {
      console.error("Error generating schedules:", error);
      return;
    }

    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        const employee = employees.find(
          (emp) => emp.employee_id === schedule.employee_id
        );
        if (employee) {
          await supabase
            .from("schedules")
            .update({ name: employee.name })
            .eq("schedule_id", schedule.schedule_id);
        }
      }

      // console.log("Schedules generated for all employees.");
      fetchReferenceSchedules();
    } else {
      // console.log("No schedules found or generated.");
    }
  };

  const handleAddSchedule = async (
    employeeName: string,
    _: string | undefined,
    date?: string,
    startTime?: string,
    endTime?: string
  ) => {
    const employee = employees.find((emp) => emp.name === employeeName);
    if (!employee) {
      console.error("Employee not found:", employeeName);
      return;
    }

    if (date && startTime && endTime) {
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayOfWeek = daysOfWeek[new Date(date + "T00:00:00").getDay()];

      // Ensure the times are stored as they are entered, without any timezone manipulation
      const formattedStartTime =
        startTime.length === 5 ? `${startTime}:00` : startTime;
      const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

      const { error } = await supabase.from("schedules").insert({
        employee_id: employee.employee_id,
        schedule_date: date,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        day_of_week: dayOfWeek,
        status: "added_day",
        name: employee.name, // Include the employee's name
      });

      if (error) {
        console.error("Error adding schedule:", error);
      } else {
        // console.log("Schedule added successfully.");
        fetchReferenceSchedules();
      }
    } else {
      console.error(
        "Date, Start Time, and End Time are required to add a schedule."
      );
    }
  };

  const table = useReactTable({
    data: referenceSchedules,
    columns: scheduleColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const timesheetTable = useReactTable({
    data: timesheets,
    columns: timesheetColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <Card className="flex flex-col h-full max-w-6xl mx-auto my-12">
        <CardHeader className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Manage Employee Schedules</h1>
        </CardHeader>
        <Tabs defaultValue="scheduling" className="w-full">
          <TabsList className="border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduling">
            <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Clear A Schedule</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={(employeeName: string, weeks?: string) =>
                      handleClearSchedule(employeeName, weeks)
                    }
                    buttonText="Select Employee"
                    placeholder="Enter employee name"
                    formType="clearSchedule"
                    employees={employees}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Publish A Schedule</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={(employeeName: string, weeks?: string) =>
                      handleGenerateSingleSchedule(employeeName, weeks)
                    }
                    buttonText="Select Employee"
                    placeholder="Enter employee name and weeks"
                    formType="generate"
                    employees={employees}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Generate All Schedules</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={(_, weeks?: string) =>
                      handleGenerateAllSchedules(weeks)
                    }
                    buttonText="Select # Of Weeks"
                    placeholder="Enter number of weeks"
                    formType="generateAll"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Add A Shift</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={(
                      employeeName: string,
                      _,
                      date?: string,
                      startTime?: string,
                      endTime?: string
                    ) =>
                      handleAddSchedule(
                        employeeName,
                        undefined,
                        date,
                        startTime,
                        endTime
                      )
                    }
                    buttonText="Add An Unscheduled Shift"
                    placeholder="Enter employee name and details"
                    formType="addSchedule"
                    employees={employees}
                  />
                </CardContent>
              </Card>
            </div>

            <CardContent>
              <DataTable
                columns={scheduleColumns}
                data={referenceSchedules}
                fetchReferenceSchedules={fetchReferenceSchedules}
              />
              <SchedulePagination table={table} />
            </CardContent>
          </TabsContent>

          <TabsContent value="timesheets">
            <CardContent>
              <TimesheetDataTable
                columns={timesheetColumns}
                data={timesheets}
                fetchTimesheets={fetchTimesheets}
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </RoleBasedWrapper>
  );
};

export default ManageSchedules;
