"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
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
import { Card, CardContent } from "@/components/ui/card"; // Import Card components
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const title = "TGR Crew Calendar";

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status?: string;
}

interface EmployeeCalendar {
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
  const role = useRole();

  const fetchCalendarData = useCallback(async (): Promise<
    EmployeeCalendar[]
  > => {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_date: startOfWeek.toISOString(),
          end_date: endOfWeek.toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: EmployeeCalendar[] = await response.json();

      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      });

      const datesMap = daysOfWeek.reduce((acc, day, index) => {
        acc[day] = dates[index];
        return acc;
      }, {} as { [key: string]: string });

      setWeekDates(datesMap);
      return data;
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

      // Map employee names to their ranks
      const employeeRanks = employeeData.reduce((acc, employee) => {
        acc[employee.name] = employee.rank;
        return acc;
      }, {} as { [key: string]: number });

      // Sort calendar data based on employee ranks
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
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(" ", "");
  };

  const renderEmployeeRow = (employee: EmployeeCalendar) => {
    const eventsByDay: { [key: string]: CalendarEvent[] } = {};
    daysOfWeek.forEach((day) => {
      eventsByDay[day] = employee.events.filter(
        (event) => event.day_of_week === day
      );
    });

    return (
      <TableRow key={employee.name}>
        <TableCell className="font-medium">{employee.name}</TableCell>
        {daysOfWeek.map((day) => (
          <TableCell key={day} className="text-left">
            {eventsByDay[day].map((event, index) => {
              if (event.status === "time_off") {
                return (
                  <div
                    key={index}
                    className="text-purple-500 dark:text-purple-400"
                  >
                    Approved Time Off
                  </div>
                );
              } else if (event.status === "called_out") {
                return (
                  <div key={index} className="text-red-500 dark:text-red-400">
                    Called Out
                  </div>
                );
              } else if (event.status === "left_early") {
                return (
                  <div
                    key={index}
                    className="text-orange-500 dark:text-orange-400"
                  >
                    Left Early
                  </div>
                );
              } else if (event.status && event.status.startsWith("Custom:")) {
                return (
                  <div
                    key={index}
                    className="text-green-500 dark:text-green-400"
                  >
                    {event.status.replace("Custom: ", "")}
                  </div>
                );
              }

              if (event.start_time === null || event.end_time === null) {
                return (
                  <div key={index} className="text-gray-800 dark:text-gray-300">
                    Off
                  </div>
                );
              }

              const [startHours, startMinutes] = event.start_time.split(":");
              const startTime = new Date();
              startTime.setHours(Number(startHours), Number(startMinutes));
              const compareTime = new Date();
              compareTime.setHours(11, 30);
              const textColor =
                startTime <= compareTime
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-blue-500 dark:text-blue-400";
              return (
                <div key={index} className={textColor}>
                  {`${formatTime(event.start_time)}  ${formatTime(
                    event.end_time
                  )}`}
                </div>
              );
            })}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  return (
    <RoleBasedWrapper allowedRoles={["user", "admin", "super admin"]}>
      <div className="flex flex-col items-center space-y-4 p-4">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={title} />
        </h1>
        <Card className="w-full max-w-6xl">
          <CardContent>
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
            <div className="overflow-x-auto">
              {" "}
              {/* Added this div to make table horizontally scrollable */}
              <Table className="min-w-full">
                {" "}
                {/* Added min-w-full to make the table take full width */}
                <TableHeader>
                  <TableRow>
                    <TableHead />
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
                  {data.calendarData.map((employee) =>
                    renderEmployeeRow(employee)
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
}
