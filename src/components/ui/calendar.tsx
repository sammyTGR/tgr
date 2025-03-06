"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { startOfDay } from "date-fns";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

export type CustomCalendarProps = {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabledDays: (date: Date) => boolean;
  classNames?: CalendarProps["classNames"];
  showOutsideDays?: CalendarProps["showOutsideDays"];
  className?: string;
};

function CustomCalendar({
  className,
  classNames,
  showOutsideDays = true,
  selectedDate,
  onDateChange,
  disabledDays,
  ...props
}: CustomCalendarProps) {
  const TIMEZONE = "America/Los_Angeles";

  // Convert the selected date to Pacific time for display
  const displayDate = selectedDate
    ? new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) // Add 24 hours
    : undefined;

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Convert the selected date to Pacific time and set to start of day
      const pacificDate = toZonedTime(date, TIMEZONE);
      const startOfDayPacific = startOfDay(pacificDate);
      onDateChange(startOfDayPacific);
    } else {
      onDateChange(undefined);
    }
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      selected={displayDate} // Use the adjusted date for display
      onSelect={handleDateChange}
      mode="single"
      fromDate={new Date(2000, 0)} // Add this to ensure consistent date handling
      toDate={new Date(2100, 11)} // Add this to ensure consistent date handling
      modifiers={{
        disabled: disabledDays,
      }}
      footer={
        <div className="flex justify-between px-2 py-1">
          <button
            type="button"
            onClick={() => onDateChange(new Date())}
            className="text-sm text-primary-500"
          >
            Today
          </button>
        </div>
      }
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
export { CustomCalendar };

export type CustomCalendarAuditProps = {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabledDays: (date: Date) => boolean;
  classNames?: CalendarProps["classNames"];
  showOutsideDays?: CalendarProps["showOutsideDays"];
  className?: string;
};

function CustomCalendarAudit({
  className,
  classNames,
  showOutsideDays = true,
  selectedDate,
  onDateChange,
  disabledDays,
  ...props
}: CustomCalendarAuditProps) {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Create a new date at noon in local time to avoid any timezone issues
      const localDate = new Date(date);
      localDate.setHours(12, 0, 0, 0);
      onDateChange(localDate);
    } else {
      onDateChange(undefined);
    }
  };

  // Ensure display date is also set to noon
  const displayDate = selectedDate
    ? (() => {
        const date = new Date(selectedDate);
        date.setHours(12, 0, 0, 0);
        return date;
      })()
    : undefined;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      selected={displayDate}
      onSelect={handleDateChange}
      mode="single"
      fromDate={new Date(2000, 0)}
      toDate={new Date(2100, 11)}
      modifiers={{
        disabled: disabledDays,
      }}
      footer={
        <div className="flex justify-between px-2 py-1">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              today.setHours(12, 0, 0, 0);
              onDateChange(today);
            }}
            className="text-sm text-primary-500"
          >
            Today
          </button>
        </div>
      }
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
export { CustomCalendarAudit };

export type CustomCalendarMultiProps = {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  disabledDays: (date: Date) => boolean;
  classNames?: CalendarProps["classNames"];
  showOutsideDays?: CalendarProps["showOutsideDays"];
  className?: string;
};

function CustomCalendarMulti({
  className,
  classNames,
  showOutsideDays = true,
  selectedDates,
  onDatesChange,
  disabledDays,
  ...props
}: CustomCalendarMultiProps) {
  const handleDatesChange = (dates: Date[] | undefined) => {
    if (dates) {
      onDatesChange(dates);
    }
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      selected={selectedDates}
      onSelect={handleDatesChange}
      mode="multiple"
      modifiers={{
        disabled: disabledDays,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
export { CustomCalendarMulti };

export type CustomCalendarDashboardProps = {
  selectedDate: Date | undefined | null;
  onDateChange: (date: Date | undefined) => void;
  disabledDays: (date: Date) => boolean;
  classNames?: CalendarProps["classNames"];
  showOutsideDays?: CalendarProps["showOutsideDays"];
  className?: string;
};

function CustomCalendarDashboard({
  className,
  classNames,
  showOutsideDays = true,
  selectedDate,
  onDateChange,
  disabledDays,
  ...props
}: CustomCalendarDashboardProps) {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Create a new date at the start of the day in local time
      const localDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      // Add 3 days to the date
      localDate.setDate(localDate.getDate() + 3);

      // Convert to UTC to avoid timezone issues
      const utcDate = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate()
        )
      );

      onDateChange(utcDate);
    } else {
      onDateChange(undefined);
    }
  };

  // Convert UTC date to local for display
  const displayDate = selectedDate
    ? new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      )
    : undefined;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      selected={displayDate}
      onSelect={handleDateChange}
      mode="single"
      fromDate={new Date(2000, 0)}
      toDate={new Date(2100, 11)}
      modifiers={{
        disabled: disabledDays,
      }}
      footer={
        <div className="flex justify-between px-2 py-1">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const localToday = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
              );
              // Add 3 days to today's date
              localToday.setDate(localToday.getDate() + 3);
              const utcToday = new Date(
                Date.UTC(
                  localToday.getFullYear(),
                  localToday.getMonth(),
                  localToday.getDate()
                )
              );
              onDateChange(utcToday);
            }}
            className="text-sm text-primary-500"
          >
            Today
          </button>
        </div>
      }
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
export { CustomCalendarDashboard };
