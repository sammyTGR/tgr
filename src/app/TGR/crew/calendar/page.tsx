"use client";
import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "../../../../utils/supabase/client";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { useRole } from "../../../../context/RoleContext";
import { Card, CardContent } from "@/components/ui/card";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import TimeoffForm from "@/components/TimeoffForm";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toZonedTime, format as formatTZ, format } from "date-fns-tz";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import styles from "./calendar.module.css"; // Create this CSS module file
import classNames from "classnames";
import { ShiftFilter } from "./ShiftFilter";
import { startOfWeek, addDays, isSameWeek, isFriday, parseISO, subDays, isSameDay } from "date-fns";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const title = "TGR Team Calendar";
const timeZone = "America/Los_Angeles"; // Define your time zone

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status?: string;
  employee_id: number; // Ensure this is part of the event
  birthday?: string;
}

interface EmployeeCalendar {
  employee_id: number; // Ensure this is part of the employee
  name: string;
  rank: number;
  department: string; // Add this line
  events: CalendarEvent[];
}

let lastAssignedIndex = -1;
let assignmentCycle: number[] = [];

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const fetchEmployeeNames = async (): Promise<
  { name: string; rank: number }[]
> => {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("name, rank");
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch employee names:", (error as Error).message);
    return [];
  }
};

// Add this type definition
type BreakRoomDuty = {
  employee: EmployeeCalendar;
  dutyDate: Date;
} | null;

const getBreakRoomDutyEmployee = async (
  employees: EmployeeCalendar[],
  currentWeekStart: Date
): Promise<BreakRoomDuty> => {
  const formattedWeekStart = format(currentWeekStart, "yyyy-MM-dd");

  // Check if there's already an assignment for this week
  const { data: existingDuty, error: existingDutyError } = await supabase
    .from("break_room_duty")
    .select("*")
    .eq("week_start", formattedWeekStart);

  if (existingDutyError) {
    console.error("Error fetching existing duty:", existingDutyError);
    return null;
  }

  if (existingDuty && existingDuty.length > 0) {
    const employee = employees.find(emp => emp.employee_id === existingDuty[0].employee_id);
    return employee ? { 
      employee, 
      dutyDate: parseISO(existingDuty[0].duty_date)
    } : null;
  }

  // If no existing duty, create a new assignment
  const salesEmployees = employees.filter(emp => emp.department === "Sales")
    .sort((a, b) => a.rank - b.rank);

  if (salesEmployees.length === 0) return null;

  // Find the next employee in the rotation
  const { data: lastAssignment, error: lastAssignmentError } = await supabase
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
    const lastIndex = salesEmployees.findIndex(emp => emp.employee_id === lastAssignment[0].employee_id);
    nextEmployeeIndex = (lastIndex + 1) % salesEmployees.length;
  }

  const selectedEmployee = salesEmployees[nextEmployeeIndex];

  // Define the order of days to check, only Friday
  const daysToCheck = ["Friday"];
  let dutyDate = null;

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
      dutyDate = checkDate;
      break;
    }
  }

  if (!dutyDate) {
    console.error("No scheduled work day found for the selected employee on Friday this week");
    return null;
  }

  // Insert the new assignment into the break_room_duty table
  const { error: insertError } = await supabase
    .from("break_room_duty")
    .insert({
      week_start: formattedWeekStart,
      employee_id: selectedEmployee.employee_id,
      duty_date: format(dutyDate, "yyyy-MM-dd"),
    });

  if (insertError) {
    console.error("Error inserting break room duty:", insertError);
    return null;
  }

  return { 
    employee: selectedEmployee, 
    dutyDate: dutyDate
  };
};

