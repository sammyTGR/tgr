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
  eachDayOfInterval,
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
  DialogHeader,
} from "@/components/ui/dialog";
import TimeoffForm from "@/components/TimeoffForm";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ShiftFilter } from "./ShiftFilter";
import LoadingIndicator from "@/components/LoadingIndicator";

import { isHoliday } from "@/utils/holidays";
import styles from "./calendar.module.css";
import { HolidayManager } from "@/components/HolidayManager";

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

const formatDateWithDay = (dateString: string) => {
  const date = parseISO(dateString);
  // Ensure date is interpreted in Pacific Time
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return format(zonedDate, "EEEE, MMMM d, yyyy");
};

// Types
interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status?: string;
  employee_id: number;
  birthday?: string;
  notes?: string;
  holiday_id?: number | null;
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

interface EmailPayload {
  email: string;
  subject: string;
  templateName: string;
  templateData: {
    name: string;
    date: string;
    startTime?: string;
    status?: string;
  };
}

interface Holiday {
  id: number;
  name: string;
  date: string;
  is_full_day: boolean;
  repeat_yearly: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

type BreakRoomDuty = {
  employee: EmployeeCalendar;
  dutyDate: Date;
} | null;

type LateStartData = {
  employeeId: string;
  hour: string;
  minute: string;
  period: string;
};

const formatDateForEmail = (dateString: string) => {
  const date = parseISO(dateString);
  // Ensure date is interpreted in Pacific Time
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return format(zonedDate, "EEEE, MMMM d, yyyy");
};

const formatDateForDB = (dateString: string) => {
  const date = parseISO(dateString);
  // Ensure date is interpreted in Pacific Time
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return formatTZ(zonedDate, "yyyy-MM-dd", { timeZone: TIME_ZONE });
};

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
    "h:mma",
    { timeZone: TIME_ZONE }
  );
};

const isSameDayOfYear = (date1: Date, date2: Date) => {
  return (
    date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()
  );
};

const fetchEmployeeData = async (employee_id: number) => {
  const searchParams = new URLSearchParams({
    select: "name,contact_info",
    equals: `employee_id:${employee_id}`,
    single: "true",
  });

  const response = await fetch(`/api/fetchEmployees?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch employee data");
  }

  const employeeData = await response.json();

  if (!employeeData) {
    throw new Error("Failed to fetch employee data");
  }

  return employeeData;
};

// API functions
const fetchCalendarData = async (currentDate: Date): Promise<EmployeeCalendar[]> => {
  const startOfWeekDate = toZonedTime(getStartOfWeek(currentDate), TIME_ZONE);
  const endOfWeek = new Date(startOfWeekDate);
  endOfWeek.setDate(startOfWeekDate.getDate() + 6);

  const startDate = formatTZ(startOfWeekDate, "yyyy-MM-dd", { timeZone: TIME_ZONE });
  const endDate = formatTZ(endOfWeek, "yyyy-MM-dd", { timeZone: TIME_ZONE });

  try {
    const response = await fetch(
      `/api/schedules?startDate=${startDate}&endDate=${endDate}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const data = await response.json();
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
    console.error("Failed to fetch calendar data:", error);
    return [];
  }
};

