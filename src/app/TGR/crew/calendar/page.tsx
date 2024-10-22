"use client";

import { useCallback, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
  isFriday,
} from "date-fns";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "../../../../utils/supabase/client";
import { useRole } from "../../../../context/RoleContext";
import classNames from "classnames";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ShiftFilter } from "./ShiftFilter";

import styles from "./calendar.module.css";

// Constants
const TITLE = "TGR Team Calendar";
const TIME_ZONE = "America/Los_Angeles";
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Types
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
  hire_date: string;
  events: CalendarEvent[];
}

interface LateStartDialogProps {
  calendarEvent: CalendarEvent | null;
  onSubmit: (employeeId: number, date: string, time: string) => void;
}

type BreakRoomDuty = {
  employee: EmployeeCalendar;
  dutyDate: Date;
} | null;

// Utility functions
const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  return new Date(start.setDate(diff));
};

const formatTime = (time: string | null) => {
  if (!time || isNaN(Date.parse(`1970-01-01T${time}`))) return "N/A";
  return formatTZ(
    toZonedTime(new Date(`1970-01-01T${time}`), TIME_ZONE),
    "hh:mma",
    { timeZone: TIME_ZONE }
  );
};

const isSameDayOfYear = (date1: Date, date2: Date) => {
  return (
    date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()
  );
};

