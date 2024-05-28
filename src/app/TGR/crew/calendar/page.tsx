"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { createClient } from "@supabase/supabase-js";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import supabase from "../../../../../supabase/lib/supabaseClient";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
const title = "TGR Crew Calendar";

interface CalendarEvent {
  day_of_week: string;
  start_time: string;
  end_time: string;
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

export default function Component() {
  const [calendarData, setCalendarData] = useState<EmployeeCalendar[]>([]);
  const [weekDates, setWeekDates] = useState<{ [key: string]: string }>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [updateTrigger, setUpdateTrigger] = useState(false); // State to force re-render

  const fetchCalendarData = useCallback(async () => {
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
      const data = await response.json();
      // console.log("Fetched calendar data:", data); // Add logging
      setCalendarData(data);

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
    } catch (error: any) {
      console.error("Failed to fetch calendar data:", error.message);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, updateTrigger, fetchCalendarData]); // Add fetchCalendarData as dependency

  useEffect(() => {
    const timeOffSubscription = supabase
      .channel("time_off_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_off_requests" },
        (payload) => {
          // console.log("Time off request change received:", payload);
          fetchCalendarData(); // Fetch calendar data on time off request changes
          setUpdateTrigger((prev) => !prev); // Force re-render
        }
      )
      .subscribe();

    const schedulesSubscription = supabase
      .channel("schedules")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedules" },
        (payload) => {
          // console.log("Schedule change received:", payload);
          fetchCalendarData(); // Fetch calendar data on schedule changes
          setUpdateTrigger((prev) => !prev); // Force re-render
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(timeOffSubscription);
      supabase.removeChannel(schedulesSubscription);
    };
  }, [fetchCalendarData]); // Add fetchCalendarData as dependency

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0) {
        setCurrentDate(new Date());
      }
    }, 3600000); // Check every hour

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

  const formatTime = (time: string) => {
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
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold">
        <TextGenerateEffect words={title} />
      </h1>
      <div className="flex justify-between w-full max-w-4xl">
        <Button variant="ghost" onClick={handlePreviousWeek}>
          <ChevronLeftIcon className="h-4 w-4" />
          Previous Week
        </Button>
        <Button variant="ghost" onClick={handleNextWeek}>
          Next Week
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <Table>
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
          {calendarData.map((employee) => renderEmployeeRow(employee))}
        </TableBody>
      </Table>
    </div>
  );
}
