"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import {
  DotsHorizontalIcon,
  Pencil1Icon,
  TrashIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee } from "./types";
import { toast } from "sonner";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { supabase } from "@/utils/supabase/client";
import { EditEmployeeDialog } from "./PopoverForm";

interface WeeklySchedule {
  [day: string]: { start_time: string | null; end_time: string | null };
}

interface EmployeeTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit: (updatedEmployee: Employee) => void;
  onDelete: (employeeId: number) => void;
  onUpdateSchedule: (
    employeeId: number,
    schedules: WeeklySchedule
  ) => Promise<void>;
}

export function EmployeeTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
  onUpdateSchedule,
}: EmployeeTableRowActionsProps<TData>) {
  const employee = row.original as Employee;
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = async (updatedEmployee: Employee) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .update(updatedEmployee)
        .eq("employee_id", updatedEmployee.employee_id)
        .select();

      if (error) throw error;

      onEdit(updatedEmployee);
      toast.success("Employee Updated", {
        description: "The employee information has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Update Failed", {
        description: "There was an error updating the employee information.",
      });
    }
  };

  const handleUpdateSchedule = async (schedules: WeeklySchedule) => {
    try {
      await onUpdateSchedule(employee.employee_id, schedules);
      setIsScheduleDialogOpen(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const fetchWeeklySchedule = async (
    employeeId: number
  ): Promise<WeeklySchedule> => {
    const { data, error } = await supabase
      .from("reference_schedules")
      .select("day_of_week, start_time, end_time")
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error fetching weekly schedule:", error);
      return {};
    }

    const weeklySchedule: WeeklySchedule = {
      Monday: { start_time: null, end_time: null },
      Tuesday: { start_time: null, end_time: null },
      Wednesday: { start_time: null, end_time: null },
      Thursday: { start_time: null, end_time: null },
      Friday: { start_time: null, end_time: null },
      Saturday: { start_time: null, end_time: null },
      Sunday: { start_time: null, end_time: null },
    };

    data.forEach((schedule) => {
      weeklySchedule[schedule.day_of_week] = {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      };
    });

    return weeklySchedule;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            <Pencil1Icon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Edit Schedule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(employee.employee_id)}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditEmployeeDialog
        employee={employee}
        onSave={handleEdit}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />

      <EditScheduleDialog
        isOpen={isScheduleDialogOpen}
        onClose={() => setIsScheduleDialogOpen(false)}
        employeeId={employee.employee_id}
        employeeName={employee.name}
        fetchWeeklySchedule={fetchWeeklySchedule}
        onUpdateSchedule={handleUpdateSchedule}
      />
    </>
  );
}
