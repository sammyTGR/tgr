"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useState } from "react";
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
  fetchTimesheets: () => void; // Function to refresh timesheets after update
}

export function TimesheetRowActions({
  row,
  fetchTimesheets,
}: TimesheetRowActionsProps) {
  const timesheet = row.original as TimesheetData;
  const [startTime, setStartTime] = useState(timesheet.start_time || "");
  const [lunchStart, setLunchStart] = useState(timesheet.lunch_start || "");
  const [lunchEnd, setLunchEnd] = useState(timesheet.lunch_end || "");
  const [endTime, setEndTime] = useState(timesheet.end_time || "");

  const handleUpdate = async (field: string, value: any) => {
    console.log(
      `Updating ${field} to ${value} for timesheet ID ${timesheet.id}`
    );
    const { error } = await supabase
      .from("employee_clock_events")
      .update({ [field]: value })
      .eq("id", timesheet.id);

    if (error) {
      console.error(`Error updating ${field}:`, error);
    } else {
      console.log(
        `Successfully updated ${field} to ${value} for timesheet ID ${timesheet.id}`
      );
      fetchTimesheets(); // Refresh the data
    }
  };

  const applyChanges = async () => {
    console.log(
      `Applying changes for timesheet ID ${timesheet.id}: Start Time = ${startTime}, Lunch Start = ${lunchStart}, Lunch End = ${lunchEnd}, End Time = ${endTime}`
    );
    await handleUpdate("start_time", startTime || null);
    await handleUpdate("lunch_start", lunchStart || null);
    await handleUpdate("lunch_end", lunchEnd || null);
    await handleUpdate("end_time", endTime || null);
  };

  return (
    <DropdownMenu>
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