export default function Component() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const role = useRole().role; // Access the role property directly
  const [customStatus, setCustomStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [lateStartTime, setLateStartTime] = useState("");

  const { data: isDialogOpen = false } = useQuery({
    queryKey: ["timeOffDialogOpen"],
    queryFn: () => false,
    enabled: false,
  });

  const handleDialogOpen = (open: boolean) => {
    queryClient.setQueryData(["timeOffDialogOpen"], open);
  };
  
  const fetchCalendarData = useCallback(async (): Promise<EmployeeCalendar[]> => {
    const timeZone = "America/Los_Angeles";
    const startOfWeek = toZonedTime(getStartOfWeek(currentDate), timeZone);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    try {
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
          employees:employee_id (name, birthday, department, rank)
        `
        )
        .gte("schedule_date", formatTZ(startOfWeek, "yyyy-MM-dd", { timeZone }))
        .lte("schedule_date", formatTZ(endOfWeek, "yyyy-MM-dd", { timeZone }));

      if (error) {
        throw error;
      }

      const groupedData: { [key: number]: EmployeeCalendar } = {};

      data.forEach((item: any) => {
        if (!groupedData[item.employee_id]) {
          groupedData[item.employee_id] = {
            employee_id: item.employee_id,
            name: item.employees.name,
            department: item.employees.department,
            rank: item.employees.rank,
            events: [],
          };
        }

        groupedData[item.employee_id].events.push({
          day_of_week: item.day_of_week,
          start_time: item.start_time ? item.start_time : null,
          end_time: item.end_time ? item.end_time : null,
          schedule_date: item.schedule_date,
          status: item.status,
          employee_id: item.employee_id,
          birthday: item.employees.birthday,
        });
      });

      return Object.values(groupedData);
    } catch (error) {
      console.error("Failed to fetch calendar data:", (error as Error).message);
      return [];
    }
  }, [currentDate]);

  

  const filterEventsByShiftAndDay = useCallback((events: CalendarEvent[]) => {
    return events.filter((event) => {
      if (selectedDay && event.day_of_week !== selectedDay) return false;
      if (selectedShifts.length > 0) {
        const startTime = event.start_time ? new Date(`1970-01-01T${event.start_time}`) : null;
        if (!startTime) return false;
        const time = startTime.getHours() + startTime.getMinutes() / 60;
        return (
          (selectedShifts.includes("morning") && time < 10) ||
          (selectedShifts.includes("mid") && time >= 10 && time < 11.5) ||
          (selectedShifts.includes("closing") && time >= 11.5)
        );
      }
      return true;
    });
  }, [selectedDay, selectedShifts]);

  const {
    data: calendarData,
    isLoading: calendarLoading,
    error: calendarError,
  } = useQuery({
    queryKey: ["calendarData", currentDate],
    queryFn: fetchCalendarData,
  });

  const employeeNames = useMemo(() => 
    calendarData ? calendarData.map((emp) => emp.name) : []
  , [calendarData]);

  const filteredCalendarData = useMemo(() => {
    if (!calendarData) return [];
    return calendarData
      .map((employee) => ({
        ...employee,
        events: filterEventsByShiftAndDay(employee.events),
      }))
      .filter((employee) => employee.events.length > 0);
  }, [calendarData, filterEventsByShiftAndDay]);

  const sortedFilteredCalendarData = useMemo(() => {
    return [...filteredCalendarData].sort((a, b) => a.rank - b.rank);
  }, [filteredCalendarData]);

  const handleDayClick = (day: string) => {
    if (role === "admin" || role === "super admin" || role === "user") {
      setSelectedDay((prevDay) => (prevDay === day ? null : day));
    }
  };

  const handleShiftFilter = (shifts: string[]) => {
    setSelectedShifts(shifts);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0) {
        setCurrentDate(new Date());
      }
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  const getStartOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

  const weekDates = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDatesTemp: { [key: string]: string } = {};
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      weekDatesTemp[day] = `${date.getMonth() + 1}/${date.getDate()}`;
    });
    return weekDatesTemp;
  }, [currentDate]);



  const handlePreviousWeek = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const formatTime = (time: string | null) => {
    if (!time || isNaN(Date.parse(`1970-01-01T${time}`))) return "N/A";
    const timeZone = "America/Los_Angeles";
    return formatTZ(
      toZonedTime(new Date(`1970-01-01T${time}`), timeZone),
      "hh:mma",
      { timeZone }
    );
  };

  const updateStatusMutation = useMutation({
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
      start_time?: string | null;
      end_time?: string | null;
    }) => {
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

      return response.json();
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["calendarData", currentDate] });

      const previousData = queryClient.getQueryData<EmployeeCalendar[]>(["calendarData", currentDate]);

      queryClient.setQueryData<EmployeeCalendar[] | undefined>(
        ["calendarData", currentDate],
        (old) => {
          if (!old) return old;
          return old.map((employee) => {
            if (employee.employee_id === newStatus.employee_id) {
              return {
                ...employee,
                events: employee.events.map((event) => {
                  if (event.schedule_date === newStatus.schedule_date) {
                    return {
                      ...event,
                      status: newStatus.status,
                      start_time: newStatus.start_time ?? event.start_time,
                      end_time: newStatus.end_time ?? event.end_time,
                    };
                  }
                  return event;
                }),
              };
            }
            return employee;
          });
        }
      );

      return { previousData };
    },
    onError: (err, newStatus, context) => {
      queryClient.setQueryData(["calendarData", currentDate], context?.previousData);
    },
    onSettled: (data, error, variables) => {
      if (!error) {
        queryClient.setQueryData<EmployeeCalendar[] | undefined>(
          ["calendarData", currentDate],
          (old) => {
            if (!old) return old;
            return old.map((employee) => {
              if (employee.employee_id === variables.employee_id) {
                return {
                  ...employee,
                  events: employee.events.map((event) => {
                    if (event.schedule_date === variables.schedule_date) {
                      return {
                        ...event,
                        status: variables.status,
                        start_time: variables.start_time ?? event.start_time,
                        end_time: variables.end_time ?? event.end_time,
                      };
                    }
                    return event;
                  }),
                };
              }
              return employee;
            });
          }
        );
      }
    },
  });

  const updateScheduleStatus = (
    employee_id: number,
    schedule_date: string,
    status: string,
    start_time?: string,
    end_time?: string
  ) => {
    updateStatusMutation.mutate({ employee_id, schedule_date, status, start_time, end_time });
  };

  const handleCustomStatusSubmit = () => {
    if (currentEvent) {
      updateScheduleStatus(
        currentEvent.employee_id,
        currentEvent.schedule_date,
        `Custom:${customStatus}`
      );
      setDialogOpen(false);
      setCustomStatus("");
    }
  };

  const { data: breakRoomDuty, isLoading: breakRoomDutyLoading, error: breakRoomDutyError } = useQuery<BreakRoomDuty, Error>({
    queryKey: ["breakRoomDuty", format(startOfWeek(currentDate), "yyyy-MM-dd")],
    queryFn: () => getBreakRoomDutyEmployee(calendarData || [], startOfWeek(currentDate)),
    enabled: !!calendarData,
  });
  
  // In your component, add error handling:
  if (breakRoomDutyError) {
    console.error("Error fetching break room duty:", breakRoomDutyError);
    // You can also display an error message to the user here
  }

  const renderEmployeeRow = useCallback((employee: EmployeeCalendar) => {
    const eventsByDay: { [key: string]: CalendarEvent[] } = {};
    daysOfWeek.forEach((day) => {
      eventsByDay[day] = employee.events.filter(
        (calendarEvent) => calendarEvent.day_of_week === day
      );
    });

    return (
      <TableRow key={employee.employee_id}>
        <TableCell className="font-medium w-20 sticky max-w-sm left-0 z-5 bg-background">
          {employee.name}
        </TableCell>
        {daysOfWeek.map((day) => (
          <TableCell
            key={day}
            className={`text-left relative group w-20 max-w-sm ${
              selectedDay && day !== selectedDay ? "hidden" : ""
            }`}
          >
            {eventsByDay[day].map((calendarEvent, index) => (
              <div key={index} className="relative">
                {calendarEvent.birthday &&
                isSameDayOfYear(
                  parseISO(calendarEvent.schedule_date),
                  parseISO(calendarEvent.birthday)
                ) ? (
                  <div className="text-teal-500 dark:text-teal-400 font-bold">
                    Happy Birthday! 🎉
                  </div>
                ) : null}
                {breakRoomDuty &&
                breakRoomDuty.employee.employee_id === employee.employee_id &&
                isSameDay(parseISO(calendarEvent.schedule_date), breakRoomDuty.dutyDate) &&
                (calendarEvent.status === "scheduled" || calendarEvent.status === "added_day") ? (
                  <div className="text-pink-600 font-bold">
                    Break Room Duty 🧹
                    {!isFriday(breakRoomDuty.dutyDate) && " (Rescheduled)"}
                  </div>
                ) : null}
                {calendarEvent.status === "added_day" ? (
                  <div className="text-pink-500 dark:text-pink-300">
                    {formatTime(calendarEvent.start_time)}-{formatTime(calendarEvent.end_time)}
                  </div>
                ) : calendarEvent.start_time && calendarEvent.end_time ? (
                  calendarEvent.status === "time_off" ? (
                    <div className="text-purple-600 dark:text-purple-500">
                      Approved Time Off
                    </div>
                  ) : calendarEvent.status === "called_out" ? (
                    <div className="text-red-600 dark:text-red-600">
                      Called Out
                    </div>
                  ) : calendarEvent.status === "left_early" ? (
                    <div className="text-orange-500 dark:text-orange-400">
                      Left Early
                    </div>
                  ) : calendarEvent.status === "updated_shift" ? (
                    <div className="text-orange-500 dark:text-orange-400">
                      {formatTime(calendarEvent.start_time)}-{formatTime(calendarEvent.end_time)}
                    </div>
                  ) : calendarEvent.status &&
                    calendarEvent.status.startsWith("Custom:") ? (
                    <div className="text-green-500 dark:text-green-400">
                      {calendarEvent.status.replace("Custom:", "").trim()}
                    </div>
                  ) : calendarEvent.status && calendarEvent.status.startsWith("Late Start") ? (
                    <div className="text-red-500 dark:text-red-400">
                      {calendarEvent.status}
                    </div>
                  ) : (
                    <div
                      className={
                        new Date(`1970-01-01T${calendarEvent.start_time}`).getHours() < 12
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-blue-500 dark:text-blue-400"
                      }
                    >
                      {formatTime(calendarEvent.start_time)}-{formatTime(calendarEvent.end_time)}
                    </div>
                  )
                ) : null}

                {(role === "admin" || role === "super admin") && (
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
                            updateScheduleStatus(
                              calendarEvent.employee_id,
                              calendarEvent.schedule_date,
                              "called_out"
                            )
                          }
                        >
                          Called Out
                        </Button>
                        <Button
                          variant="linkHover2"
                          onClick={() =>
                            updateScheduleStatus(
                              calendarEvent.employee_id,
                              calendarEvent.schedule_date,
                              "left_early"
                            )
                          }
                        >
                          Left Early
                        </Button>
                        <Button
                          variant="linkHover2"
                          onClick={() =>
                            updateScheduleStatus(
                              calendarEvent.employee_id,
                              calendarEvent.schedule_date,
                              "Custom:Off"
                            )
                          }
                        >
                          Off
                        </Button>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              className="p-4"
                              variant="linkHover2"
                              onClick={() => {
                                setCurrentEvent(calendarEvent);
                                setDialogOpen(true);
                              }}
                            >
                              Late Start
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogTitle className="p-4">Enter Late Start Time</DialogTitle>
                            <input
                              type="time"
                              value={lateStartTime}
                              onChange={(e) => setLateStartTime(e.target.value)}
                              className="border rounded p-2"
                            />
                            <Button
                              variant="linkHover1"
                              onClick={() => {
                                const formattedTime = new Date(`1970-01-01T${lateStartTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                updateScheduleStatus(
                                  calendarEvent.employee_id,
                                  calendarEvent.schedule_date,
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
  }, [breakRoomDuty, role, updateScheduleStatus, formatTime, dialogOpen, lateStartTime]);

  // Add this helper function at the end of your component or in a separate utils file
  const isSameDayOfYear = (date1: Date, date2: Date) => {
    return (
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  if (calendarLoading || breakRoomDutyLoading) {
    return <div>Loading...</div>;
  }

  if (calendarError) {
    return <div>Error loading calendar data</div>;
  }

  return (
    <RoleBasedWrapper
      allowedRoles={["gunsmith", "user", "auditor", "admin", "super admin"]}
    >
      <div className="flex flex-col items-center space-y-4 p-4">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={title} />
        </h1>
        <div className="w-full max-w-7xl">
          
            <div className="flex justify-between items-center mb-4">
            
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gooeyLeft">Request Time Off</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>Request Time Off</DialogTitle>
            <TimeoffForm onSubmitSuccess={() => handleDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        {(role === "admin" || role === "super admin") && (
        <ShiftFilter onSelect={handleShiftFilter}/>
      )}
          </div>
          
          <Card className="flex-1 flex flex-col h-full w-full max-w-7xl">
            <CardContent className="h-full flex flex-col">
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
              <div className="overflow-hidden">
                <div className="overflow-hidden">
                  <Table
                    className={`w-full ${
                      selectedDay ? "max-w-sm mr-auto" : ""
                    }`}
                  >
                    <TableHeader className="sticky top-0 z-5 bg-background">
                      <TableRow>
                        <TableHead className="w-20 max-w-sm bg-background sticky left-0 z-5">
                          Employee
                        </TableHead>
                        {daysOfWeek.map((day) => (
                          <TableHead
                            key={day}
                            className={`w-20 max-w-sm text-left ${
                              selectedDay === day ? "bg-muted" : ""
                            } ${
                              role === "admin" ||
                              role === "super admin" ||
                              role === "user"
                                ? "hover:bg-muted cursor-pointer"
                                : ""
                            } ${
                              selectedDay && day !== selectedDay ? "hidden" : ""
                            }`}
                            onClick={() => handleDayClick(day)}
                          >
                            {day}
                            <br />
                            {weekDates[day]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <ScrollArea
                  className={classNames(
                    styles.noScroll,
                    "h-[calc(100vh-350px)] overflow-hidden"
                  )}
                >
                  <div
                    className={`overflow-hidden ${
                      selectedDay ? "max-w-sm mr-auto" : ""
                    }`}
                  >
                    <Table
                      className={`overflow-hidden w-full ${
                        selectedDay ? "max-w-sm" : ""
                      }`}
                    >
                      <TableBody>
                        {sortedFilteredCalendarData.length > 0 ? (
                          sortedFilteredCalendarData.map((employee) => renderEmployeeRow(employee))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8}>No schedules found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <ScrollBar orientation="vertical" />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}