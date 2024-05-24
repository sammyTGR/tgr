"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import supabase from "../../../../../supabase/lib/supabaseClient";
import WithRole from "@/components/withRole"; // Import the HOC

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

function CalendarPage() {
  const [calendarData, setCalendarData] = useState<EmployeeCalendar[]>([]);
  const [weekDates, setWeekDates] = useState<{ [key: string]: string }>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [updateTrigger, setUpdateTrigger] = useState(false); // State to force re-render

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, updateTrigger]); // Add updateTrigger as dependency

  useEffect(() => {
    const timeOffSubscription = supabase
      .channel("time_off_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_off_requests" },
        (payload) => {
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
  }, []);

  const fetchCalendarData = async () => {
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
  };

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
      <div
        key={employee.name}
        className="grid grid-cols-8 items-center divide-x divide-muted dark:divide-black"
      >
        <div className="px-4 font-medium min-h-[68px] flex items-center justify-start">
          {employee.name}
        </div>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="px-4 min-h-[68px] text-md flex items-center justify-center"
          >
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 bg-background text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={title} />
        </h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handlePreviousWeek}>
            <ChevronLeftIcon className="h-4 w-4" />
            Previous Week
          </Button>
          <Button variant="outline" onClick={handleNextWeek}>
            Next Week
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="bg-muted rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-8 text-xl font-medium border-b border-muted dark:border-black">
          <div className="py-3 px-4 bg-muted text-foreground flex items-center justify-center"></div>
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="py-3 px-4 bg-muted text-foreground flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 text-md font-medium border-b border-muted dark:border-black">
          <div className="py-3 px-4 bg-muted text-foreground flex items-center justify-center text-center"></div>
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="py-3 px-4 bg-muted text-foreground flex items-center justify-center"
            >
              {weekDates[day]}
            </div>
          ))}
        </div>
        <div className="text-md font-medium divide-y divide-muted dark:divide-black justify-center text-center">
          {calendarData.map((employee) => renderEmployeeRow(employee))}
        </div>
      </div>
    </div>
  );
}

// Wrap the page with the WithRole HOC and specify allowed roles
export default function ProtectedCalendarPage() {
  return (
    <WithRole allowedRoles={['user', 'admin', 'super admin']}>
      <CalendarPage />
    </WithRole>
  );
}
