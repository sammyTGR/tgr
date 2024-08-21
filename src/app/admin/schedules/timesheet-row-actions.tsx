"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (isOpen) {
      setStartTime(timesheet.start_time || "");
      setLunchStart(timesheet.lunch_start || "");
      setLunchEnd(timesheet.lunch_end || "");
      setEndTime(timesheet.end_time || "");
    }
  }, [isOpen, timesheet]);

  const applyChanges = async () => {
    const updates: Partial<TimesheetData> = {};

    if (startTime !== timesheet.start_time) {
      updates.start_time = startTime || undefined;
    }
    if (lunchStart !== timesheet.lunch_start) {
      updates.lunch_start = lunchStart || null;
    }
    if (lunchEnd !== timesheet.lunch_end) {
      updates.lunch_end = lunchEnd || null;
    }
    if (endTime !== timesheet.end_time) {
      updates.end_time = endTime || null;
    }

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("employee_clock_events")
        .update(updates)
        .eq("id", timesheet.id)
        .select();

      if (error) {
        console.error("Error updating timesheet:", error);
      } else if (data && data.length > 0) {
        updateTimesheet(data[0] as TimesheetData);
      }
    }

    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] p-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">
            Lunch Start
          </label>
          <Input
            type="time"
            value={lunchStart}
            onChange={(e) => setLunchStart(e.target.value)}
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">
            Lunch End
          </label>
          <Input
            type="time"
            value={lunchEnd}
            onChange={(e) => setLunchEnd(e.target.value)}
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem onClick={applyChanges}>Apply</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
