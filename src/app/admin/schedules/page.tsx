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
  SortingState,
} from "@tanstack/react-table";
import { SchedulePagination } from "./schedule-pagination";
import { PopoverForm } from "./PopoverForm";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { DataTable } from "./DataTable";
import { TimesheetDataTable } from "./TimesheetDataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { TimesheetPagination } from "./TimesheetPagination";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import AddTimesheetForm from "./AddTimesheetForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

interface Schedule {
  employee_id: number;
  start_time: string | null;
  end_time: string | null;
  // Add other fields as necessary
}

interface Employee {
  employee_id: number;
  name: string;
}

interface ReferenceScheduleResponse {
  schedules: any[];
  employees: Employee[];
}

interface ActualScheduleResponse {
  schedules: any[];
  employees: Employee[];
}

interface ScheduleGenerationResponse {
  schedules_created: number;
  employees_processed: number;
}

interface GenerateSchedulesResponse {
  schedules_created: number;
  employees_processed: number;
}

type PopoverState = boolean;

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
        ? formatTZ(
            toZonedTime(
              new Date(`${info.getValue()}T00:00:00`),
              "America/Los_Angeles"
            ),
            "M/dd/yyyy", // Change the format string to M/dd/yyyy
            { timeZone: "America/Los_Angeles" }
          )
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
    cell: (info) => info.getValue() || "",
  },
];