// Add this to your existing calendar fetching logic:
const fetchCalendarDataWithHolidays = async (currentDate: Date) => {
  const startOfWeekDate = toZonedTime(getStartOfWeek(currentDate), TIME_ZONE);
  const endOfWeek = new Date(startOfWeekDate);
  endOfWeek.setDate(startOfWeekDate.getDate() + 6);

  const startDateStr = formatTZ(startOfWeekDate, "yyyy-MM-dd", {
    timeZone: TIME_ZONE,
  });
  const endDateStr = formatTZ(endOfWeek, "yyyy-MM-dd", { 
    timeZone: TIME_ZONE 
  });

  try {
    const response = await fetch(
      `/api/fetchCalendarDataWithHolidays?startDate=${startDateStr}&endDate=${endDateStr}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch calendar data');
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);
    return [];
  }
};

const getBreakRoomDutyEmployee = async (
  employees: EmployeeCalendar[],
  currentWeekStart: Date
): Promise<BreakRoomDuty | undefined> => {
  const formattedWeekStart = format(currentWeekStart, "yyyy-MM-dd");

  try {
    // Check for existing duty
    const existingDutyResponse = await fetch(
      `/api/break_room_duty?weekStart=${formattedWeekStart}`
    );

    if (!existingDutyResponse.ok) {
      throw new Error('Failed to fetch break room duty');
    }

    const existingDuty = await existingDutyResponse.json();

    if (existingDuty && existingDuty.length > 0) {
      const employee = employees.find(
        (emp) => emp.employee_id === existingDuty[0].employee_id
      );
      return employee
        ? { employee, dutyDate: parseISO(existingDuty[0].duty_date) }
        : null;
    }

    // Filter and sort sales employees
    const salesEmployees = employees
      .filter((emp) => emp.department === "Sales")
      .sort((a, b) => a.rank - b.rank);

    if (salesEmployees.length === 0) return null;

    // Get last assignment
    const lastAssignmentResponse = await fetch(
      `/api/break_room_duty?getLastAssignment=true`
    );

    if (!lastAssignmentResponse.ok) {
      throw new Error('Failed to fetch last assignment');
    }

    const lastAssignment = await lastAssignmentResponse.json();

    // Calculate next employee index
    let nextEmployeeIndex = 0;
    if (lastAssignment && lastAssignment.length > 0) {
      const lastIndex = salesEmployees.findIndex(
        (emp) => emp.employee_id === lastAssignment[0].employee_id
      );
      nextEmployeeIndex = (lastIndex + 1) % salesEmployees.length;
    }

    const selectedEmployee = salesEmployees[nextEmployeeIndex];
    const dayIndex = DAYS_OF_WEEK.indexOf("Friday");
    const checkDate = addDays(currentWeekStart, dayIndex);
    const formattedDate = format(checkDate, "yyyy-MM-dd");

    // Create new duty assignment
    const response = await fetch('/api/break_room_duty', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        week_start: formattedWeekStart,
        employee_id: selectedEmployee.employee_id,
        duty_date: formattedDate,
        checkSchedule: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error === 'Employee not scheduled for duty date') {
        console.error("No scheduled work day found for the selected employee on Friday this week");
        return null;
      }
      throw new Error('Failed to create break room duty');
    }

    return { employee: selectedEmployee, dutyDate: checkDate };

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
  const popoverOpenQuery = useQuery({
    queryKey: ["popoverOpen"],
    queryFn: () => Promise.resolve(false),
    staleTime: Infinity,
  });

  const { data: lateStartData } = useQuery({
    queryKey: ["lateStartData"],
    queryFn: () => ({ hour: "", minute: "", period: "AM", employeeId: null }),
    // This provides default values if no data is set
  });

  const lateStartDataQuery = useQuery({
    queryKey: ["lateStartData"],
    queryFn: () =>
      Promise.resolve({
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
    queryFn: () => Promise.resolve(""),
    staleTime: Infinity,
  });

  const lateStartMinuteQuery = useQuery({
    queryKey: ["lateStartMinute"],
    queryFn: () => Promise.resolve(""),
    staleTime: Infinity,
  });

  const lateStartPeriodQuery = useQuery({
    queryKey: ["lateStartPeriod"],
    queryFn: () => Promise.resolve("AM"),
    staleTime: Infinity,
  });

  const openDialogIdQuery = useQuery({
    queryKey: ["openDialogId"],
    queryFn: () => Promise.resolve(null as number | null),
    staleTime: Infinity,
  });

  const currentDateQuery = useQuery({
    queryKey: ["currentDate"],
    queryFn: () => Promise.resolve(new Date()),
    staleTime: Infinity,
  });

  const selectedDayQuery = useQuery({
    queryKey: ["selectedDay"],
    queryFn: () => Promise.resolve(null as string | null),
    staleTime: Infinity,
  });

  const selectedShiftsQuery = useQuery({
    queryKey: ["selectedShifts"],
    queryFn: () => Promise.resolve([] as string[]),
    staleTime: Infinity,
  });

  const customStatusQuery = useQuery({
    queryKey: ["customStatus"],
    queryFn: () => Promise.resolve(""),
    staleTime: Infinity,
  });

  const dialogOpenQuery = useQuery({
    queryKey: ["dialogOpen"],
    queryFn: () => Promise.resolve(false),
    staleTime: Infinity,
  });

  const currentEventQuery = useQuery({
    queryKey: ["currentEvent"],
    queryFn: () => Promise.resolve(null as CalendarEvent | null),
    staleTime: Infinity,
  });

  const lateStartTimeQuery = useQuery({
    queryKey: ["lateStartTime"],
    queryFn: () => Promise.resolve(""),
    staleTime: Infinity,
  });

  const calendarDataQuery = useQuery({
    queryKey: ["calendarData", currentDateQuery.data],
    queryFn: () => fetchCalendarData(currentDateQuery.data!),
    enabled: !!currentDateQuery.data,
  });

  const timeOffDialogOpenQuery = useQuery({
    queryKey: ["timeOffDialogOpen"],
    queryFn: () => Promise.resolve(false),
    staleTime: Infinity,
  });

  const isSubmittingQuery = useQuery({
    queryKey: ["isSubmitting"],
    queryFn: () => Promise.resolve(false),
    staleTime: Infinity,
  });

  const breakRoomDutyQuery = useQuery<BreakRoomDuty, Error>({
    queryKey: [
      "breakRoomDuty",
      currentDateQuery.data
        ? format(startOfWeek(currentDateQuery.data), "yyyy-MM-dd")
        : "invalid",
    ],
    queryFn: async () => {
      if (!currentDateQuery.data || !(currentDateQuery.data instanceof Date)) {
        return null;
      }
  
      const formattedWeekStart = format(
        startOfWeek(currentDateQuery.data),
        "yyyy-MM-dd"
      );
  
      // First check for existing duty
      const existingDutyResponse = await fetch(
        `/api/break_room_duty?weekStart=${formattedWeekStart}`
      );
  
      if (!existingDutyResponse.ok) {
        const error = await existingDutyResponse.json();
        throw new Error(error.error || 'Failed to fetch break room duty');
      }
  
      const existingDuty = await existingDutyResponse.json();
  
      if (existingDuty && existingDuty.length > 0) {
        const employee = calendarDataQuery.data?.find(
          (emp) => emp.employee_id === existingDuty[0].employee_id
        );
        return employee
          ? { employee, dutyDate: parseISO(existingDuty[0].duty_date) }
          : null;
      }
  
      // If no existing duty, process sales employees
      const salesEmployees = (calendarDataQuery.data || [])
        .filter((emp) => emp.department === "Sales")
        .sort((a, b) => a.rank - b.rank);
  
      if (salesEmployees.length === 0) return null;
  
      // Get last assignment
      const lastAssignmentResponse = await fetch(
        `/api/break_room_duty?getLastAssignment=true`
      );
  
      if (!lastAssignmentResponse.ok) {
        const error = await lastAssignmentResponse.json();
        throw new Error(error.error || 'Failed to fetch last assignment');
      }
  
      const lastAssignment = await lastAssignmentResponse.json();
  
      // Calculate next employee index
      let nextEmployeeIndex = 0;
      if (lastAssignment && lastAssignment.length > 0) {
        const lastIndex = salesEmployees.findIndex(
          (emp) => emp.employee_id === lastAssignment[0].employee_id
        );
        nextEmployeeIndex = (lastIndex + 1) % salesEmployees.length;
      }
  
      const selectedEmployee = salesEmployees[nextEmployeeIndex];
      const dayIndex = DAYS_OF_WEEK.indexOf("Friday");
      const checkDate = addDays(startOfWeek(currentDateQuery.data), dayIndex);
      const formattedDate = format(checkDate, "yyyy-MM-dd");
  
      // Create new duty assignment
      const response = await fetch('/api/break_room_duty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week_start: formattedWeekStart,
          employee_id: selectedEmployee.employee_id,
          duty_date: formattedDate,
          checkSchedule: true,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        if (error.error === 'Employee not scheduled for duty date') {
          console.error("No scheduled work day found for the selected employee on Friday this week");
          return null;
        }
        throw new Error(error.error || 'Failed to create break room duty');
      }
  
      return { employee: selectedEmployee, dutyDate: checkDate };
    },
    enabled:
      !!calendarDataQuery.data &&
      !!currentDateQuery.data &&
      currentDateQuery.data instanceof Date,
  });

  // Mutations
  const updatePopoverOpenMutation = useMutation({
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
    onSuccess: (isOpen) => {
      queryClient.setQueryData(["popoverOpen"], isOpen);
    },
  });

  const updateLateStartData = useMutation({
    mutationFn: (newData: Partial<typeof lateStartData>) => {
      // Here you would typically update the data on the server
      // For now, we'll just return the new data
      return Promise.resolve(newData);
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(["lateStartData"], (oldData: any) => ({
        ...oldData,
        ...newData,
      }));
    },
  });

  const updateLateStartDataMutation = useMutation({
    mutationFn: (data: Partial<typeof lateStartDataQuery.data>) =>
      Promise.resolve(data),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["lateStartData"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["lateStartData"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["lateStartData"], (old: any) => ({
        ...old,
        ...newData,
      }));

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, newData, context: any) => {
      // If the mutation fails, roll back to the previous value
      queryClient.setQueryData(["lateStartData"], context.previousData);
    },
    onSettled: () => {
      // Always refetch after error or success
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

  const insertBreakRoomDutyMutation = useMutation({
    mutationFn: (data: {
      week_start: string;
      employee_id: number;
      duty_date: string;
    }) => {
      return Promise.resolve(
        supabase
          .from("break_room_duty")
          .insert(data)
          .then(({ error }) => {
            if (error) throw error;
            return data;
          })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["breakRoomDuty"] });
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

  const handleInputChange = (
    field: keyof typeof lateStartData,
    value: string
  ) => {
    updateLateStartData.mutate({ [field]: value });
  };

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
      .filter(
        (employee) => employee.rank !== null && employee.rank !== undefined
      ) // Add this line to filter out employees without rank
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      employee_id,
      schedule_date,
      status,
    }: {
      employee_id: number;
      schedule_date: string;
      status: string;
    }) => {
      try {
        // First, get employee data for email
        const employeeData = await fetchEmployeeData(employee_id);
        if (!employeeData) {
          throw new Error("Failed to fetch employee data");
        }

        // Update schedule status
        const scheduleResponse = await fetch("/api/update_schedule_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id,
            schedule_date,
            status,
          }),
        });

        if (!scheduleResponse.ok) {
          throw new Error("Failed to update schedule status");
        }

        // Prepare email payload
        let emailPayload: EmailPayload = {
          email: employeeData.contact_info,
          subject: "",
          templateName: "",
          templateData: {
            name: employeeData.name,
            date: formatDateWithDay(schedule_date),
          },
        };

        // Set email template and subject based on status
        if (status.startsWith("Late Start")) {
          emailPayload = {
            ...emailPayload,
            subject: "Late Start Notification",
            templateName: "LateStart",
            templateData: {
              ...emailPayload.templateData,
              startTime: status.split("Late Start ")[1],
            },
          };
        } else if (status === "called_out") {
          emailPayload = {
            ...emailPayload,
            subject: "Called Out Confirmation",
            templateName: "CalledOut",
          };
        } else if (status === "left_early") {
          emailPayload = {
            ...emailPayload,
            subject: "Left Early Notification",
            templateName: "LeftEarly",
          };
        } else if (status.startsWith("Custom:")) {
          emailPayload = {
            ...emailPayload,
            subject: "Schedule Update",
            templateName: "CustomStatus",
            templateData: {
              ...emailPayload.templateData,
              status: status.replace("Custom:", "").trim(),
            },
          };
        }

        // Send email
        const emailResponse = await fetch("/api/send_email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
          throw new Error("Failed to send email notification");
        }

        return { success: true };
      } catch (error) {
        console.error("Error in updateStatusMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarData"] });
      updatePopoverOpenMutation.mutate(false);
    },
    onError: (error) => {
      console.error("Failed to update status and send email:", error);
      // Handle error appropriately
    },
  });

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
          {/* Employee Name Column */}
          <TableCell className="text-left font-medium w-22 sticky max-w-sm z-5 bg-background">
            {employee.name}
          </TableCell>
          {/* Days of the Week Columns */}
          {DAYS_OF_WEEK.map((day) => (
            <TableCell
              key={day}
              className={`text-left relative group w-22 max-w-sm ${
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
                      {!isFriday(breakRoomDutyQuery.data.dutyDate) && ""}
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
    } else if (calendarEvent.status === "holiday") {
      return (
        <div className="text-pink-600 dark:text-pink-500 font-bold">
          {calendarEvent.notes || "Holiday Closure"}
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
                  onClick={() => {
                    updateStatusMutation.mutate({
                      employee_id: calendarEvent.employee_id,
                      schedule_date: calendarEvent.schedule_date,
                      status: "called_out",
                    });
                  }}
                >
                  Called Out
                </Button>
                <Button
                  variant="linkHover2"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      employee_id: calendarEvent.employee_id,
                      schedule_date: calendarEvent.schedule_date,
                      status: "left_early",
                    });
                  }}
                >
                  Left Early
                </Button>
                <Button
                  variant="linkHover2"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      employee_id: calendarEvent.employee_id,
                      schedule_date: calendarEvent.schedule_date,
                      status: "Custom:Off",
                    });
                  }}
                >
                  Off
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="p-4"
                      variant="linkHover2"
                      onClick={() => {
                        queryClient.setQueryData(["lateStartData"], {
                          hour: "",
                          minute: "",
                          period: "AM",
                          employeeId: calendarEvent.employee_id,
                        });
                        updatePopoverOpenMutation.mutate(false);
                      }}
                    >
                      Late Start
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="p-4">
                        Enter Late Start Time
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label>Hour</Label>
                        <Input
                          type="text"
                          placeholder="HH"
                          maxLength={2}
                          onChange={(e) => {
                            const value = e.target.value;
                            const currentData =
                              queryClient.getQueryData(["lateStartData"]) || {};
                            queryClient.setQueryData(["lateStartData"], {
                              ...currentData,
                              hour: value,
                              employeeId: calendarEvent.employee_id,
                            });
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Minute</Label>
                        <Input
                          type="text"
                          placeholder="MM"
                          maxLength={2}
                          onChange={(e) => {
                            const value = e.target.value;
                            const currentData =
                              queryClient.getQueryData(["lateStartData"]) || {};
                            queryClient.setQueryData(["lateStartData"], {
                              ...currentData,
                              minute: value,
                              employeeId: calendarEvent.employee_id,
                            });
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Label>AM/PM</Label>
                        <Select
                          defaultValue="AM"
                          onValueChange={(value) => {
                            const currentData =
                              queryClient.getQueryData(["lateStartData"]) || {};
                            queryClient.setQueryData(["lateStartData"], {
                              ...currentData,
                              period: value,
                              employeeId: calendarEvent.employee_id,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <DialogClose asChild>
                        <Button
                          onClick={() => {
                            const data = queryClient.getQueryData([
                              "lateStartData",
                            ]) as any;
                            if (data?.hour && data?.minute && data?.period) {
                              const formattedTime = `${data.hour}:${data.minute} ${data.period}`;
                              updateStatusMutation.mutate({
                                employee_id: calendarEvent.employee_id,
                                schedule_date: calendarEvent.schedule_date,
                                status: `Late Start ${formattedTime}`,
                              });
                              // Reset the form
                              queryClient.setQueryData(["lateStartData"], {
                                hour: "",
                                minute: "",
                                period: "AM",
                                employeeId: null,
                              });
                              // Close both Dialog and Popover
                              updatePopoverOpenMutation.mutate(false);
                            }
                          }}
                        >
                          Submit
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Reset form on cancel
                            queryClient.setQueryData(["lateStartData"], {
                              hour: "",
                              minute: "",
                              period: "AM",
                              employeeId: null,
                            });
                          }}
                        >
                          Cancel
                        </Button>
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
    [role, lateStartDataQuery.data, updateStatusMutation, queryClient]
  );

  if (
    currentDateQuery.isLoading ||
    calendarDataQuery.isLoading ||
    breakRoomDutyQuery.isLoading
  ) {
    return <LoadingIndicator />;
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
    return <LoadingIndicator />;
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
        {(role === "admin" || role === "super admin" || role === "dev") && (
          <HolidayManager />
        )}
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
                        {/* Employee Name Header */}
                        <TableHead className="text-left w-28 max-w-sm bg-background sticky left-0 z-5">
                          Employee
                        </TableHead>
                        {/* Days of the Week Headers */}
                        {DAYS_OF_WEEK.map((day) => (
                          <TableHead
                            key={day}
                            className={`text-left w-22 max-w-sm ${
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
                            {day} {weekDates[day]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <ScrollArea
                  className={classNames(
                    styles.noScroll,
                    "h-[calc(100vh-350px)] overflow-hidden relative"
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
