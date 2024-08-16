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
import { toZonedTime, format as formatTZ } from "date-fns-tz";

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

      // Remove this block
      /*
      const employeeResponse = await supabase
        .from("employees")
        .select("contact_info")
        .eq("employee_id", employee_id)
        .single();
  
      if (employeeResponse.error || !employeeResponse.data.contact_info) {
        throw new Error("Failed to fetch employee email");
      }
  
      const email = employeeResponse.data.contact_info;
      let subject = "Your Schedule Has Been Updated";
      let message = `Your Scheduled Shift On ${formattedDate} Has Been Changed To Reflect That You're Off For That Day. Please Contact Management Directly With Any Questions.`;
  
      if (status === "called_out") {
        subject = "You've Called Out";
        message = `Your Schedule Has Been Updated To Reflect That You Called Out For ${formattedDate}.`;
      } else if (status === "left_early") {
        subject = "You've Left Early";
        message = `Your Schedule Has Been Updated To Reflect That You Left Early On ${formattedDate}.`;
      } else if (status.startsWith("Custom:")) {
        message = `Your Time Off Request For ${formattedDate} Has Been Approved!`;
      }
  
      await sendEmail(email, subject, message);
      */

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
        <TableCell className="font-medium w-12">{employee.name}</TableCell>
        {daysOfWeek.map((day) => (
          <TableCell key={day} className="text-left relative group w-12">
            {eventsByDay[day].map((calendarEvent, index) => (
              <div key={index} className="relative">
                {calendarEvent.status === "added_day" ? (
  // Always show added_day status
  <div className="text-pink-500 dark:text-pink-300">
    {`${formatTZ(
      toZonedTime(new Date(`1970-01-01T${calendarEvent.start_time}`), timeZone),
      "h:mma",
      { timeZone }
    )}-${formatTZ(
      toZonedTime(new Date(`1970-01-01T${calendarEvent.end_time}`), timeZone),
      "h:mma",
      { timeZone }
    )}`}
  </div>
) : calendarEvent.start_time && calendarEvent.end_time ? (
  calendarEvent.status === "time_off" ? (
    <div className="text-purple-600 dark:text-purple-500">Approved Time Off</div>
  ) : calendarEvent.status === "called_out" ? (
    <div className="text-red-500 dark:text-red-400">Called Out</div>
  ) : calendarEvent.status === "left_early" ? (
    <div className="text-orange-500 dark:text-orange-400">Left Early</div>
  ) : calendarEvent.status && calendarEvent.status.startsWith("Custom:") ? (
    <div className="text-green-500 dark:text-green-400">
      {calendarEvent.status.replace("Custom:", "").trim()}
    </div>
  ) : (
    <div
      className={
        toZonedTime(new Date(`1970-01-01T${calendarEvent.start_time}`), timeZone)
          .getHours() < 12
          ? "text-amber-500 dark:text-amber-400"
          : "text-blue-500 dark:text-blue-400"
      }
    >
      {`${formatTZ(
        toZonedTime(new Date(`1970-01-01T${calendarEvent.start_time}`), timeZone),
        "h:mma",
        { timeZone }
      )}-${formatTZ(
        toZonedTime(new Date(`1970-01-01T${calendarEvent.end_time}`), timeZone),
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
      <div className="flex flex-col items-center space-y-4 p-4 overflow-hidden">
        <h1 className="text-2xl font-bold">
          <TextGenerateEffect words={title} />
        </h1>
        <Card className="flex-1 flex flex-col w-full max-w-7xl overflow-hidden">
          <CardContent className="h-full overflow-hidden">
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
                  <TableHead className="w-50" />
                  {daysOfWeek.map((day) => (
                    <TableHead key={day} className="w-32">
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
