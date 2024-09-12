"use client";
import { useEffect, useState, useCallback } from "react";
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


const SchedulesComponent = ({ employeeId }: { employeeId: number }) => {
  const [data, setData] = useState<{ calendarData: any[] }>({
    calendarData: [],
  });
  const [weekDates, setWeekDates] = useState<{ [key: string]: string }>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const role = useRole().role; // Access the role property directly
  const [customStatus, setCustomStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any | null>(null);

  const fetchCalendarData = useCallback(async (): Promise<any[]> => {
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
        .eq("employee_id", employeeId)
        .gte("schedule_date", formatTZ(startOfWeek, "yyyy-MM-dd", { timeZone }))
        .lte("schedule_date", formatTZ(endOfWeek, "yyyy-MM-dd", { timeZone }));
  
      if (error) {
        throw error;
      }

      const groupedData: { [key: number]: any } = {};

      data.forEach((item: any) => {
        if (!groupedData[item.employee_id]) {
          groupedData[item.employee_id] = {
            employee_id: item.employee_id,
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
  }, [currentDate, employeeId]);

  useEffect(() => {
    const fetchData = async () => {
      const calendarData = await fetchCalendarData();
      setData({ calendarData });
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

  const renderEmployeeRow = (employee: any) => {
    const eventsByDay: { [key: string]: any[] } = {};
    daysOfWeek.forEach((day) => {
      eventsByDay[day] = employee.events.filter(
        (event: any) => event.day_of_week === day
      );
    });

    return (
      <TableRow key={employee.employee_id}>
        {daysOfWeek.map((day) => (
          <TableCell key={day} className="text-left relative group">
            {eventsByDay[day].map((event, index) => (
              <div key={index} className="relative">
                {event.status === "added_day" ? (
                  <div className="text-pink-500 dark:text-pink-300">
                    {`${formatTZ(
                      toZonedTime(
                        new Date(`1970-01-01T${event.start_time}`),
                        timeZone
                      ),
                      "h:mma",
                      { timeZone }
                    )}-${formatTZ(
                      toZonedTime(
                        new Date(`1970-01-01T${event.end_time}`),
                        timeZone
                      ),
                      "h:mma",
                      { timeZone }
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
                      {`${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${event.start_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}-${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${event.end_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}`}
                    </div>
                  ) : event.status && event.status.startsWith("Custom:") ? (
                    <div className="text-green-500 dark:text-green-400">
                      {event.status.replace("Custom:", "").trim()}
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
                      {`${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${event.start_time}`),
                          timeZone
                        ),
                        "h:mma",
                        { timeZone }
                      )}-${formatTZ(
                        toZonedTime(
                          new Date(`1970-01-01T${event.end_time}`),
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
    <div className="flex flex-col items-center space-y-4 p-4 overflow-hidden">
      {/* <Card className="flex-1 flex flex-col w-full max-w-6xl overflow-hidden">
        <CardContent className="h-full overflow-hidden"> */}
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
          {data.calendarData.map((employee) => renderEmployeeRow(employee))}
        </TableBody>
      </Table>
      {/* </CardContent>
      </Card> */}
    </div>
  );
};

export default SchedulesComponent;
