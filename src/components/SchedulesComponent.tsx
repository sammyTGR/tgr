"use client";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase/client";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { useRole } from "@/context/RoleContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@radix-ui/react-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import {
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  subDays,
  format,
  getMonth,
  getDate,
} from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeZone = "America/Los_Angeles";

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status?: string;
  employee_id: number;
  birthday?: string;
}

interface EmployeeCalendar {
  employee_id: number;
  name: string;
  rank: number;
  department: string;
  events: CalendarEvent[];
}

type BreakRoomDuty = {
  employee: EmployeeCalendar;
  dutyDate: Date;
  actualDutyDate: Date;
} | null;

// Add this helper function at the top of your file, outside of the component
const isSameDayOfYear = (date1: Date, date2: Date) => {
  return (
    getMonth(date1) === getMonth(date2) && getDate(date1) === getDate(date2)
  );
};

const SchedulesComponent = ({ employeeId }: { employeeId: number }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStatus, setCustomStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [lateStartTime, setLateStartTime] = useState("");
  const role = useRole().role;
  const queryClient = useQueryClient();

  const getStartOfWeek = (date: Date) => {
    const start = startOfWeek(date);
    return toZonedTime(start, timeZone);
  };

  const fetchCalendarData = useCallback(async (): Promise<
    EmployeeCalendar[]
  > => {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = addDays(startOfWeek, 6);

    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        schedule_date,
        start_time,
        end_time,
        day_of_week,
        status,
        employee_id,
        employees:employee_id (name, birthday, department)
      `
      )
      .eq("employee_id", employeeId)
      .gte("schedule_date", formatTZ(startOfWeek, "yyyy-MM-dd", { timeZone }))
      .lte("schedule_date", formatTZ(endOfWeek, "yyyy-MM-dd", { timeZone }));

    if (error) throw error;

    const groupedData: { [key: number]: EmployeeCalendar } = {};

    data.forEach((item: any) => {
      if (!groupedData[item.employee_id]) {
        groupedData[item.employee_id] = {
          employee_id: item.employee_id,
          name: item.employees.name,
          department: item.employees.department,
          rank: 0, // You might want to fetch this from somewhere
          events: [],
        };
      }

      groupedData[item.employee_id].events.push({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        schedule_date: item.schedule_date,
        status: item.status,
        employee_id: item.employee_id,
        birthday: item.employees.birthday,
      });
    });

    return Object.values(groupedData);
  }, [currentDate, employeeId]);

  const {
    data: calendarData,
    isLoading: calendarLoading,
    error: calendarError,
  } = useQuery({
    queryKey: ["calendarData", currentDate, employeeId],
    queryFn: fetchCalendarData,
  });

  const getBreakRoomDutyEmployee = useCallback(
    async (
      employees: EmployeeCalendar[],
      currentWeekStart: Date
    ): Promise<BreakRoomDuty> => {
      const formattedWeekStart = format(currentWeekStart, "yyyy-MM-dd");
      const fridayOfWeek = addDays(startOfWeek(currentWeekStart), 5);

      const { data: existingDuty, error: existingDutyError } = await supabase
        .from("break_room_duty")
        .select("*")
        .eq("week_start", formattedWeekStart);

      if (existingDutyError) {
        console.error("Error fetching existing duty:", existingDutyError);
        return null;
      }

      if (existingDuty && existingDuty.length > 0) {
        const employee = employees.find(
          (emp) => emp.employee_id === existingDuty[0].employee_id
        );
        return employee
          ? {
              employee,
              dutyDate: parseISO(existingDuty[0].duty_date),
              actualDutyDate: parseISO(existingDuty[0].actual_duty_date),
            }
          : null;
      }

      // If no existing duty, create a new assignment
      const salesEmployees = employees
        .filter((emp) => emp.department === "Sales")
        .sort((a, b) => a.rank - b.rank);

      if (salesEmployees.length === 0) {
        console.error(
          "No sales employees found for break room duty assignment"
        );
        return null;
      }

      // Find the next employee in the rotation
      const { data: lastAssignment, error: lastAssignmentError } =
        await supabase
          .from("break_room_duty")
          .select("employee_id")
          .order("week_start", { ascending: false })
          .limit(1);

      if (lastAssignmentError) {
        console.error("Error fetching last assignment:", lastAssignmentError);
        return null;
      }

      let nextEmployeeIndex = 0;
      if (lastAssignment && lastAssignment.length > 0) {
        const lastIndex = salesEmployees.findIndex(
          (emp) => emp.employee_id === lastAssignment[0].employee_id
        );
        nextEmployeeIndex = (lastIndex + 1) % salesEmployees.length;
      }

      const selectedEmployee = salesEmployees[nextEmployeeIndex];

      // Define the order of days to check, starting with Friday, then Thursday backwards
      const daysToCheck = [
        "Friday",
        "Thursday",
        "Wednesday",
        "Tuesday",
        "Monday",
        "Sunday",
        "Saturday",
      ];
      let actualDutyDate = null;

      for (const day of daysToCheck) {
        const dayIndex = daysOfWeek.indexOf(day);
        const checkDate = addDays(currentWeekStart, dayIndex);
        const formattedDate = format(checkDate, "yyyy-MM-dd");

        const { data: schedules, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("employee_id", selectedEmployee.employee_id)
          .eq("schedule_date", formattedDate)
          .in("status", ["scheduled", "added_day"]);

        if (error) {
          console.error("Error fetching schedule:", error);
          continue;
        }

        if (schedules && schedules.length > 0) {
          actualDutyDate = checkDate;
          break;
        }
      }

      if (!actualDutyDate) {
        console.error(
          "No scheduled work day found for the selected employee this week"
        );
        return null;
      }

      // Insert the new assignment into the break_room_duty table
      const { error: insertError } = await supabase
        .from("break_room_duty")
        .insert({
          week_start: formattedWeekStart,
          employee_id: selectedEmployee.employee_id,
          duty_date: format(fridayOfWeek, "yyyy-MM-dd"), // Always set to Friday
          actual_duty_date: format(actualDutyDate, "yyyy-MM-dd"), // The day they're actually working
        });

      if (insertError) {
        console.error("Error inserting break room duty:", insertError);
        return null;
      }

      return {
        employee: selectedEmployee,
        dutyDate: fridayOfWeek,
        actualDutyDate: actualDutyDate,
      };
    },
    []
  );

  const {
    data: breakRoomDuty,
    isLoading: breakRoomDutyLoading,
    error: breakRoomDutyError,
  } = useQuery<BreakRoomDuty, Error>({
    queryKey: [
      "breakRoomDuty",
      format(getStartOfWeek(currentDate), "yyyy-MM-dd"),
    ],
    queryFn: () =>
      getBreakRoomDutyEmployee(calendarData || [], getStartOfWeek(currentDate)),
    enabled: !!calendarData,
  });

  const updateScheduleStatusMutation = useMutation({
    mutationFn: async ({
      employee_id,
      schedule_date,
      status,
      start_time,
      end_time,
    }: {
      employee_id: number;
      schedule_date: string;
      status: string;
      start_time?: string;
      end_time?: string;
    }) => {
      const formattedDate = format(parseISO(schedule_date), "yyyy-MM-dd");
      const response = await fetch("/api/update_schedule_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id,
          schedule_date: formattedDate,
          status,
          start_time,
          end_time,
        }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendarData", currentDate, employeeId],
      });
    },
  });

  const updateScheduleStatus = async (
    employee_id: number,
    schedule_date: string,
    status: string,
    start_time?: string,
    end_time?: string
  ) => {
    try {
      const formattedDate = format(parseISO(schedule_date), "yyyy-MM-dd");
      const response = await fetch("/api/update_schedule_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id,
          schedule_date: formattedDate,
          status,
          start_time,
          end_time,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      queryClient.invalidateQueries({
        queryKey: ["calendarData", currentDate],
      });
    } catch (error) {
      console.error(
        "Failed to update schedule status:",
        (error as Error).message
      );
    }
  };

  const handleCustomStatusSubmit = () => {
    if (currentEvent) {
      updateScheduleStatusMutation.mutate({
        employee_id: currentEvent.employee_id,
        schedule_date: currentEvent.schedule_date,
        status: `Custom:${customStatus}`,
      });
      setDialogOpen(false);
      setCustomStatus("");
    }
  };

  const handlePreviousWeek = () => {
    setCurrentDate((prev) => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => addDays(prev, 7));
  };

  const formatTime = (time: string | null) => {
    if (!time || isNaN(Date.parse(`1970-01-01T${time}`))) return "N/A";
    return formatTZ(
      toZonedTime(new Date(`1970-01-01T${time}`), timeZone),
      "hh:mma",
      { timeZone }
    );
  };

  const renderEmployeeRow = useCallback(
    (employee: EmployeeCalendar) => {
      const eventsByDay: { [key: string]: CalendarEvent[] } = {};
      daysOfWeek.forEach((day) => {
        eventsByDay[day] = employee.events.filter(
          (event: CalendarEvent) => event.day_of_week === day
        );
      });

      return (
        <TableRow key={employee.employee_id}>
          {daysOfWeek.map((day) => (
            <TableCell key={day} className="text-left relative group">
              {eventsByDay[day].map((event, index) => (
                <div key={index} className="relative">
                  {event.birthday &&
                  isSameDayOfYear(
                    parseISO(event.schedule_date),
                    parseISO(event.birthday)
                  ) ? (
                    <div className="text-teal-500 dark:text-teal-400 font-bold">
                      Happy Birthday! 🎉
                    </div>
                  ) : null}
                  {breakRoomDuty &&
                  breakRoomDuty.employee.employee_id === employee.employee_id &&
                  isSameDay(
                    parseISO(event.schedule_date),
                    breakRoomDuty.actualDutyDate
                  ) ? (
                    <div className="text-red-500 font-bold">
                      Break Room Duty
                      {!isSameDay(
                        breakRoomDuty.actualDutyDate,
                        breakRoomDuty.dutyDate
                      ) && " (Rescheduled)"}
                    </div>
                  ) : null}
                  {event.status === "added_day" ? (
                    <div className="text-pink-500 dark:text-pink-300">
                      {`${formatTime(event.start_time)}-${formatTime(
                        event.end_time
                      )}`}
                    </div>
                  ) : event.start_time && event.end_time ? (
                    event.status === "time_off" ? (
                      <div className="text-purple-600 dark:text-purple-500">
                        Approved Time Off
                      </div>
                    ) : event.status === "called_out" ? (
                      <div className="text-red-500 dark:text-red-400">
                        Called Out
                      </div>
                    ) : event.status === "left_early" ? (
                      <div className="text-orange-500 dark:text-orange-400">
                        Left Early
                      </div>
                    ) : event.status === "updated_shift" ? (
                      <div className="text-orange-500 dark:text-orange-400">
                        {`${formatTime(event.start_time)}-${formatTime(
                          event.end_time
                        )}`}
                      </div>
                    ) : event.status && event.status.startsWith("Custom:") ? (
                      <div className="text-green-500 dark:text-green-400">
                        {event.status.replace("Custom:", "").trim()}
                      </div>
                    ) : event.status &&
                      event.status.startsWith("Late Start") ? (
                      <div className="text-yellow-500 dark:text-yellow-400">
                        {event.status}
                      </div>
                    ) : (
                      <div
                        className={
                          toZonedTime(
                            new Date(`1970-01-01T${event.start_time}`),
                            timeZone
                          ).getHours() < 12
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-blue-500 dark:text-blue-400"
                        }
                      >
                        {`${formatTime(event.start_time)}-${formatTime(
                          event.end_time
                        )}`}
                      </div>
                    )
                  ) : null}

                  {(role === "admin" ||
                    role === "super admin" ||
                    role === "dev") && (
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="linkHover1">
                            <CaretUpIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Button
                            variant="linkHover2"
                            onClick={() =>
                              updateScheduleStatusMutation.mutate({
                                employee_id: event.employee_id,
                                schedule_date: event.schedule_date,
                                status: "called_out",
                              })
                            }
                          >
                            Called Out
                          </Button>
                          <Button
                            variant="linkHover2"
                            onClick={() =>
                              updateScheduleStatusMutation.mutate({
                                employee_id: event.employee_id,
                                schedule_date: event.schedule_date,
                                status: "left_early",
                              })
                            }
                          >
                            Left Early
                          </Button>
                          <Button
                            variant="linkHover2"
                            onClick={() =>
                              updateScheduleStatusMutation.mutate({
                                employee_id: event.employee_id,
                                schedule_date: event.schedule_date,
                                status: "Custom:Off",
                              })
                            }
                          >
                            Off
                          </Button>
                          <Dialog
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                className="p-4"
                                variant="linkHover2"
                                onClick={() => {
                                  setCurrentEvent(event);
                                  setDialogOpen(true);
                                }}
                              >
                                Late Start
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle className="p-4">
                                Enter Late Start Time
                              </DialogTitle>
                              <input
                                type="time"
                                value={lateStartTime}
                                onChange={(e) =>
                                  setLateStartTime(e.target.value)
                                }
                                className="border rounded p-2"
                              />
                              <Button
                                variant="linkHover1"
                                onClick={() => {
                                  const formattedTime = new Date(
                                    `1970-01-01T${lateStartTime}`
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  });
                                  updateScheduleStatus(
                                    event.employee_id,
                                    event.schedule_date,
                                    `Late Start ${formattedTime}`
                                  );
                                  setDialogOpen(false);
                                  setLateStartTime("");
                                }}
                              >
                                Submit
                              </Button>
                              <DialogClose asChild>
                                <Button variant="linkHover2">Cancel</Button>
                              </DialogClose>
                            </DialogContent>
                          </Dialog>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              ))}
            </TableCell>
          ))}
        </TableRow>
      );
    },
    [
      breakRoomDuty,
      role,
      updateScheduleStatusMutation,
      formatTime,
      dialogOpen,
      lateStartTime,
    ]
  );

  if (calendarLoading || breakRoomDutyLoading) {
    return <div></div>;
  }

  if (calendarError || breakRoomDutyError) {
    return <div>Error loading data</div>;
  }

  const weekDates = daysOfWeek.reduce((acc, day, index) => {
    const date = addDays(getStartOfWeek(currentDate), index);
    acc[day] = format(date, "M/d");
    return acc;
  }, {} as { [key: string]: string });

  return (
    <div className="flex flex-col items-center space-y-4 p-4 overflow-hidden">
      <div className="flex justify-between w-full mb-4">
        <Button variant="linkHover2" onClick={handlePreviousWeek}>
          <ChevronLeftIcon className="h-4 w-4" />
          Previous Week
        </Button>
        <Button variant="linkHover1" onClick={handleNextWeek}>
          Next Week
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <Table className="min-w-full overflow-hidden">
        <TableHeader>
          <TableRow>
            {daysOfWeek.map((day) => (
              <TableHead key={day}>
                {day}
                <br />
                {weekDates[day]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {calendarData?.map((employee) => renderEmployeeRow(employee))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SchedulesComponent;
