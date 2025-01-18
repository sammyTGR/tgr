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
import { format } from "date-fns";
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
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface TimesheetData {
  id: number;
  employee_id: number;
  start_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  end_time: string | null;
  total_hours: string | null;
  created_at: string | null;
  employee_name: string | null;
  event_date: string | null;
}

interface Employee {
  employee_id: number;
  name: string;
  status: string;
}

interface TimesheetDataTableProps {
  columns: ColumnDef<TimesheetData>[];
  data: TimesheetData[];
  fetchTimesheets: () => void;
}

export function TimesheetDataTable({
  columns: providedColumns,
  data: initialData,
  fetchTimesheets,
}: TimesheetDataTableProps) {
  const [data, setData] = React.useState(initialData);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [searchInput, setSearchInput] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
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

  const { data: employees } = useQuery({
    queryKey: ["activeEmployees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name")
        .eq("status", "active")
        .eq("pay_type", "hourly")
        .order("name");

      if (error) throw error;
      return data as Employee[];
    },
  });

  // Filter data based on date range
  const filteredData = React.useMemo(() => {
    if (!date?.from) return initialData;

    return initialData.filter((item) => {
      if (!item.event_date || !date.from) return false;

      const itemDate = new Date(item.event_date);
      const from = new Date(date.from);
      const to = date.to ? new Date(date.to) : from;

      // Set hours to 0 to compare dates only
      itemDate.setHours(0, 0, 0, 0);
      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return itemDate >= from && itemDate <= to;
    });
  }, [initialData, date]);

  React.useEffect(() => {
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

              // Calculate total minutes
              const startTotalMinutes = start.hours * 60 + start.minutes;
              const lunchStartTotalMinutes =
                lunchStartTime.hours * 60 + lunchStartTime.minutes;

              // Handle case where lunch start is on the next day
              const adjustedLunchStartMinutes =
                lunchStartTotalMinutes < startTotalMinutes
                  ? lunchStartTotalMinutes + 24 * 60
                  : lunchStartTotalMinutes;

              // Calculate duration in minutes
              const durationInMinutes =
                adjustedLunchStartMinutes - startTotalMinutes;
              const durationInHours = durationInMinutes / 60;

              console.log(
                `Duration in minutes: ${durationInMinutes}, hours: ${durationInHours}`
              );

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

              // Calculate total minutes
              const startTotalMinutes = start.hours * 60 + start.minutes;
              const endTotalMinutes = end.hours * 60 + end.minutes;

              // Handle case where lunch end is on the next day
              const adjustedEndTotalMinutes =
                endTotalMinutes < startTotalMinutes
                  ? endTotalMinutes + 24 * 60
                  : endTotalMinutes;

              // Calculate duration
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

      return column;
    });
  }, [providedColumns]);

  const table = useReactTable({
    data,
    columns: formattedColumns,
    state: {
      columnFilters,
      expanded,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
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
    if (isExpanded) {
      table.toggleAllRowsExpanded(false);
      setIsExpanded(false);
    } else {
      table.toggleAllRowsExpanded(true);
      setIsExpanded(true);
    }
  };

  // Excel export function
  const handleExportToExcel = () => {
    // Create worksheet with data first
    const ws = XLSX.utils.json_to_sheet([]);
    ws["!cols"] = [
      { width: 20 }, // Employee Name
      { width: 12 }, // Date
      { width: 12 }, // Start Time
      { width: 12 }, // Lunch Start
      { width: 12 }, // Lunch End
      { width: 12 }, // End Time
      { width: 12 }, // Total Hours
      { width: 15 }, // Lunch Duration
    ];

    // Add headers
    const headers = [
      "Employee Name",
      "Date",
      "Start Time",
      "Lunch Start",
      "Lunch End",
      "End Time",
      "Total Hours",
      "Lunch Duration (min)",
    ];
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

    // Prepare and add data
    const rowData = data.map((item) => {
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

      // Calculate lunch duration
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

      return [
        item.employee_name || "",
        item.event_date ? format(new Date(item.event_date), "MM/dd/yyyy") : "",
        safeFormatTime(item.start_time),
        lunchStart,
        lunchEnd,
        safeFormatTime(item.end_time),
        item.total_hours || "",
        getLunchDuration(lunchStart, lunchEnd),
      ];
    });

    // Add data
    XLSX.utils.sheet_add_aoa(ws, rowData, { origin: "A2" });

    // Add style to header row
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EEEEEE" } },
    };
    for (let i = 0; i < headers.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      ws[cellRef].s = headerStyle;
    }

    // Create and save workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheets");
    XLSX.writeFile(wb, `Timesheets_${format(new Date(), "MM-dd-yyyy")}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full w-full max-h-[80vh]">
      <div className="flex flex-row items-center justify-between mx-2 my-2">
        <div className="flex items-center space-x-2 flex-grow">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[250px] justify-between"
              >
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
                <CommandInput placeholder="Search employee..." />
                {/* <CommandEmpty>No employee found.</CommandEmpty> */}
                <CommandGroup>
                  {employees?.map((employee) => (
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
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            onClick={handleExportToExcel}
            className="ml-auto"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" onClick={handleExpandCollapseAll}>
            {isExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>
      <div className="overflow-hidden">
        <ScrollArea
          className={classNames(
            styles.noScroll,
            "h-[calc(100vh-400px)] relative"
          )}
        >
          <div className="overflow-auto">
            <ScrollArea>
              <div className="flex max-h-calc[(100vh-600px)] relative">
                <table className="w-full divide-y divide-gray-200 overflow-hidden">
                  <thead className="sticky top-0 bg-background z-5">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => {
                      if (row.getIsGrouped()) {
                        return (
                          <tr
                            key={row.id}
                            onClick={() => row.toggleExpanded()}
                            className="cursor-pointer"
                          >
                            <td
                              colSpan={columns.length + 1}
                              className="px-6 py-4"
                            >
                              <div className="flex items-center">
                                {row.getIsExpanded() ? (
                                  <DoubleArrowDownIcon className="mr-2 h-4 w-4" />
                                ) : (
                                  <DoubleArrowRightIcon className="mr-2 h-4 w-4" />
                                )}
                                <span>{row.getValue("employee_name")}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-6 py-4 whitespace-nowrap"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
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
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
      {/* <TimesheetPagination table={table} /> */}
    </div>
  );
}
