"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pen, Trash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Employee } from "./types";
import { toast } from "sonner";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { supabase } from "@/utils/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EmployeeTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: number) => void;
  onUpdateSchedule: (
    employeeId: number,
    schedules: WeeklySchedule
  ) => Promise<void>;
}

interface WeeklySchedule {
  [day: string]: { start_time: string | null; end_time: string | null };
}

export function EmployeeTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
  onUpdateSchedule,
}: EmployeeTableRowActionsProps<TData>) {
  const employee = row.original as Employee;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    try {
      await onEdit(editedEmployee);
      setIsEditDialogOpen(false);
      toast.success("Employee Updated", {
        description: "The employee information has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Update Failed", {
        description: "There was an error updating the employee information.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSchedule = async (schedules: WeeklySchedule) => {
    try {
      await onUpdateSchedule(employee.employee_id, schedules);
      setIsScheduleDialogOpen(false);
      // toast.success("Schedule updated successfully");
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
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pen className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Edit Schedule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(employee.employee_id)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Existing Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editedEmployee.name}
                onChange={(e) =>
                  setEditedEmployee({ ...editedEmployee, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={editedEmployee.department || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    department: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={editedEmployee.role || ""}
                onChange={(e) =>
                  setEditedEmployee({ ...editedEmployee, role: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_info" className="text-right">
                Contact Info
              </Label>
              <Input
                id="contact_info"
                value={editedEmployee.contact_info || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    contact_info: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lanid" className="text-right">
                LAN ID
              </Label>
              <Input
                id="lanid"
                value={editedEmployee.lanid || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    lanid: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rank" className="text-right">
                Rank
              </Label>
              <Input
                id="rank"
                type="number"
                value={editedEmployee.rank || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    rank: parseInt(e.target.value) || null,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pay_type" className="text-right">
                Pay Type
              </Label>
              <Select
                value={editedEmployee.pay_type}
                onValueChange={(value) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    pay_type: value as "Hourly" | "Salary",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select pay type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pay_rate" className="text-right">
                Pay Rate
              </Label>
              <Input
                id="pay_rate"
                type="number"
                step="0.01"
                value={editedEmployee.pay_rate || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    pay_rate: parseFloat(e.target.value) || null,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hire_date" className="text-right">
                Hire Date
              </Label>
              <Input
                id="hire_date"
                type="date"
                value={editedEmployee.hire_date || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    hire_date: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birthday" className="text-right">
                Birthday
              </Label>
              <Input
                id="birthday"
                type="date"
                value={editedEmployee.birthday || ""}
                onChange={(e) =>
                  setEditedEmployee({
                    ...editedEmployee,
                    birthday: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button
              variant="linkHover2"
              onClick={handleEdit}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Schedule Dialog */}
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