// API functions
const fetchCalendarData = async (
  currentDate: Date
): Promise<EmployeeCalendar[]> => {
  const startOfWeekDate = toZonedTime(getStartOfWeek(currentDate), TIME_ZONE);
  const endOfWeek = new Date(startOfWeekDate);
  endOfWeek.setDate(startOfWeekDate.getDate() + 6);

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
        employees:employee_id (name, birthday, department, rank, hire_date)
      `
      )
      .gte(
        "schedule_date",
        formatTZ(startOfWeekDate, "yyyy-MM-dd", { timeZone: TIME_ZONE })
      )
      .lte(
        "schedule_date",
        formatTZ(endOfWeek, "yyyy-MM-dd", { timeZone: TIME_ZONE })
      );

    if (error) throw error;

    const groupedData: { [key: number]: EmployeeCalendar } = {};

    data.forEach((item: any) => {
      if (!groupedData[item.employee_id]) {
        groupedData[item.employee_id] = {
          employee_id: item.employee_id,
          name: item.employees.name,
          department: item.employees.department,
          rank: item.employees.rank,
          hire_date: item.employees.hire_date,
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
  } catch (error) {
    console.error("Failed to fetch calendar data:", (error as Error).message);
    return [];
  }
};

const getBreakRoomDutyEmployee = async (
  employees: EmployeeCalendar[],
  currentWeekStart: Date
): Promise<BreakRoomDuty> => {
  const formattedWeekStart = format(currentWeekStart, "yyyy-MM-dd");

  try {
    const { data: existingDuty, error: existingDutyError } = await supabase
      .from("break_room_duty")
      .select("*")
      .eq("week_start", formattedWeekStart);

    if (existingDutyError) throw existingDutyError;

    if (existingDuty && existingDuty.length > 0) {
      const employee = employees.find(
        (emp) => emp.employee_id === existingDuty[0].employee_id
      );
      return employee
        ? { employee, dutyDate: parseISO(existingDuty[0].duty_date) }
        : null;
    }

    const salesEmployees = employees
      .filter((emp) => emp.department === "Sales")
      .sort((a, b) => a.rank - b.rank);

    if (salesEmployees.length === 0) return null;

    const { data: lastAssignment, error: lastAssignmentError } = await supabase
      .from("break_room_duty")
      .select("employee_id")
      .order("week_start", { ascending: false })
      .limit(1);

    if (lastAssignmentError) throw lastAssignmentError;

    let nextEmployeeIndex = 0;
    if (lastAssignment && lastAssignment.length > 0) {
      const lastIndex = salesEmployees.findIndex(
        (emp) => emp.employee_id === lastAssignment[0].employee_id
      );
      nextEmployeeIndex = (lastIndex + 1) % salesEmployees.length;
    }

    const selectedEmployee = salesEmployees[nextEmployeeIndex];

    const daysToCheck = ["Friday"];
    let dutyDate = null;

    for (const day of daysToCheck) {
      const dayIndex = DAYS_OF_WEEK.indexOf(day);
      const checkDate = addDays(currentWeekStart, dayIndex);
      const formattedDate = format(checkDate, "yyyy-MM-dd");

      const { data: schedules, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("employee_id", selectedEmployee.employee_id)
        .eq("schedule_date", formattedDate)
        .in("status", ["scheduled", "added_day"]);

      if (error) throw error;

      if (schedules && schedules.length > 0) {
        dutyDate = checkDate;
        break;
      }
    }

    if (!dutyDate) {
      console.error(
        "No scheduled work day found for the selected employee on Friday this week"
      );
      return null;
    }

    const { error: insertError } = await supabase
      .from("break_room_duty")
      .insert({
        week_start: formattedWeekStart,
        employee_id: selectedEmployee.employee_id,
        duty_date: format(dutyDate, "yyyy-MM-dd"),
      });

    if (insertError) throw insertError;

    return { employee: selectedEmployee, dutyDate };
  } catch (error) {
    console.error("Error in getBreakRoomDutyEmployee:", error);
    return null;
  }
};

// Component
export default function Component() {
  const role = useRole().role;
  const queryClient = useQueryClient();

  // Queries
  const lateStartDataQuery = useQuery({
    queryKey: ["lateStartData"],
    queryFn: () => ({
      hour: "",
      minute: "",
      period: "AM",
      employeeId: null as number | null,
    }),
    staleTime: Infinity,
    initialData: {
      // Add this
      hour: "",
      minute: "",
      period: "AM",
      employeeId: null,
    },
  });

  const lateStartHourQuery = useQuery({
    queryKey: ["lateStartHour"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const lateStartMinuteQuery = useQuery({
    queryKey: ["lateStartMinute"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const lateStartPeriodQuery = useQuery({
    queryKey: ["lateStartPeriod"],
    queryFn: () => "AM",
    staleTime: Infinity,
  });

  const openDialogIdQuery = useQuery({
    queryKey: ["openDialogId"],
    queryFn: () => null as number | null,
    staleTime: Infinity,
  });

  const currentDateQuery = useQuery({
    queryKey: ["currentDate"],
    queryFn: () => new Date(),
    staleTime: Infinity,
  });

  const selectedDayQuery = useQuery({
    queryKey: ["selectedDay"],
    queryFn: () => null as string | null,
    staleTime: Infinity,
  });

  const selectedShiftsQuery = useQuery({
    queryKey: ["selectedShifts"],
    queryFn: () => [] as string[],
    staleTime: Infinity,
  });

  const customStatusQuery = useQuery({
    queryKey: ["customStatus"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const dialogOpenQuery = useQuery({
    queryKey: ["dialogOpen"],
    queryFn: () => false,
    staleTime: Infinity,
  });

  const currentEventQuery = useQuery({
    queryKey: ["currentEvent"],
    queryFn: () => null as CalendarEvent | null,
    staleTime: Infinity,
  });

  const lateStartTimeQuery = useQuery({
    queryKey: ["lateStartTime"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const calendarDataQuery = useQuery({
    queryKey: ["calendarData", currentDateQuery.data],
    queryFn: () => fetchCalendarData(currentDateQuery.data!),
    enabled: !!currentDateQuery.data,
  });

  const timeOffDialogOpenQuery = useQuery({
    queryKey: ["timeOffDialogOpen"],
    queryFn: () => false,
    staleTime: Infinity,
  });

  const isSubmittingQuery = useQuery({
    queryKey: ["isSubmitting"],
    queryFn: () => false,
    staleTime: Infinity,
  });

  const breakRoomDutyQuery = useQuery<BreakRoomDuty, Error>({
    queryKey: [
      "breakRoomDuty",
      currentDateQuery.data
        ? format(startOfWeek(currentDateQuery.data), "yyyy-MM-dd")
        : "invalid",
    ],
    queryFn: () => {
      if (!currentDateQuery.data || !(currentDateQuery.data instanceof Date)) {
        throw new Error("Invalid current date");
      }
      return getBreakRoomDutyEmployee(
        calendarDataQuery.data || [],
        startOfWeek(currentDateQuery.data)
      );
    },
    enabled:
      !!calendarDataQuery.data &&
      !!currentDateQuery.data &&
      currentDateQuery.data instanceof Date,
  });

  // Mutations
  const updateLateStartDataMutation = useMutation({
    mutationFn: (data: Partial<typeof lateStartDataQuery.data>) =>
      Promise.resolve(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["lateStartData"] });
      const previousData = queryClient.getQueryData(["lateStartData"]);
      queryClient.setQueryData(["lateStartData"], (old: any) => ({
        ...old,
        ...newData,
      }));
      return { previousData };
    },
    onError: (err, newData, context: any) => {
      queryClient.setQueryData(["lateStartData"], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lateStartData"] });
    },
  });

  const updateLateStartHourMutation = useMutation({
    mutationFn: (hour: string) => Promise.resolve(hour),
    onSuccess: (hour) => {
      queryClient.setQueryData(["lateStartHour"], hour);
    },
  });

  const updateLateStartMinuteMutation = useMutation({
    mutationFn: (minute: string) => Promise.resolve(minute),
    onSuccess: (minute) => {
      queryClient.setQueryData(["lateStartMinute"], minute);
    },
  });

  const updateLateStartPeriodMutation = useMutation({
    mutationFn: (period: string) => Promise.resolve(period),
    onSuccess: (period) => {
      queryClient.setQueryData(["lateStartPeriod"], period);
    },
  });

  const updateOpenDialogIdMutation = useMutation({
    mutationFn: (id: number | null) => Promise.resolve(id),
    onSuccess: (id) => {
      queryClient.setQueryData(["openDialogId"], id);
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["calendarData"] });
    },
  });

  const updateCurrentDateMutation = useMutation({
    mutationFn: (newDate: Date) => Promise.resolve(newDate),
    onSuccess: (newDate) => {
      queryClient.setQueryData(["currentDate"], newDate);
    },
  });

  const updateSelectedDayMutation = useMutation({
    mutationFn: (newDay: string | null) => Promise.resolve(newDay),
    onSuccess: (newDay) => {
      queryClient.setQueryData(["selectedDay"], newDay);
    },
  });

  const updateSelectedShiftsMutation = useMutation({
    mutationFn: (newShifts: string[]) => Promise.resolve(newShifts),
    onSuccess: (newShifts) => {
      queryClient.setQueryData(["selectedShifts"], newShifts);
    },
  });

  const updateDialogOpenMutation = useMutation({
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
    onSuccess: (isOpen) => {
      queryClient.setQueryData(["dialogOpen"], isOpen);
    },
  });

  const updateCurrentEventMutation = useMutation({
    mutationFn: (event: CalendarEvent | null) => Promise.resolve(event),
    onSuccess: (event) => {
      queryClient.setQueryData(["currentEvent"], event);
    },
  });

  const updateLateStartTimeMutation = useMutation({
    mutationFn: (time: string) => Promise.resolve(time),
    onSuccess: (time) => {
      queryClient.setQueryData(["lateStartTime"], time);
    },
  });

  const updateIsSubmittingMutation = useMutation({
    mutationFn: (isSubmitting: boolean) => Promise.resolve(isSubmitting),
    onSuccess: (isSubmitting) => {
      queryClient.setQueryData(["isSubmitting"], isSubmitting);
    },
  });

  // Callbacks
  const handleDialogOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        updateIsSubmittingMutation.mutate(false);
      }
      queryClient.setQueryData(["timeOffDialogOpen"], open);
    },
    [queryClient, updateIsSubmittingMutation]
  );

  const handleSubmitSuccess = useCallback(() => {
    updateIsSubmittingMutation.mutate(false);
    handleDialogOpen(false);
  }, [handleDialogOpen]);

  const handleDayClick = useCallback(
    (day: string) => {
      if (role && ["admin", "super admin", "user", "dev"].includes(role)) {
        updateSelectedDayMutation.mutate(
          selectedDayQuery.data === day ? null : day
        );
      }
    },
    [role, selectedDayQuery.data, updateSelectedDayMutation]
  );

  const handleShiftFilter = useCallback(
    (shifts: string[]) => {
      updateSelectedShiftsMutation.mutate(shifts);
    },
    [updateSelectedShiftsMutation]
  );

  const handlePreviousWeek = useCallback(() => {
    if (currentDateQuery.data) {
      const newDate = new Date(currentDateQuery.data);
      newDate.setDate(newDate.getDate() - 7);
      updateCurrentDateMutation.mutate(newDate);
    }
  }, [currentDateQuery.data, updateCurrentDateMutation]);

  const handleNextWeek = useCallback(() => {
    if (currentDateQuery.data) {
      const newDate = new Date(currentDateQuery.data);
      newDate.setDate(newDate.getDate() + 7);
      updateCurrentDateMutation.mutate(newDate);
    }
  }, [currentDateQuery.data, updateCurrentDateMutation]);

  // Memoized values
  const weekDates = useMemo(() => {
    if (!currentDateQuery.data) return {};
    const startOfWeekDate = getStartOfWeek(currentDateQuery.data);
    const weekDatesTemp: { [key: string]: string } = {};
    DAYS_OF_WEEK.forEach((day, index) => {
      const date = new Date(startOfWeekDate);
      date.setDate(startOfWeekDate.getDate() + index);
      weekDatesTemp[day] = `${date.getMonth() + 1}/${date.getDate()}`;
    });
    return weekDatesTemp;
  }, [currentDateQuery.data]);

  const filteredCalendarData = useMemo(() => {
    if (!calendarDataQuery.data) return [];
    return calendarDataQuery.data
      .map((employee) => ({
        ...employee,
        events: employee.events.filter((event) => {
          if (
            selectedDayQuery.data &&
            event.day_of_week !== selectedDayQuery.data
          )
            return false;
          if (selectedShiftsQuery.data && selectedShiftsQuery.data.length > 0) {
            const startTime = event.start_time
              ? new Date(`1970-01-01T${event.start_time}`)
              : null;
            if (!startTime) return false;
            const time = startTime.getHours() + startTime.getMinutes() / 60;
            return (
              (selectedShiftsQuery.data &&
                selectedShiftsQuery.data.includes("morning") &&
                time < 10) ||
              (selectedShiftsQuery.data &&
                selectedShiftsQuery.data.includes("mid") &&
                time >= 10 &&
                time < 11.5) ||
              (selectedShiftsQuery.data &&
                selectedShiftsQuery.data.includes("closing") &&
                time >= 11.5)
            );
          }
          return true;
        }),
      }))
      .filter((employee) => employee.events.length > 0);
  }, [calendarDataQuery.data, selectedDayQuery.data, selectedShiftsQuery.data]);

  const sortedFilteredCalendarData = useMemo(() => {
    return [...filteredCalendarData].sort((a, b) => a.rank - b.rank);
  }, [filteredCalendarData]);

  const updateScheduleStatus = useCallback(
    (
      employee_id: number,
      schedule_date: string,
      status: string,
      start_time?: string,
      end_time?: string
    ) => {
      updateStatusMutation.mutate({
        employee_id,
        schedule_date,
        status,
        start_time,
        end_time,
      });
    },
    [updateStatusMutation]
  );

  // Render functions
  const renderEmployeeRow = useCallback(
    (employee: EmployeeCalendar) => {
      const eventsByDay: { [key: string]: CalendarEvent[] } = {};
      DAYS_OF_WEEK.forEach((day) => {
        eventsByDay[day] = employee.events.filter(
          (calendarEvent) => calendarEvent.day_of_week === day
        );
      });

      return (
        <TableRow key={employee.employee_id}>
          <TableCell className="font-medium w-20 sticky max-w-sm left-0 z-5 bg-background">
            {employee.name}
          </TableCell>
          {DAYS_OF_WEEK.map((day) => (
            <TableCell
              key={day}
              className={`text-left relative group w-20 max-w-sm ${
                selectedDayQuery.data && day !== selectedDayQuery.data
                  ? "hidden"
                  : ""
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
                  {employee.hire_date &&
                  isSameDayOfYear(
                    parseISO(calendarEvent.schedule_date),
                    parseISO(employee.hire_date)
                  ) ? (
                    <div className="text-indigo-500 dark:text-indigo-400 font-bold">
                      Work Anniversary!
                    </div>
                  ) : null}
                  {breakRoomDutyQuery.data &&
                  breakRoomDutyQuery.data.employee.employee_id ===
                    employee.employee_id &&
                  isSameDay(
                    parseISO(calendarEvent.schedule_date),
                    breakRoomDutyQuery.data.dutyDate
                  ) &&
                  (calendarEvent.status === "scheduled" ||
                    calendarEvent.status === "added_day") ? (
                    <div className="text-pink-600 font-bold">
                      Break Room Duty 🧹
                      {!isFriday(breakRoomDutyQuery.data.dutyDate) &&
                        " (Rescheduled)"}
                    </div>
                  ) : null}
                  {renderEventStatus(calendarEvent)}
                  {renderAdminControls(calendarEvent, employee)}
                </div>
              ))}
            </TableCell>
          ))}
        </TableRow>
      );
    },
    [breakRoomDutyQuery.data, selectedDayQuery.data]
  );

  const renderEventStatus = useCallback((calendarEvent: CalendarEvent) => {
    if (calendarEvent.status === "added_day") {
      return (
        <div className="text-pink-500 dark:text-pink-300">
          {formatTime(calendarEvent.start_time)}-
          {formatTime(calendarEvent.end_time)}
        </div>
      );
    } else if (calendarEvent.start_time && calendarEvent.end_time) {
      switch (calendarEvent.status) {
        case "time_off":
          return (
            <div className="text-purple-600 dark:text-purple-500">
              Approved Time Off
            </div>
          );
        case "called_out":
          return (
            <div className="text-red-600 dark:text-red-600">Called Out</div>
          );
        case "left_early":
          return (
            <div className="text-orange-500 dark:text-orange-400">
              Left Early
            </div>
          );
        case "updated_shift":
          return (
            <div className="text-orange-500 dark:text-orange-400">
              {formatTime(calendarEvent.start_time)}-
              {formatTime(calendarEvent.end_time)}
            </div>
          );
        default:
          if (
            calendarEvent.status &&
            calendarEvent.status.startsWith("Custom:")
          ) {
            return (
              <div className="text-green-500 dark:text-green-400">
                {calendarEvent.status.replace("Custom:", "").trim()}
              </div>
            );
          } else if (
            calendarEvent.status &&
            calendarEvent.status.startsWith("Late Start")
          ) {
            return (
              <div className="text-red-500 dark:text-red-400">
                {calendarEvent.status}
              </div>
            );
          } else {
            return (
              <div
                className={
                  new Date(
                    `1970-01-01T${calendarEvent.start_time}`
                  ).getHours() < 12
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-blue-500 dark:text-blue-400"
                }
              >
                {formatTime(calendarEvent.start_time)}-
                {formatTime(calendarEvent.end_time)}
              </div>
            );
          }
      }
    }
    return null;
  }, []);

  const renderAdminControls = useCallback(
    (calendarEvent: CalendarEvent, employee: EmployeeCalendar) => {
      if (role && ["admin", "super admin", "dev"].includes(role)) {
        return (
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="p-4"
                      variant="linkHover2"
                      onClick={() => {
                        const now = new Date();
                        queryClient.setQueryData(["lateStartData"], {
                          hour: (now.getHours() % 12 || 12).toString(),
                          minute: now.getMinutes().toString().padStart(2, "0"),
                          period: now.getHours() >= 12 ? "PM" : "AM",
                          employeeId: calendarEvent.employee_id,
                        });
                      }}
                    >
                      Late Start
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle className="p-4">
                      Enter Late Start Time
                    </DialogTitle>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label htmlFor="hour">Hour (1-12)</Label>
                        <Input
                          type="text"
                          placeholder="Hour"
                          value={lateStartDataQuery.data?.hour ?? ""}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 2); // Allow up to 2 digits
                            const numValue = parseInt(value || "0");
                            if (numValue >= 0 && numValue <= 12) {
                              // Allow 0 temporarily while typing
                              const currentData = queryClient.getQueryData([
                                "lateStartData",
                              ]);
                              queryClient.setQueryData(["lateStartData"], {
                                ...(currentData as any),
                                employeeId: calendarEvent.employee_id,
                                hour: value,
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="minute">Minute (0-59)</Label>
                        <Input
                          type="text"
                          placeholder="Minute"
                          value={lateStartDataQuery.data?.minute ?? ""}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 2); // Allow up to 2 digits
                            const numValue = parseInt(value || "0");
                            if (numValue >= 0 && numValue <= 59) {
                              const currentData = queryClient.getQueryData([
                                "lateStartData",
                              ]);
                              queryClient.setQueryData(["lateStartData"], {
                                ...(currentData as any),
                                employeeId: calendarEvent.employee_id,
                                minute: value,
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="period">AM/PM</Label>
                        <Select
                          value={lateStartDataQuery.data?.period ?? ""}
                          onValueChange={(value) => {
                            queryClient.setQueryData(["lateStartData"], {
                              ...lateStartDataQuery.data,
                              period: value,
                            });
                          }}
                        >
                          <SelectTrigger id="period">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="linkHover1"
                        onClick={() => {
                          const { hour, minute, period } =
                            lateStartDataQuery.data || {};
                          if (hour && minute && period) {
                            const formattedTime = `${hour}:${minute} ${period}`;
                            updateScheduleStatus(
                              calendarEvent.employee_id,
                              calendarEvent.schedule_date,
                              `Late Start ${formattedTime}`
                            );
                            queryClient.setQueryData(["lateStartData"], {
                              hour: "",
                              minute: "",
                              period: "AM",
                              employeeId: null,
                            });
                          }
                        }}
                      >
                        Submit
                      </Button>
                      <DialogClose asChild>
                        <Button variant="linkHover2">Cancel</Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </PopoverContent>
            </Popover>
          </div>
        );
      }
      return null;
    },
    [
      role,
      lateStartDataQuery.data,
      updateScheduleStatus,
      queryClient, // Add this
      lateStartDataQuery,
    ]
  );

  if (
    currentDateQuery.isLoading ||
    calendarDataQuery.isLoading ||
    breakRoomDutyQuery.isLoading
  ) {
    return <div>Loading...</div>;
  }

  if (calendarDataQuery.error) {
    return (
      <div>Error loading calendar data: {calendarDataQuery.error.message}</div>
    );
  }

  if (breakRoomDutyQuery.error) {
    console.error("Error fetching break room duty:", breakRoomDutyQuery.error);
    // You can also display an error message to the user here
  }

  if (calendarDataQuery.isLoading || breakRoomDutyQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (calendarDataQuery.error) {
    return <div>Error loading calendar data</div>;
  }

  return (
    <RoleBasedWrapper
      allowedRoles={[
        "gunsmith",
        "user",
        "auditor",
        "admin",
        "super admin",
        "dev",
      ]}
    >
      <div className="flex flex-col items-center space-y-4 p-4">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={TITLE} />
        </h1>
        <div className="w-full max-w-7xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog
              open={timeOffDialogOpenQuery.data}
              onOpenChange={handleDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="gooeyLeft">Request Time Off</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Request Time Off</DialogTitle>
                <TimeoffForm onSubmitSuccess={handleSubmitSuccess} />
              </DialogContent>
            </Dialog>
            {(role === "admin" || role === "super admin" || role === "dev") && (
              <ShiftFilter onSelect={handleShiftFilter} />
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
                      selectedDayQuery.data ? "max-w-sm mr-auto" : ""
                    }`}
                  >
                    <TableHeader className="sticky top-0 z-5 bg-background">
                      <TableRow>
                        <TableHead className="w-20 max-w-sm bg-background sticky left-0 z-5">
                          Employee
                        </TableHead>
                        {DAYS_OF_WEEK.map((day) => (
                          <TableHead
                            key={day}
                            className={`w-20 max-w-sm text-left ${
                              selectedDayQuery.data === day ? "bg-muted" : ""
                            } ${
                              role &&
                              ["admin", "super admin", "dev", "user"].includes(
                                role
                              )
                                ? "hover:bg-muted cursor-pointer"
                                : ""
                            } ${
                              selectedDayQuery.data &&
                              day !== selectedDayQuery.data
                                ? "hidden"
                                : ""
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
                      selectedDayQuery.data ? "max-w-sm mr-auto" : ""
                    }`}
                  >
                    <Table
                      className={`overflow-hidden w-full ${
                        selectedDayQuery.data ? "max-w-sm" : ""
                      }`}
                    >
                      <TableBody>
                        {sortedFilteredCalendarData.length > 0 ? (
                          sortedFilteredCalendarData.map((employee) =>
                            renderEmployeeRow(employee)
                          )
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8}>
                              No schedules found
                            </TableCell>
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
