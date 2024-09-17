"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
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
} from "@radix-ui/react-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import styles from "./calendar.module.css"; // Create this CSS module file
import classNames from "classnames";
import { ShiftFilter } from "./ShiftFilter";

const title = "TGR Crew Calendar";
const timeZone = "America/Los_Angeles"; // Define your time zone

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status?: string;
  employee_id: number; // Ensure this is part of the event
}

interface EmployeeCalendar {
  employee_id: number; // Ensure this is part of the employee
  name: string;
  events: CalendarEvent[];
}

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

export default function Component() {
  const [data, setData] = useState<{
    calendarData: EmployeeCalendar[];
    employeeNames: string[];
  }>({
    calendarData: [],
    employeeNames: [],
  });
  const [weekDates, setWeekDates] = useState<{ [key: string]: string }>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const role = useRole().role; // Access the role property directly
  const [customStatus, setCustomStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const filterEventsByShiftAndDay = (events: CalendarEvent[]) => {
    return events.filter((event) => {
      // Filter by selected day if any
      if (selectedDay && event.day_of_week !== selectedDay) {
        return false;
      }

      // Filter by shift if any are selected
      if (selectedShifts.length > 0) {
        const startTime = event.start_time
          ? new Date(`1970-01-01T${event.start_time}`)
          : null;
        if (!startTime) return false;
        const hours = startTime.getHours();
        const minutes = startTime.getMinutes();
        const time = hours + minutes / 60;

        return (
          (selectedShifts.includes("morning") && time < 10) ||
          (selectedShifts.includes("mid") && time >= 10 && time < 11.5) ||
          (selectedShifts.includes("closing") && time >= 11.5)
        );
      }

      return true;
    });
  };

  const filteredCalendarData = data.calendarData
    .map((employee) => ({
      ...employee,
      events: filterEventsByShiftAndDay(employee.events),
    }))
    .filter((employee) => employee.events.length > 0);

  const handleDayClick = (day: string) => {
    if (role === "admin" || role === "super admin") {
      setSelectedDay((prevDay) => (prevDay === day ? null : day));
    }
  };

  const handleShiftFilter = (shifts: string[]) => {
    setSelectedShifts(shifts);
  };

  const fetchCalendarData = useCallback(async (): Promise<
    EmployeeCalendar[]
  > => {
    const timeZone = "America/Los_Angeles";
    const startOfWeek = toZonedTime(getStartOfWeek(currentDate), timeZone);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

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
          employees:employee_id (name)
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
            events: [],
          };
        }

        const timeZone = "America/Los_Angeles";
        groupedData[item.employee_id].events.push({
          day_of_week: item.day_of_week,
          start_time: item.start_time ? item.start_time : null,
          end_time: item.end_time ? item.end_time : null,
          schedule_date: item.schedule_date,
          status: item.status,
          employee_id: item.employee_id,
        });
      });

      return Object.values(groupedData);
    } catch (error) {
      console.error("Failed to fetch calendar data:", (error as Error).message);
      return [];
    }
  }, [currentDate]);

  useEffect(() => {
    const fetchData = async () => {
      const [calendarData, employeeData] = await Promise.all([
        fetchCalendarData(),
        fetchEmployeeNames(),
      ]);

      const employeeRanks = employeeData.reduce((acc, employee) => {
        acc[employee.name] = employee.rank;
        return acc;
      }, {} as { [key: string]: number });

      calendarData.sort(
        (a, b) => employeeRanks[a.name] - employeeRanks[b.name]
      );

      setData({ calendarData, employeeNames: employeeData.map((e) => e.name) });
    };

    fetchData();

    const timeOffSubscription = supabase
      .channel("time_off_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_off_requests" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const schedulesSubscription = supabase
      .channel("schedules")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedules" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(timeOffSubscription);
      supabase.removeChannel(schedulesSubscription);
    };
  }, [fetchCalendarData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0) {
        setCurrentDate(new Date());
      }
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDatesTemp: { [key: string]: string } = {};
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      weekDatesTemp[day] = `${date.getMonth() + 1}/${date.getDate()}`;
    });
    setWeekDates(weekDatesTemp);
  }, [currentDate]);

  const getStartOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

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

  const updateScheduleStatus = async (
    employee_id: number,
    schedule_date: string,
    status: string
  ) => {
    try {
      const formattedDate = new Date(schedule_date).toISOString().split("T")[0];
      const response = await fetch("/api/update_schedule_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id,
          schedule_date: formattedDate,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchCalendarData();
    } catch (error) {
      console.error(
        "Failed to update schedule status:",
        (error as Error).message
      );
    }
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

  const renderEmployeeRow = (employee: EmployeeCalendar) => {
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
                {calendarEvent.status === "added_day" ? (
                  <div className="text-pink-500 dark:text-pink-300">
                    {`${formatTZ(
                      toZonedTime(
                        new Date(`1970-01-01T${calendarEvent.start_time}`),
                        timeZone
                      ),
                      "h:mma",
                      { timeZone }
                    )}-${formatTZ(
                      toZonedTime(
                        new Date(`1970-01-01T${calendarEvent.end_time}`),
                        timeZone
                      ),
                      "h:mma",
                      { timeZone }
                    )}`}
                  </div>
                ) : calendarEvent.start_time && calendarEvent.end_time ? (
                  calendarEvent.status === "time_off" ? (
                    <div className="text-purple-600 dark:text-purple-500">
                      Approved Time Off
                    </div>
                  ) : calendarEvent.status === "called_out" ? (
                    <div className="text-red-500 dark:text-red-400">
                      Called Out
                    </div>
                  ) : calendarEvent.status === "left_early" ? (
                    <div className="text-orange-500 dark:text-orange-400">
                      Left Early
                    </div>
                  ) : calendarEvent.status === "updated_shift" ? (
                    <div className="text-orange-500 dark:text-orange-400">
                      {`${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${calendarEvent.start_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}-${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${calendarEvent.end_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}`}
                    </div>
                  ) : calendarEvent.status &&
                    calendarEvent.status.startsWith("Custom:") ? (
                    <div className="text-green-500 dark:text-green-400">
                      {calendarEvent.status.replace("Custom:", "").trim()}
                    </div>
                  ) : (
                    <div
                      className={
                        toZonedTime(
                          new Date(`1970-01-01T${calendarEvent.start_time}`),
                          timeZone
                        ).getHours() < 12
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-blue-500 dark:text-blue-400"
                      }
                    >
                      {`${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${calendarEvent.start_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}-${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${calendarEvent.end_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}`}
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
                              Custom Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogTitle className="p-4">
                              Enter Custom Status
                            </DialogTitle>
                            <Textarea
                              value={customStatus}
                              onChange={(e) => setCustomStatus(e.target.value)}
                              placeholder="Enter custom status"
                            />
                            <Button
                              variant="linkHover1"
                              onClick={handleCustomStatusSubmit}
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
  };

  return (
    <RoleBasedWrapper
      allowedRoles={["gunsmith", "user", "auditor", "admin", "super admin"]}
    >
      <div className="flex flex-col items-center space-y-4 p-4">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={title} />
        </h1>
        <div className="w-full max-w-7xl">
          {(role === "admin" || role === "super admin") && (
            <div className="self-start mb-2">
              <ShiftFilter onSelect={handleShiftFilter} />
            </div>
          )}
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
                              role === "admin" || role === "super admin"
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
                    "h-[calc(100vh-200px)] overflow-hidden"
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
                        {filteredCalendarData.map((employee) =>
                          renderEmployeeRow(employee)
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
