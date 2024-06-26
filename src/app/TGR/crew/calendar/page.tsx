"use client";
import { useEffect, useState, useCallback } from "react";
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

const title = "TGR Crew Calendar";

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

  const fetchCalendarData = useCallback(async (): Promise<
    EmployeeCalendar[]
  > => {
    const startOfWeek = getStartOfWeek(currentDate);
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
        employees:employee_id (
          name
        )
      `
        )
        .gte("schedule_date", startOfWeek.toISOString().split("T")[0])
        .lte("schedule_date", endOfWeek.toISOString().split("T")[0]);

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

        groupedData[item.employee_id].events.push({
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
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
        (event) => event.day_of_week === day
      );
    });

    return (
      <TableRow key={employee.employee_id}>
        <TableCell className="font-medium">{employee.name}</TableCell>
        {daysOfWeek.map((day) => (
          <TableCell key={day} className="text-left relative group">
            {eventsByDay[day].map((event, index) => (
              <div key={index} className="relative">
                {event.status === "time_off" ? (
                  <div className="text-purple-500 dark:text-purple-400">
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
                ) : event.status && event.status.startsWith("Custom:") ? (
                  <div className="text-green-500 dark:text-green-400">
                    {event.status.replace("Custom:", "").trim()}
                  </div>
                ) : event.start_time === null || event.end_time === null ? (
                  <div className="text-gray-800 dark:text-gray-300">Off</div>
                ) : (
                  <div
                    className={
                      new Date(`1970-01-01T${event.start_time}Z`) <=
                      new Date("1970-01-01T11:30:00Z")
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-blue-500 dark:text-blue-400"
                    }
                  >
                    {`${formatTime(event.start_time)} - ${formatTime(
                      event.end_time
                    )}`}
                  </div>
                )}
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
                              event.employee_id,
                              event.schedule_date,
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
                              event.employee_id,
                              event.schedule_date,
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
                              event.employee_id,
                              event.schedule_date,
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
                                setCurrentEvent(event);
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
      allowedRoles={["gunsmith", "user", "admin", "super admin"]}
    >
      <div className="flex flex-col items-center space-y-4 p-4  overflow-hidden">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={title} />
        </h1>
        <Card className="flex-1 flex flex-col w-full max-w-6xl overflow-hidden">
          <CardContent className=" h-full overflow-hidden">
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
          </CardContent>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
}
