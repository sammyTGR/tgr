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
import { parseISO } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrashIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimesheetRowActionsProps {
  row: Row<TimesheetData>;
  fetchTimesheets: () => void;
  updateTimesheet: (updatedTimesheet: TimesheetData) => void;
}

const timeZone = "America/Los_Angeles";

export function TimesheetRowActions({
  row,
  fetchTimesheets,
  updateTimesheet,
}: TimesheetRowActionsProps) {
  const queryClient = useQueryClient();
  const timesheet = row.original as TimesheetData;
  const [startTime, setStartTime] = useState(timesheet.start_time || "");
  const [lunchStart, setLunchStart] = useState(timesheet.lunch_start || "");
  const [lunchEnd, setLunchEnd] = useState(timesheet.lunch_end || "");
  const [endTime, setEndTime] = useState(timesheet.end_time || "");
  const [isOpen, setIsOpen] = useState(false);

  const formatTimeForInput = useCallback(
    (timeString: string | null): string => {
      if (!timeString) return "";
      try {
        // First, check if the time is already in HH:mm format
        if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
          return timeString.substring(0, 5); // Return just HH:mm
        }

        // If it's in AM/PM format, convert it
        const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let [_, hours, minutes, period] = match;
          let hour = parseInt(hours);

          // Convert to 24-hour format
          if (period.toUpperCase() === "PM" && hour < 12) hour += 12;
          if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

          return `${hour.toString().padStart(2, "0")}:${minutes}`;
        }

        // If we get here, try parsing as ISO time
        const date = parseISO(`1970-01-01T${timeString}`);
        return format(date, "HH:mm");
      } catch (error) {
        console.error(
          "Error formatting time for input:",
          error,
          "for time value:",
          timeString
        );
        return "";
      }
    },
    []
  );

  const formatTimeForDisplay = useCallback(
    (timeString: string | null): string => {
      if (!timeString) return "";
      try {
        // Extract hours and minutes
        const timeMatch = timeString.match(/^(\d{2}):(\d{2})/);
        if (!timeMatch) return "";

        const [_, hours, minutes] = timeMatch;
        const date = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes));

        // Convert to LA timezone
        const zonedDate = toZonedTime(date, timeZone);
        // Format with AM/PM
        return format(zonedDate, "h:mm a", { timeZone });
      } catch (error) {
        console.error(
          "Error formatting time for display:",
          error,
          "for time value:",
          timeString
        );
        return "";
      }
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

  const convertToUTCTime = (time: string): string | null => {
    if (!time) return null;
    try {
      // Convert from local time input to UTC
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0);

      // Format in UTC
      return format(date, "HH:mm:ss", { timeZone: "UTC" });
    } catch (error) {
      console.error(
        "Error converting time to UTC:",
        error,
        "for time value:",
        time
      );
      return null;
    }
  };

  const applyChanges = async () => {
    const updates: Partial<TimesheetData> = {};

    if (startTime !== formatTimeForInput(timesheet.start_time)) {
      updates.start_time = convertToUTCTime(startTime) || undefined;
    }
    if (lunchStart !== formatTimeForInput(timesheet.lunch_start)) {
      updates.lunch_start = convertToUTCTime(lunchStart) || undefined;
    }
    if (lunchEnd !== formatTimeForInput(timesheet.lunch_end)) {
      updates.lunch_end = convertToUTCTime(lunchEnd) || undefined;
    }
    if (endTime !== formatTimeForInput(timesheet.end_time)) {
      updates.end_time = convertToUTCTime(endTime) || undefined;
    }

    if (Object.keys(updates).length > 0) {
      // Remove total_hours from updates as it will be calculated by the trigger
      const { data, error } = await supabase
        .from("employee_clock_events")
        .update(updates)
        .eq("id", timesheet.id)
        .select("*, employees(name)"); // Include employee name in the response

      if (error) {
        console.error("Error updating timesheet:", error);
        toast.error("Failed to update timesheet");
      } else if (data && data.length > 0) {
        const updatedTimesheet = {
          ...data[0],
          employee_name: data[0].employees?.name,
        };

        // Get current states before invalidation
        const currentExpandedState = queryClient.getQueryData([
          "timesheetExpandedState",
        ]);
        const currentSortingState = queryClient.getQueryData([
          "timesheetSortingState",
        ]);

        // Update the timesheet
        updateTimesheet(updatedTimesheet as TimesheetData);

        // Invalidate and refetch timesheets
        await queryClient.invalidateQueries({ queryKey: ["timesheets"] });

        // Restore states after refetch
        queryClient.setQueryData(
          ["timesheetExpandedState"],
          currentExpandedState
        );
        queryClient.setQueryData(
          ["timesheetSortingState"],
          currentSortingState
        );

        toast.success("Timesheet updated successfully");
      }
    }

    setIsOpen(false);
  };

  // Add delete mutation
  const deleteTimesheetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("employee_clock_events")
        .delete()
        .eq("id", timesheet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Timesheet entry deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete timesheet entry");
      console.error("Error deleting timesheet:", error);
    },
  });

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
      <DropdownMenuContent align="end" className="w-[400px] p-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center gap-2 w-full">
            <label className="block text-sm font-medium min-w-[80px]">
              Start Time
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("start_time")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear start time</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center gap-2 w-full">
            <label className="block text-sm font-medium min-w-[80px]">
              Lunch Start
            </label>
            <Input
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("lunch_start")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear lunch start</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center gap-2 w-full">
            <label className="block text-sm font-medium min-w-[80px]">
              Lunch End
            </label>
            <Input
              type="time"
              value={lunchEnd}
              onChange={(e) => setLunchEnd(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("lunch_end")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear lunch end</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center gap-2 w-full">
            <label className="block text-sm font-medium min-w-[80px]">
              End Time
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearField("end_time")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear end time</span>
          </Button>
        </div>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem onClick={applyChanges}>Apply</DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete Entry
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                timesheet entry for {timesheet.employee_name} on{" "}
                {new Date(timesheet.event_date!).toLocaleDateString()}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteTimesheetMutation.mutate();
                  setIsOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
