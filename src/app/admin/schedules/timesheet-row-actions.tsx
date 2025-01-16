"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";
import { TimesheetData } from "./data-schema";
import { X } from "lucide-react";
import { format, parse } from "date-fns";

interface TimesheetRowActionsProps {
  row: Row<TimesheetData>;
  fetchTimesheets: () => void;
  updateTimesheet: (updatedTimesheet: TimesheetData) => void;
}

export function TimesheetRowActions({
  row,
  fetchTimesheets,
  updateTimesheet,
}: TimesheetRowActionsProps) {
  const timesheet = row.original as TimesheetData;
  const [startTime, setStartTime] = useState(timesheet.start_time || "");
  const [lunchStart, setLunchStart] = useState(timesheet.lunch_start || "");
  const [lunchEnd, setLunchEnd] = useState(timesheet.lunch_end || "");
  const [endTime, setEndTime] = useState(timesheet.end_time || "");
  const [isOpen, setIsOpen] = useState(false);

  const formatTimeForInput = useCallback(
    (timeString: string | null): string => {
      if (!timeString) return "";
      return timeString.slice(0, 5);
    },
    []
  );

  const formatTimeForDisplay = useCallback(
    (timeString: string | null): string => {
      if (!timeString) return "";
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      const formattedMinutes = minutes ? minutes.padStart(2, "0") : "00";
      return `${hour12}:${formattedMinutes} ${ampm}`;
    },
    []
  );

  const updateTimeFields = useCallback(() => {
    setStartTime(formatTimeForInput(timesheet.start_time));
    setLunchStart(formatTimeForInput(timesheet.lunch_start));
    setLunchEnd(formatTimeForInput(timesheet.lunch_end));
    setEndTime(formatTimeForInput(timesheet.end_time));
  }, [timesheet, formatTimeForInput]);

  useEffect(() => {
    updateTimeFields();
  }, [timesheet, updateTimeFields]);

  const handleDropdownOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      updateTimeFields();
    }
  };

  const clearField = async (field: keyof TimesheetData) => {
    const updates: Partial<TimesheetData> = { [field]: null };

    const { data, error } = await supabase
      .from("employee_clock_events")
      .update(updates)
      .eq("id", timesheet.id)
      .select();

    if (error) {
      //console.(`Error clearing ${field}:`, error);
    } else if (data && data.length > 0) {
      updateTimesheet(data[0] as TimesheetData);
      // Update local state
      switch (field) {
        case "start_time":
          setStartTime("");
          break;
        case "lunch_start":
          setLunchStart("");
          break;
        case "lunch_end":
          setLunchEnd("");
          break;
        case "end_time":
          setEndTime("");
          break;
      }
    }
  };

  const applyChanges = async () => {
    const updates: Partial<TimesheetData> = {};

    if (startTime !== formatTimeForInput(timesheet.start_time)) {
      updates.start_time = startTime || undefined;
    }
    if (lunchStart !== formatTimeForInput(timesheet.lunch_start)) {
      updates.lunch_start = lunchStart || null;
    }
    if (lunchEnd !== formatTimeForInput(timesheet.lunch_end)) {
      updates.lunch_end = lunchEnd || null;
    }
    if (endTime !== formatTimeForInput(timesheet.end_time)) {
      updates.end_time = endTime || null;
    }

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("employee_clock_events")
        .update(updates)
        .eq("id", timesheet.id)
        .select();

      if (error) {
        //console.("Error updating timesheet:", error);
      } else if (data && data.length > 0) {
        updateTimesheet(data[0] as TimesheetData);
        fetchTimesheets(); // Refresh the entire timesheet data
      }
    }

    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] p-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-grow">
            <label className="block text-sm font-medium">Start Time</label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-16">
                {timesheet.start_time
                  ? formatTimeForDisplay(timesheet.start_time)
                  : ""}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("start_time")}
            className="mt-5"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear start time</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-grow">
            <label className="block text-sm font-medium">Lunch Start</label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={lunchStart}
                onChange={(e) => setLunchStart(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-16">
                {timesheet.lunch_start
                  ? formatTimeForDisplay(timesheet.lunch_start)
                  : ""}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("lunch_start")}
            className="mt-5"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear lunch start</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-grow">
            <label className="block text-sm font-medium">Lunch End</label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={lunchEnd}
                onChange={(e) => setLunchEnd(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-16">
                {timesheet.lunch_end
                  ? formatTimeForDisplay(timesheet.lunch_end)
                  : ""}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("lunch_end")}
            className="mt-5"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear lunch end</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-grow">
            <label className="block text-sm font-medium">End Time</label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-16">
                {timesheet.end_time
                  ? formatTimeForDisplay(timesheet.end_time)
                  : ""}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("end_time")}
            className="mt-5"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear end time</span>
          </Button>
        </div>

        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem onClick={applyChanges}>Apply</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