const ManageSchedules = () => {
  const queryClient = useQueryClient();
  const { user } = useRole();

  const [addSchedulePopoverOpen, setAddSchedulePopoverOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "day_of_week", desc: false },
  ]);
  const [updateSchedulePopoverOpen, setUpdateSchedulePopoverOpen] =
    useState(false);

  useEffect(() => {
    fetchActualSchedules();
    fetchEmployees();
    fetchTimesheets();
  }, []);

  const popoverQuery = useQuery({
    queryKey: ["popoverState"],
    queryFn: () => false, // default closed
    staleTime: Infinity, // Prevent automatic refetching
  });

  // Add the useQuery hook
  const { data: actualSchedules = [] } = useQuery({
    queryKey: ["actualSchedules"],
    queryFn: async () => {
      const [schedulesResponse, employeesResponse] = await Promise.all([
        fetch("/api/fetchSchedules?type=actual"),
        fetch("/api/fetchEmployees"),
      ]);

      if (!schedulesResponse.ok || !employeesResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const schedules = await schedulesResponse.json();
      const employees = await employeesResponse.json();

      return schedules.map((schedule: any) => {
        const employee = employees.find(
          (emp: Employee) => emp.employee_id === schedule.employee_id
        );

        return {
          id: schedule.id,
          employee_id: schedule.employee_id,
          employee_name: employee ? employee.name : "Unknown",
          day_of_week: schedule.day_of_week || "",
          user_uuid: schedule.user_uuid || "",
          start_time: schedule.start_time
            ? formatTime(schedule.start_time)
            : "",
          end_time: schedule.end_time ? formatTime(schedule.end_time) : "",
        };
      });
    },
    // Add stale time and cache time for better performance
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: referenceSchedules = [] } = useQuery({
    queryKey: ["referenceSchedules"],
    queryFn: async () => {
      const response = await fetch("/api/fetchReferenceSchedules");
      if (!response.ok) {
        throw new Error("Failed to fetch reference schedules");
      }

      const { schedules, employees }: ReferenceScheduleResponse =
        await response.json();

      return schedules.map((schedule: any) => {
        const employee = employees.find(
          (emp: Employee) => emp.employee_id === schedule.employee_id
        );

        return {
          id: schedule.schedule_id || schedule.id,
          employee_id: schedule.employee_id,
          employee_name: employee ? employee.name : "Unknown",
          day_of_week: schedule.day_of_week || "",
          user_uuid: schedule.user_uuid || "",
          start_time: schedule.start_time
            ? formatTZ(
                toZonedTime(
                  new Date(`1970-01-01T${schedule.start_time}`),
                  timeZone
                ),
                "hh:mma",
                { timeZone }
              )
            : "",
          end_time: schedule.end_time
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
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/fetchEmployees");
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      return response.json();
    },
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ["timesheets"],
    queryFn: async () => {
      const response = await fetch("/api/fetchTimesheets");
      if (!response.ok) {
        throw new Error("Failed to fetch timesheets");
      }
      return response.json();
    },
  });

  const scheduleQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const response = await fetch("/api/fetchSchedules");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      return response.json();
    },
  });

  // Keep fetchActualSchedules as a function that triggers a refetch
  const fetchActualSchedules = async () => {
    await queryClient.invalidateQueries({ queryKey: ["actualSchedules"] });
  };

  const fetchReferenceSchedules = async () => {
    await queryClient.invalidateQueries({ queryKey: ["referenceSchedules"] });
  };

  // Helper function to format schedules (used for both reference and actual schedules)
  const formatSchedules = (schedules: any) => {
    return schedules.map((schedule: any) => {
      const employee = employees.find(
        (emp: Employee) => emp.employee_id === schedule.employee_id
      );

      return {
        ...schedule,
        employee_name: employee ? employee.name : "Unknown",
        start_time: formatTime(schedule.start_time),
        end_time: formatTime(schedule.end_time),
      };
    });
  };

  const formatTime = (time: string | null): string => {
    if (!time) return "";
    try {
      const date = parseISO(`1970-01-01T${time}`);
      const zonedDate = toZonedTime(date, timeZone);
      return format(zonedDate, "h:mm a");
    } catch (error) {
      //console.("Error formatting time:", error);
      return "";
    }
  };

  const fetchEmployees = async () => {
    await queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  const fetchTimesheets = async () => {
    await queryClient.invalidateQueries({ queryKey: ["timesheets"] });
  };

  // Define mutations for data modifications
  const editTimesheetMutation = useMutation({
    mutationFn: async ({
      id,
      lunch_start,
      lunch_end,
    }: {
      id: number;
      lunch_start: string | null;
      lunch_end: string | null;
    }) => {
      const { error } = await supabase
        .from("employee_clock_events")
        .update({ lunch_start, lunch_end })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: fetchTimesheets,
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (data: {
      employeeId: number;
      date: string;
      startTime: string;
      lunchStart: string | null;
      lunchEnd: string | null;
      endTime: string | null;
    }) => {
      const employee = employees.find(
        (emp: Employee) => emp.employee_id === data.employeeId
      );
      if (!employee) throw new Error("Employee not found");

      const formattedDate = format(parseISO(data.date), "yyyy-MM-dd");
      const formatTime = (time: string | null): string | null => {
        if (!time) return null;
        return time.length === 5 ? `${time}:00` : time;
      };

      const timesheetData = {
        employee_id: data.employeeId,
        employee_name: employee.name,
        event_date: formattedDate,
        start_time: formatTime(data.startTime),
        lunch_start: formatTime(data.lunchStart),
        lunch_end: formatTime(data.lunchEnd),
        end_time: formatTime(data.endTime),
      };

      const { data: existingEntry } = await supabase
        .from("employee_clock_events")
        .select()
        .match({
          employee_id: data.employeeId,
          event_date: formattedDate,
        })
        .single();

      if (existingEntry) {
        return supabase
          .from("employee_clock_events")
          .update(timesheetData)
          .match({ id: existingEntry.id });
      }
      return supabase.from("employee_clock_events").insert(timesheetData);
    },
    onSuccess: fetchTimesheets,
    onError: (error) => {
      toast.error(error.message || "Failed to add/update timesheet entry");
    },
  });

  const clearScheduleMutation = useMutation({
    mutationFn: async (employeeName: string) => {
      const response = await fetch("/api/clearSchedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to clear schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referenceSchedules"] });
      toast.success("Schedule cleared successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateSchedulesMutation = useMutation({
    mutationFn: async (weeks: string | undefined) => {
      const response = await fetch("/api/generateSchedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weeks: parseInt(weeks || "0", 10) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate schedules");
      }

      const data = await response.json();

      return {
        schedulesGenerated: data.schedules_created,
        employeesProcessed: data.employees_processed,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["referenceSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["actualSchedules"] });
      toast.success(
        `Successfully generated ${data.schedulesGenerated} schedules for ${data.employeesProcessed} employees`
      );
    },
    onError: (error: Error) => {
      console.error("Generation Error:", error);
      toast.error(`Failed to generate schedules: ${error.message}`);
    },
  });

  const addScheduleMutation = useMutation({
    mutationFn: async ({
      employeeName,
      date,
      startTime,
      endTime,
    }: {
      employeeName: string;
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      const response = await fetch("/api/addSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName,
          date,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actualSchedules"] });
      queryClient.setQueryData(["popoverState"], false); // Close popover
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({
      employeeId,
      date,
      startTime,
      endTime,
    }: {
      employeeId: number;
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      const response = await fetch("/api/updateSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          date,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referenceSchedules"] });
      setUpdateSchedulePopoverOpen(false);
      toast.success("Schedule updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update schedule");
    },
  });

  // Update the handlers to use mutations
  const handleEditTimesheet = (
    id: number,
    lunch_start: string | null,
    lunch_end: string | null
  ) => {
    editTimesheetMutation.mutate({ id, lunch_start, lunch_end });
  };

  const handleAddTimeSheetEntry = (
    employeeId: number,
    date: string,
    startTime: string,
    lunchStart: string | null,
    lunchEnd: string | null,
    endTime: string | null
  ) => {
    addTimesheetMutation.mutate({
      employeeId,
      date,
      startTime,
      lunchStart,
      lunchEnd,
      endTime,
    });
  };

  const handleGenerateSingleSchedule = async (
    employeeName: string,
    weeks?: string
  ) => {
    const employee = employees.find(
      (emp: Employee) => emp.name === employeeName
    );
    if (!employee) {
      //console.("Employee not found:", employeeName);
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
        // console.error(
        //   "Error updating employee name in schedules:",
        //   updateError
        // );
      } else {
        // console.log("Schedules generated successfully.");
        fetchReferenceSchedules();
      }
    } else {
      //console.("Error generating schedules:", error);
    }
  };

  const handleGenerateAllSchedules = (weeks?: string) => {
    // Default to 1 week if no value is provided
    const parsedWeeks = parseInt(weeks || "1", 10);

    // Validate the input
    if (isNaN(parsedWeeks) || parsedWeeks < 1) {
      toast.error("Please enter a valid number of weeks (minimum 1)");
      return;
    }

    toast.loading("Generating schedules...", { id: "generating-schedules" });

    generateSchedulesMutation.mutate(parsedWeeks.toString(), {
      // Pass parsedWeeks as a string
      onSuccess: () => {
        toast.dismiss("generating-schedules");
      },
      onError: () => {
        toast.dismiss("generating-schedules");
      },
    });
  };

  const handleClearSchedule = (employeeName: string) => {
    clearScheduleMutation.mutate(employeeName);
  };

  const handleAddSchedule = (
    employeeName: string,
    _: string | undefined,
    date?: string,
    startTime?: string,
    endTime?: string
  ) => {
    if (!date || !startTime || !endTime) {
      toast.error("Date, Start Time, and End Time are required");
      return;
    }

    addScheduleMutation.mutate({
      employeeName,
      date,
      startTime,
      endTime,
    });
  };

  const handleUpdateSchedule = (
    employeeName: string,
    _: string | undefined,
    date?: string,
    startTime?: string,
    endTime?: string
  ) => {
    const employee = employees.find(
      (emp: Employee) => emp.name === employeeName
    );
    if (!employee || !date || !startTime || !endTime) {
      toast.error("Missing required information for updating schedule");
      return;
    }

    const formattedDate = format(parseISO(date), "yyyy-MM-dd");

    updateScheduleMutation.mutate({
      employeeId: employee.employee_id,
      date: formattedDate,
      startTime,
      endTime,
    });
  };

  const fetchSchedule = async (employeeId: number, date: string) => {
    try {
      const response = await fetch(
        `/api/fetchScheduleByDate?employeeId=${employeeId}&date=${date}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return null;
    }
  };

  // const table = useReactTable({
  //   data: referenceSchedules,
  //   columns: scheduleColumns,
  //   getCoreRowModel: getCoreRowModel(),
  //   getPaginationRowModel: getPaginationRowModel(),
  //   getFilteredRowModel: getFilteredRowModel(),
  // });

  // const timesheetTable = useReactTable({
  //   data: timesheets,
  //   columns: timesheetColumns,
  //   getCoreRowModel: getCoreRowModel(),
  //   getPaginationRowModel: getPaginationRowModel(),
  //   getFilteredRowModel: getFilteredRowModel(),
  // });

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev"]}>
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
            <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Clear</h2>
                  <h2 className="text-lg font-bold">A Schedule</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={(employeeName: string) =>
                      handleClearSchedule(employeeName)
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
                  <h2 className="text-lg font-bold">Publish</h2>
                  <h2 className="text-lg font-bold">A Schedule</h2>
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
                  <h2 className="text-lg font-bold">Generate</h2>
                  <h2 className="text-lg font-bold">All Schedule</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={(_, weeks?: string) => {
                      generateSchedulesMutation.mutate(weeks || "1");
                    }}
                    buttonText="Select # Of Weeks"
                    placeholder="Enter number of weeks"
                    formType="generateAll"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Add</h2>
                  <h2 className="text-lg font-bold">A Shift</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={handleAddSchedule}
                    buttonText="Add Unscheduled Shift"
                    placeholder="Enter employee name and details"
                    formType="addSchedule"
                    employees={employees}
                    open={popoverQuery.data ?? false} // Add fallback value
                    onOpenChange={(open) => {
                      queryClient.setQueryData<PopoverState>(
                        ["popoverState"],
                        open
                      );
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Update</h2>
                  <h2 className="text-lg font-bold">Existing Shift</h2>
                </CardHeader>
                <CardContent className="flex flex-col mx-auto">
                  <PopoverForm
                    onSubmit={handleUpdateSchedule}
                    buttonText="Update Existing Shift"
                    placeholder="Enter employee name and details"
                    formType="updateSchedule"
                    employees={employees}
                    fetchSchedule={fetchSchedule}
                    open={updateSchedulePopoverOpen}
                    onOpenChange={setUpdateSchedulePopoverOpen}
                  />
                </CardContent>
              </Card>
            </div>

            <CardContent>
              <DataTable
                columns={scheduleColumns}
                data={[...referenceSchedules, ...actualSchedules]}
                sorting={sorting}
                onSortingChange={setSorting}
                fetchReferenceSchedules={fetchReferenceSchedules}
                fetchActualSchedules={fetchActualSchedules}
                showPagination={true}
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="timesheets">
            <CardContent>
              <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-bold">Add Timesheet Entry</h2>
                  </CardHeader>
                  <CardContent className="flex flex-col mx-auto">
                    <AddTimesheetForm
                      employees={employees}
                      onTimesheetAdded={handleAddTimeSheetEntry}
                    />
                  </CardContent>
                </Card>
              </div>

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
