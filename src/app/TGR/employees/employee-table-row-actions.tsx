"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import {
  DotsHorizontalIcon,
  Pencil1Icon,
  TrashIcon,
  CalendarIcon,
  ExitIcon,
  ArrowUpIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee, PromotionData } from "./types";
import { toast } from "sonner";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { supabase } from "@/utils/supabase/client";
import { EditEmployeeDialog } from "./PopoverForm";
import { TermEmployeeDialog } from "./TermEmployeeDialog";
import { PromoteEmployeeDialog } from "./PromoteEmployeeDialog";
import { useQueryClient } from "@tanstack/react-query";

interface WeeklySchedule {
  [day: string]: { start_time: string | null; end_time: string | null };
}

interface EmployeeTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit: (updatedEmployee: Employee) => Promise<void>;
  onDelete: (employeeId: number) => Promise<void>;
  onUpdateSchedule: (
    employeeId: number,
    schedules: WeeklySchedule
  ) => Promise<void>;
  onTerm: (employeeId: number, termDate: string) => Promise<void>;
  onPromote: (
    employeeId: number,
    promotionData: PromotionData
  ) => Promise<void>;
}

export function EmployeeTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
  onUpdateSchedule,
  onTerm,
  onPromote,
}: EmployeeTableRowActionsProps<TData>) {
  const employee = row.original as Employee;
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEdit = async (updatedEmployee: Employee) => {
    try {
      await onEdit(updatedEmployee);
      queryClient.setQueryData(
        ["employees"],
        (oldData: Employee[] | undefined) => {
          if (!oldData) return [updatedEmployee];
          return oldData.map((emp) =>
            emp.employee_id === updatedEmployee.employee_id
              ? updatedEmployee
              : emp
          );
        }
      );
      setIsEditDialogOpen(false);
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
      toast.success("Schedule Updated", {
        description: "The employee's schedule has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const handleTerm = async (employeeId: number, termDate: string) => {
    try {
      await onTerm(employeeId, termDate);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsTermDialogOpen(false);
      toast.success("Employee Terminated", {
        description: "The employee has been successfully terminated.",
      });
    } catch (error) {
      console.error("Error terminating employee:", error);
      toast.error("Termination Failed", {
        description: "There was an error terminating the employee.",
      });
    }
  };

  const handlePromote = async (promotionData: PromotionData) => {
    try {
      await onPromote(employee.employee_id, promotionData);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsPromoteDialogOpen(false);
      toast.success("Employee Promoted", {
        description: "The employee has been successfully promoted.",
      });
    } catch (error) {
      console.error("Error promoting employee:", error);
      toast.error("Promotion Failed", {
        description: "There was an error promoting the employee.",
      });
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
          <DropdownMenuItem onClick={() => setIsPromoteDialogOpen(true)}>
            <ArrowUpIcon className="mr-2 h-4 w-4" />
            Promote Employee
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsTermDialogOpen(true)}>
            <ExitIcon className="mr-2 h-4 w-4" />
            Term Employee
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

      <TermEmployeeDialog
        isOpen={isTermDialogOpen}
        onClose={() => setIsTermDialogOpen(false)}
        employee={employee}
        onTerm={handleTerm}
      />

      <PromoteEmployeeDialog
        isOpen={isPromoteDialogOpen}
        onClose={() => setIsPromoteDialogOpen(false)}
        employee={employee}
        onPromote={handlePromote}
      />
    </>
  );
}
