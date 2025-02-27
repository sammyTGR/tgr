"use client";

import * as React from "react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  Row,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimesheetRowActions } from "./timesheet-row-actions";
import { TimesheetPagination } from "./TimesheetPagination";
import {
  CrossCircledIcon,
  DoubleArrowDownIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import styles from "./timesheet.module.css"; // Create this CSS module file
import classNames from "classnames";
import { formatTime } from "@/utils/time-format";
import { columns } from "./columns";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { Calendar as CalendarIcon, DownloadIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { startOfWeek, endOfWeek, addWeeks, isWithinInterval } from "date-fns";
import { formatHoursAndMinutes } from "@/utils/format-hours";
import { Updater } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import AddTimesheetForm from "./AddTimesheetForm";
import { useState, useEffect, useCallback } from "react";
import { TimesheetData } from "./data-schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Employee {
  employee_id: number;
  name: string;
  status: string;
  pay_type: string;
}

interface PayPeriodSummary {
  regularHours: number;
  overtimeHours: number;
  startDate: Date;
  endDate: Date;
}

interface ScheduleData {
  status: string;
  start_time: string;
  end_time: string;
  clockEventHours?: string;
}

interface TimesheetDataWithSchedule extends TimesheetData {
  scheduleData?: ScheduleData;
}

interface TimesheetDataTableProps {
  columns: ColumnDef<TimesheetData>[];
  data: TimesheetData[];
  fetchTimesheets: () => void;
  showDecimalHours: boolean;
  onShowDecimalHoursChange: (value: boolean) => void;
}

export function TimesheetDataTable({
  columns: providedColumns,
  data: initialData,
  fetchTimesheets,
  showDecimalHours,
  onShowDecimalHoursChange,
}: TimesheetDataTableProps) {
  const [data, setData] = React.useState(initialData);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [searchInput, setSearchInput] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "event_date", desc: true },
  ]);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [open, setOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("");
  const supabase = createClientComponentClient();
  const [isTableExpanded, setIsTableExpanded] = React.useState(false);
  const queryClient = useQueryClient();
  const [isAddCardExpanded, setIsAddCardExpanded] = React.useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  const { data: expandedState = {} } = useQuery({
    queryKey: ["timesheetExpandedState"],
    queryFn: () => ({}),
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [expanded, setExpanded] = React.useState<ExpandedState>(expandedState);

  const handleExpandedChange = React.useCallback(
    (updater: Updater<ExpandedState, unknown>) => {
      setExpanded((old) => {
        const newState = typeof updater === "function" ? updater(old) : updater;
        queryClient.setQueryData(["timesheetExpandedState"], newState);
        return newState;
      });
    },
    [queryClient]
  );

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch(
        "/api/fetchEmployees?status=active&pay_type=hourly,salary"
      );
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      return data as Employee[];
    },
  });

  const filteredInitialData = React.useMemo(() => {
    if (!employees) return [];

    const activeEmployeeNames = new Set(employees.map((emp) => emp.name));
    return initialData.filter(
      (timesheet) =>
        timesheet.employee_name &&
        activeEmployeeNames.has(timesheet.employee_name)
    );
  }, [initialData, employees]);

  useEffect(() => {
    // console.log("Initial Data:", initialData);
    // console.log("Employees:", employees);
    // console.log("Filtered Data:", filteredInitialData);
    setData(filteredInitialData);
  }, [filteredInitialData]);

  const getCurrentPayPeriod = () => {
    const today = new Date();
    let periodStart = startOfWeek(today, { weekStartsOn: 0 });

    if (today.getDay() >= 3) {
      periodStart = addWeeks(periodStart, -1);
    }

    const periodEnd = endOfWeek(addWeeks(periodStart, 1), { weekStartsOn: 0 });

    return { periodStart, periodEnd };
  };

  const payPeriodSummaries = React.useMemo(() => {
    let startDate, endDate;

    if (date?.from) {
      startDate = date.from;
      endDate = date.to || date.from;
    } else {
      const { periodStart, periodEnd } = getCurrentPayPeriod();
      startDate = periodStart;
      endDate = periodEnd;
    }

    const summaries = new Map<string, PayPeriodSummary>();

    const dailyHours = new Map<string, Map<string, number>>();
    const weeklyHours = new Map<string, Map<string, number>>();

    filteredInitialData.forEach((timesheet) => {
      if (
        !timesheet.employee_name ||
        !timesheet.event_date ||
        !timesheet.total_hours
      )
        return;

      const eventDate = parseISO(timesheet.event_date);
      if (!isWithinInterval(eventDate, { start: startDate, end: endDate }))
        return;

      const hours = parseFloat(timesheet.total_hours);
      if (isNaN(hours)) return;

      const employeeName = timesheet.employee_name;
      const dateStr = format(eventDate, "yyyy-MM-dd");
      const weekStr = format(startOfWeek(eventDate), "yyyy-MM-dd");

      if (!dailyHours.has(employeeName)) {
        dailyHours.set(employeeName, new Map());
      }
      if (!weeklyHours.has(employeeName)) {
        weeklyHours.set(employeeName, new Map());
      }

      const employeeDailyHours = dailyHours.get(employeeName)!;
      employeeDailyHours.set(
        dateStr,
        (employeeDailyHours.get(dateStr) || 0) + hours
      );

      const employeeWeeklyHours = weeklyHours.get(employeeName)!;
      employeeWeeklyHours.set(
        weekStr,
        (employeeWeeklyHours.get(weekStr) || 0) + hours
      );

      const currentSummary = summaries.get(employeeName) || {
        regularHours: 0,
        overtimeHours: 0,
        startDate,
        endDate,
      };

      let regularHours = hours;
      let overtimeHours = 0;

      const dailyTotal = employeeDailyHours.get(dateStr) || 0;
      if (dailyTotal > 8) {
        const dailyOvertime = dailyTotal - 8;
        regularHours = hours - dailyOvertime;
        overtimeHours = dailyOvertime;
      }

      const weeklyTotal = employeeWeeklyHours.get(weekStr) || 0;
      if (weeklyTotal > 40) {
        const weeklyOvertime = Math.min(regularHours, weeklyTotal - 40);
        regularHours -= weeklyOvertime;
        overtimeHours += weeklyOvertime;
      }

      const totalRegularHours = currentSummary.regularHours + regularHours;
      if (totalRegularHours > 80) {
        const periodOvertime = totalRegularHours - 80;
        regularHours -= periodOvertime;
        overtimeHours += periodOvertime;
      }

      currentSummary.regularHours += regularHours;
      currentSummary.overtimeHours += overtimeHours;
      summaries.set(employeeName, currentSummary);
    });

    return summaries;
  }, [filteredInitialData, date]);

  const filteredData = React.useMemo(() => {
    if (!date?.from) return filteredInitialData;

    return filteredInitialData.filter((item) => {
      if (!item.event_date || !date.from) return false;

      const itemDate = parseISO(item.event_date);
      const from = date.from;
      const to = date.to || date.from;

      const itemDateStr = format(itemDate, "yyyy-MM-dd");
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");

      return itemDateStr >= fromStr && itemDateStr <= toStr;
    });
  }, [filteredInitialData, date]);

  useEffect(() => {
    setData(filteredData);
  }, [filteredData]);

  const updateTimesheet = React.useCallback(
    (updatedTimesheet: TimesheetData) => {
      setData((prevData) =>
        prevData.map((item) =>
          item.id === updatedTimesheet.id ? updatedTimesheet : item
        )
      );
    },
    []
  );

  const calculateTotalHours = (timesheet: TimesheetData) => {
    try {
      const parseTimeString = (timeStr: string) => {
        const [time, meridiem] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (meridiem === "PM" && hours !== 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const startMinutes = parseTimeString(timesheet.start_time);
      const endMinutes = parseTimeString(timesheet.end_time || "");
      const lunchStartMinutes = timesheet.lunch_start
        ? parseTimeString(timesheet.lunch_start)
        : null;
      const lunchEndMinutes = timesheet.lunch_end
        ? parseTimeString(timesheet.lunch_end)
        : null;

      // console.log("Start minutes:", startMinutes); // 5:30 AM = 330
      // console.log("End minutes:", endMinutes); // 1:59 PM = 839
      // console.log("Lunch start minutes:", lunchStartMinutes); // 10:46 AM = 646
      // console.log("Lunch end minutes:", lunchEndMinutes); // 11:16 AM = 676

      if (!endMinutes) return "0:00";

      let totalMinutes = endMinutes - startMinutes; // 839 - 330 = 509 minutes
      // console.log("Total minutes before lunch:", totalMinutes);

      // Subtract lunch break if both lunch start and end times exist
      if (lunchStartMinutes !== null && lunchEndMinutes !== null) {
        const lunchDuration = lunchEndMinutes - lunchStartMinutes; // 676 - 646 = 30 minutes
        // console.log("Lunch duration:", lunchDuration);
        totalMinutes -= lunchDuration;
      }

      // console.log("Final total minutes:", totalMinutes);

      // Convert minutes to hours and minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Format with leading zeros for minutes
      const result = `${hours}:${minutes.toString().padStart(2, "0")}`;
      // console.log("Calculated result:", result);

      return result;
    } catch (error) {
      console.error("Error calculating total hours:", error);
      return "0:00";
    }
  };

  const convertToDecimalHours = (timeStr: string): string => {
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const decimalHours = hours + minutes / 60;
      return decimalHours.toFixed(2);
    } catch (error) {
      console.error("Error converting to decimal hours:", error);
      return timeStr;
    }
  };

  const formattedColumns = React.useMemo(() => {
    return providedColumns.map((column) => {
      if (column.id === "lunch_start") {
        return {
          ...column,
          cell: (info: any) => {
            const row = info.row.original;
            const startTime = row.start_time;
            const lunchStart = row.lunch_start;

            if (!startTime || !lunchStart) {
              return formatTime(lunchStart || "");
            }

            try {
              const parseTimeString = (timeStr: string) => {
                const [time, meridiem] = timeStr.split(" ");
                let [hours, minutes] = time.split(":").map(Number);
                if (meridiem === "PM" && hours !== 12) hours += 12;
                if (meridiem === "AM" && hours === 12) hours = 0;
                return { hours, minutes };
              };

              const start = parseTimeString(startTime);
              const lunchStartTime = parseTimeString(lunchStart);

              const startTotalMinutes = start.hours * 60 + start.minutes;
              const lunchStartTotalMinutes =
                lunchStartTime.hours * 60 + lunchStartTime.minutes;

              const adjustedLunchStartMinutes =
                lunchStartTotalMinutes < startTotalMinutes
                  ? lunchStartTotalMinutes + 24 * 60
                  : lunchStartTotalMinutes;

              const durationInMinutes =
                adjustedLunchStartMinutes - startTotalMinutes;
              const durationInHours = durationInMinutes / 60;

              // console.log(
              //   `Duration in minutes: ${durationInMinutes}, hours: ${durationInHours}`
              // );

              let colorClass = "";
              if (durationInHours < 5.5) {
                colorClass = "text-green-500";
              } else if (durationInHours < 6.5) {
                colorClass = "text-orange-500";
              } else if (durationInHours < 7.0) {
                colorClass = "text-yellow-500";
              } else {
                colorClass = "text-red-500";
              }

              return (
                <span
                  className={`${colorClass} font-medium`}
                  title={`${durationInHours.toFixed(2)} hours after start time`}
                >
                  {formatTime(lunchStart)}
                </span>
              );
            } catch (error) {
              console.error(
                "Error calculating lunch start time difference:",
                error
              );
              return formatTime(lunchStart);
            }
          },
        };
      }

      if (column.id === "lunch_end") {
        return {
          ...column,
          cell: (info: any) => {
            const row = info.row.original;
            const lunchStart = row.lunch_start;
            const lunchEnd = row.lunch_end;

            if (!lunchStart || !lunchEnd) {
              return formatTime(lunchEnd || "");
            }

            try {
              const parseTimeString = (timeStr: string) => {
                const [time, meridiem] = timeStr.split(" ");
                let [hours, minutes] = time.split(":").map(Number);
                if (meridiem === "PM" && hours !== 12) hours += 12;
                if (meridiem === "AM" && hours === 12) hours = 0;
                return { hours, minutes };
              };

              const start = parseTimeString(lunchStart);
              const end = parseTimeString(lunchEnd);

              const startTotalMinutes = start.hours * 60 + start.minutes;
              const endTotalMinutes = end.hours * 60 + end.minutes;

              const adjustedEndTotalMinutes =
                endTotalMinutes < startTotalMinutes
                  ? endTotalMinutes + 24 * 60
                  : endTotalMinutes;

              const durationInMinutes =
                adjustedEndTotalMinutes - startTotalMinutes;

              return (
                <span
                  className={
                    durationInMinutes >= 30
                      ? "text-green-500 font-medium"
                      : "text-red-500 font-medium"
                  }
                  title={`Duration: ${durationInMinutes} minutes`}
                >
                  {formatTime(lunchEnd)}
                </span>
              );
            } catch (error) {
              console.error("Error calculating lunch duration:", error);
              return formatTime(lunchEnd);
            }
          },
        };
      }

      if (["start_time", "end_time"].includes(column.id as string)) {
        return {
          ...column,
          cell: (info: any) => formatTime(info.getValue()),
        };
      }

      if (column.id === "total_hours") {
        return {
          ...column,
          cell: (info: any) => {
            const row = info.row.original;
            const scheduleData = row.scheduleData;

            // If it's a called out day or no call no show, don't show in total_hours
            if (
              scheduleData?.status === "called_out" ||
              scheduleData?.status === "no_call_no_show"
            ) {
              return null;
            }

            // For all other cases, show the total hours based on format preference
            if (!row.total_hours) return "";

            try {
              // First, ensure we have a consistent format by splitting on ":"
              const [hours, minutes] = row.total_hours.split(":");
              const totalHours = parseInt(hours);
              const totalMinutes = parseInt(minutes);

              if (showDecimalHours) {
                // Calculate decimal hours
                const decimalHours = totalHours + totalMinutes / 60;
                return `${decimalHours.toFixed(2)} hrs`;
              }

              // Return HH:MM format
              return `${totalHours}:${totalMinutes.toString().padStart(2, "0")}`;
            } catch (error) {
              console.error("Error formatting total hours:", error);
              return row.total_hours;
            }
          },
        };
      }

      if (column.id === "sick_time") {
        return {
          ...column,
          cell: ({ row }: { row: Row<TimesheetData> }) => (
            <SickTimeCell row={row} />
          ),
        };
      }

      if (column.id === "vto") {
        return {
          ...column,
          cell: ({ row }: { row: Row<TimesheetDataWithSchedule> }) => (
            <VTOCell row={row} />
          ),
        };
      }

      return column;
    });
  }, [providedColumns, showDecimalHours]);

  const { data: sortingState = [{ id: "event_date", desc: true }] } = useQuery({
    queryKey: ["timesheetSortingState"],
    queryFn: () => [{ id: "event_date", desc: true }],
    initialData: [{ id: "event_date", desc: true }],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const handleSortingChange = React.useCallback(
    (updater: Updater<SortingState, unknown>) => {
      setSorting((old) => {
        const newState = typeof updater === "function" ? updater(old) : updater;
        queryClient.setQueryData(["timesheetSortingState"], newState);
        return newState;
      });
    },
    [queryClient]
  );

  const table = useReactTable({
    data,
    columns: formattedColumns,
    state: {
      columnFilters,
      expanded,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: handleExpandedChange,
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      grouping: ["employee_name"],
      sorting: [{ id: "event_date", desc: true }],
    },
  });

  const handleResetFilter = () => {
    table.getColumn("employee_name")?.setFilterValue("");
    setSelectedEmployee("");
  };

  const handleExpandCollapseAll = () => {
    const newState = Object.keys(expanded).length > 0 ? {} : true;
    setExpanded(newState);
    queryClient.setQueryData(["timesheetExpandedState"], newState);
    table.toggleAllRowsExpanded(!!newState);
  };

  const formatIntervalForExcel = (intervalStr: string | null) => {
    if (!intervalStr) return "";
    try {
      // Handle different PostgreSQL interval formats
      // Could be "HH:MM:SS" or "H hours M minutes" or just a number
      if (intervalStr.includes(":")) {
        const [hours, minutes] = intervalStr.split(":");
        return `${parseInt(hours)}:${minutes.padStart(2, "0")}`;
      } else if (intervalStr.includes("hours")) {
        const parts = intervalStr.split(" ");
        const hours = parseInt(parts[0]);
        const minutes = parts.includes("minutes") ? parseInt(parts[2]) : 0;
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
      } else {
        // If it's just a number, assume it's hours
        const hours = parseFloat(intervalStr);
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        return `${wholeHours}:${minutes.toString().padStart(2, "0")}`;
      }
    } catch (error) {
      console.error(
        "Error formatting interval for Excel:",
        error,
        "Input:",
        intervalStr
      );
      return intervalStr || "";
    }
  };

  const handleExportToExcel = () => {
    let filename;
    if (date?.from) {
      if (date.to) {
        filename = `Timesheets_${format(date.from, "MM-dd-yyyy")}_to_${format(
          date.to,
          "MM-dd-yyyy"
        )}`;
      } else {
        filename = `Timesheets_${format(date.from, "MM-dd-yyyy")}`;
      }
    } else {
      const { periodStart, periodEnd } = getCurrentPayPeriod();
      filename = `Timesheets_${format(periodStart, "MM-dd-yyyy")}_to_${format(
        periodEnd,
        "MM-dd-yyyy"
      )}`;
    }

    const wb = XLSX.utils.book_new();

    const summaryRows = [
      [
        "Employee Name",
        "Pay Period",
        showDecimalHours ? "Regular Hours (Decimal)" : "Regular Hours",
        showDecimalHours ? "Overtime Hours (Decimal)" : "Overtime Hours",
        showDecimalHours ? "Total Hours (Decimal)" : "Total Hours",
      ],
    ];

    payPeriodSummaries.forEach((summary, employeeName) => {
      const formatHours = (hours: number) => {
        if (showDecimalHours) {
          return parseInterval(String(hours)).toFixed(2);
        }
        return formatHoursAndMinutes(String(hours));
      };

      summaryRows.push([
        employeeName,
        `${format(summary.startDate, "MM/dd/yyyy")} - ${format(summary.endDate, "MM/dd/yyyy")}`,
        formatHours(summary.regularHours),
        formatHours(summary.overtimeHours),
        formatHours(summary.regularHours + summary.overtimeHours),
      ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);

    summaryWs["!cols"] = [
      { width: 25 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } },
    };

    for (let i = 0; i < 5; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      summaryWs[cellRef].s = headerStyle;
    }

    const detailRows = [
      [
        "Employee Name",
        "Date",
        "Start Time",
        "Lunch Start",
        "Lunch End",
        "End Time",
        showDecimalHours ? "Total Hours (Decimal)" : "Total Hours",
        "Lunch Duration (min)",
      ],
    ];

    detailRows.push(
      ...data.map((item) => {
        const safeFormatTime = (timeStr: string | null) => {
          if (!timeStr) return "";
          try {
            if (timeStr.includes("AM") || timeStr.includes("PM")) {
              return timeStr;
            }
            return formatTime(timeStr);
          } catch (error) {
            return timeStr || "";
          }
        };

        const getLunchDuration = (
          lunchStart: string | null,
          lunchEnd: string | null
        ) => {
          if (!lunchStart || !lunchEnd) return "";
          try {
            const parseTimeString = (timeStr: string) => {
              const [time, meridiem] = timeStr.split(" ");
              let [hours, minutes] = time.split(":").map(Number);
              if (meridiem === "PM" && hours !== 12) hours += 12;
              if (meridiem === "AM" && hours === 12) hours = 0;
              return { hours, minutes };
            };

            const start = parseTimeString(lunchStart);
            const end = parseTimeString(lunchEnd);

            const duration =
              end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
            return duration.toString();
          } catch (error) {
            return "";
          }
        };

        const lunchStart = safeFormatTime(item.lunch_start);
        const lunchEnd = safeFormatTime(item.lunch_end);

        const formatTotalHours = (totalHours: string | null) => {
          if (!totalHours) return "";
          if (showDecimalHours) {
            return parseInterval(totalHours).toFixed(2);
          }
          return formatIntervalForExcel(totalHours);
        };

        return [
          item.employee_name || "",
          item.event_date
            ? format(parseISO(item.event_date), "MM/dd/yyyy")
            : "",
          safeFormatTime(item.start_time),
          lunchStart,
          lunchEnd,
          safeFormatTime(item.end_time),
          formatTotalHours(item.total_hours),
          getLunchDuration(lunchStart, lunchEnd),
        ];
      })
    );

    const detailWs = XLSX.utils.aoa_to_sheet(detailRows);

    detailWs["!cols"] = [
      { width: 25 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
    ];

    for (let i = 0; i < 8; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      detailWs[cellRef].s = headerStyle;
    }

    XLSX.utils.book_append_sheet(wb, summaryWs, "Pay Period Summary");
    XLSX.utils.book_append_sheet(wb, detailWs, "Timesheet Details");

    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleAddTimeSheetEntry = (newTimesheet: TimesheetData) => {
    queryClient.invalidateQueries({ queryKey: ["timesheets"] });
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  interface ExpandableCardProps {
    id: string;
    title: string;
    children: React.ReactNode;
  }

  const ExpandableCard: React.FC<ExpandableCardProps> = ({
    id,
    title,
    children,
  }) => {
    const isExpanded = expandedCards[id];

    return (
      <Card className={`relative ${isExpanded ? "h-auto" : "h-[200px]"}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCardExpansion(id)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={`
            ${isExpanded ? "" : "h-[100px] overflow-y-auto pr-4"}
            space-y-4
          `}
        >
          {children}
        </CardContent>
      </Card>
    );
  };

  // Create separate components for Sick Time and VTO cells
  const SickTimeCell = ({ row }: { row: Row<TimesheetData> }) => {
    const isGrouped = row.getIsGrouped();
    const employeeName = row.getValue("employee_name");

    const { data: sickTimeData } = useQuery({
      queryKey: [
        "sickTime",
        employeeName,
        row.original?.employee_id,
        row.original?.event_date,
      ],
      queryFn: async () => {
        const supabase = createClientComponentClient();
        if (isGrouped) {
          const { data } = await supabase.rpc("calculate_available_sick_time", {
            p_emp_id: row.original.employee_id,
          });
          return { available: data };
        } else {
          const { data: historyData } = await supabase
            .from("employee_sick_time_history")
            .select("hours_used")
            .eq("employee_id", row.original.employee_id)
            .eq("date_used::date", row.original.event_date)
            .maybeSingle();

          const { data: requestData } = await supabase
            .from("time_off_requests")
            .select("hours_deducted")
            .eq("employee_id", row.original.employee_id)
            .eq("start_date", row.original.event_date)
            .eq("use_sick_time", true)
            .maybeSingle();

          return {
            used:
              (historyData?.hours_used || 0) +
              (requestData?.hours_deducted || 0),
          };
        }
      },
      enabled: Boolean(
        employeeName && row.original?.employee_id && row.original?.event_date
      ),
    });

    if (isGrouped) {
      return (
        <span>
          Available: {sickTimeData?.available?.toFixed(2) || "0.00"} hrs
        </span>
      );
    }
    return sickTimeData?.used ? (
      <span className="text-red-500">{sickTimeData.used.toFixed(2)} hrs</span>
    ) : null;
  };

  const VTOCell = ({ row }: { row: Row<TimesheetDataWithSchedule> }) => {
    if (row.getIsGrouped()) return null;

    const { data: scheduleData } = useQuery<ScheduleData | null>({
      queryKey: [
        "schedule",
        row.original?.employee_id,
        row.original?.event_date,
      ],
      queryFn: async () => {
        const supabase = createClientComponentClient();
        const { data: scheduleData } = await supabase
          .from("schedules")
          .select("status, start_time, end_time")
          .eq("employee_id", row.original.employee_id)
          .eq("schedule_date", row.original.event_date)
          .maybeSingle();

        if (
          scheduleData?.status === "called_out" ||
          scheduleData?.status === "no_call_no_show"
        ) {
          // If called out or no call no show, get the scheduled hours
          if (scheduleData.start_time && scheduleData.end_time) {
            return scheduleData;
          }
          // If no scheduled times, return with default status
          return {
            ...scheduleData,
            start_time: "08:00:00",
            end_time: "16:30:00",
          };
        }

        return scheduleData;
      },
      enabled: Boolean(row.original?.employee_id && row.original?.event_date),
    });

    // Store schedule data for use in total_hours column
    if (row.original && scheduleData) {
      row.original.scheduleData = scheduleData;
    }

    if (
      scheduleData?.status === "called_out" ||
      scheduleData?.status === "no_call_no_show"
    ) {
      // Calculate from schedule times
      const startTime = new Date(`1970-01-01T${scheduleData.start_time}`);
      const endTime = new Date(`1970-01-01T${scheduleData.end_time}`);
      const diffInMinutes =
        (endTime.getTime() - startTime.getTime()) / 1000 / 60;

      // Subtract 30 minutes for lunch if shift is 6 hours or longer
      const totalMinutes =
        diffInMinutes >= 360 ? diffInMinutes - 30 : diffInMinutes;
      const finalHours = Math.floor(totalMinutes / 60);
      const finalMinutes = Math.round(totalMinutes % 60);

      const timeStr = `${finalHours}:${finalMinutes.toString().padStart(2, "0")}`;

      return (
        <span className="text-yellow-600">
          {showDecimalHours ? `${convertToDecimalHours(timeStr)} hrs` : timeStr}
        </span>
      );
    }
    return null;
  };

  const parseInterval = (intervalStr: string): number => {
    try {
      // Handle PostgreSQL interval format "HH:MM:SS"
      if (intervalStr.includes(":")) {
        const [hours, minutes] = intervalStr.split(":");
        return parseInt(hours) + parseInt(minutes) / 60;
      }
      // Handle other possible interval formats
      return parseFloat(intervalStr);
    } catch (error) {
      console.error("Error parsing interval:", error);
      return 0;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-h-[80vh] px-1 sm:px-4">
      <div className="flex flex-row items-center justify-between mx-2 my-2">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-6 space-x-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open}>
                  {selectedEmployee
                    ? employees?.find(
                        (employee) => employee.name === selectedEmployee
                      )?.name
                    : "Select employee..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {employees
                        ?.filter((employee) => {
                          if (!searchInput) return true;
                          return employee.name
                            .toLowerCase()
                            .includes(searchInput.toLowerCase());
                        })
                        .map((employee) => (
                          <CommandItem
                            key={employee.employee_id}
                            onSelect={() => {
                              setSelectedEmployee(
                                employee.name === selectedEmployee
                                  ? ""
                                  : employee.name
                              );
                              table
                                .getColumn("employee_name")
                                ?.setFilterValue(
                                  employee.name === selectedEmployee
                                    ? ""
                                    : employee.name
                                );
                              setOpen(false);
                              setSearchInput("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployee === employee.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {employee.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {(searchInput || date?.from || selectedEmployee) && (
              <Button
                variant="outline"
                onClick={() => {
                  handleResetFilter();
                  setDate(undefined);
                }}
              >
                <CrossCircledIcon className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            )}
            <Button variant="default" onClick={handleExportToExcel}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
            <Button variant="outline" onClick={handleExpandCollapseAll}>
              {Object.keys(expanded).length > 0 ? "Collapse All" : "Expand All"}
            </Button>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showDecimalHours}
                onCheckedChange={onShowDecimalHoursChange}
                id="hours-format"
              />
              <Label htmlFor="hours-format">
                {showDecimalHours ? "Decimal" : "Hours"}
              </Label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="h-8 w-8 p-0"
        >
          {isTableExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="overflow-y-auto overflow-x-auto mx-4 sm:mx-0">
        <ScrollArea
          className={cn(
            "transition-all duration-200 ease-in-out",
            isTableExpanded ? "h-[calc(100vh-200px)]" : "h-[500px]"
          )}
        >
          <div className="flex relative min-w-[calc(100vw-180px)]">
            <table className="w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-background z-5">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-1 py-1 text-left text-xs font-medium uppercase tracking-normal"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                    <th className="px-1 py-1 text-left text-xs font-medium uppercase tracking-normal">
                      Overtime
                    </th>
                    <th className="px-1 py-1 text-left text-xs font-medium uppercase tracking-normal">
                      Actions
                    </th>
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => {
                  if (row.getIsGrouped()) {
                    const employeeName = row.getValue(
                      "employee_name"
                    ) as string;
                    const summary = payPeriodSummaries.get(employeeName);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => row.toggleExpanded()}
                        className="cursor-pointer hover:bg-muted"
                      >
                        <td className="py-2">
                          <div className="flex items-center">
                            {row.getIsExpanded() ? (
                              <DoubleArrowDownIcon className="mr-2 h-4 w-4" />
                            ) : (
                              <DoubleArrowRightIcon className="mr-2 h-4 w-4" />
                            )}
                            <span className="font-medium">{employeeName}</span>
                          </div>
                        </td>
                        <td className="py-2">
                          {summary && (
                            <span>
                              {format(summary.startDate, "M/dd/yyyy")} -{" "}
                              {format(summary.endDate, "M/dd/yyyy")}
                            </span>
                          )}
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="py-2">
                          {summary && (
                            <span
                              className={
                                summary.regularHours > 80
                                  ? "text-yellow-600"
                                  : ""
                              }
                            >
                              {showDecimalHours
                                ? `${parseInterval(String(summary.regularHours)).toFixed(2)} hrs`
                                : formatHoursAndMinutes(
                                    String(summary.regularHours)
                                  )}
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {summary && summary.overtimeHours > 0 && (
                            <span className="text-red-600">
                              {showDecimalHours
                                ? `${parseInterval(String(summary.overtimeHours)).toFixed(2)} hrs`
                                : formatHoursAndMinutes(
                                    String(summary.overtimeHours)
                                  )}
                            </span>
                          )}
                        </td>
                        <td></td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-1 py-1 whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                      <td className="px-1 py-1 whitespace-nowrap"></td>
                      <td>
                        <TimesheetRowActions
                          row={row}
                          fetchTimesheets={fetchTimesheets}
                          updateTimesheet={updateTimesheet}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
