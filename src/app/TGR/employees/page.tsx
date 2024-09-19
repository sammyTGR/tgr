"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/utils/supabase/client";
import { Employee } from "./types";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { EmployeeTableRowActions } from "./employee-table-row-actions";
import { toast } from "sonner";
import { Row } from "@tanstack/react-table";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import AddEmployeeDialog from "./add-employee-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
// Add this interface if not already defined
interface WeeklySchedule {
  [day: string]: { start_time: string | null; end_time: string | null };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } else {
      setEmployees(data as Employee[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (
    newEmployee: Omit<Employee, "employee_id">
  ) => {
    const { data, error } = await supabase
      .from("employees")
      .insert([newEmployee])
      .select();

    if (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
    } else {
      toast.success("Employee added successfully");
      await fetchEmployees(); // Refresh the employee list
    }
  };

  const handleEditEmployee = async (updatedEmployee: Employee) => {
    const { error } = await supabase
      .from("employees")
      .update(updatedEmployee)
      .eq("employee_id", updatedEmployee.employee_id);

    if (error) {
      console.error("Error updating employee:", error);
      throw error; // This will be caught in the EmployeeTableRowActions component
    } else {
      await fetchEmployees(); // Refresh the employee list
    }
  };

  const handleTermEmployee = async (employeeId: number, termDate: string) => {
    try {
      // Update the employee record
      const { error: updateError } = await supabase
        .from("employees")
        .update({ term_date: termDate })
        .eq("employee_id", employeeId);

      if (updateError) throw updateError;

      // Delete records from reference_schedules
      const { error: deleteRefError } = await supabase
        .from("reference_schedules")
        .delete()
        .eq("employee_id", employeeId);

      if (deleteRefError) throw deleteRefError;

      // Delete future schedules
      const { error: deleteSchedError } = await supabase
        .from("schedules")
        .delete()
        .eq("employee_id", employeeId)
        .gte("schedule_date", termDate);

      if (deleteSchedError) throw deleteSchedError;

      toast.success("Employee terminated successfully");
      await fetchEmployees(); // Refresh the employee list
    } catch (error) {
      console.error("Error terminating employee:", error);
      toast.error("Failed to terminate employee");
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error deleting employee:", error);
      throw error; // This will be caught in the EmployeeTableRowActions component
    } else {
      await fetchEmployees(); // Refresh the employee list
    }
  };

  const handleUpdateSchedule = async (
    employeeId: number,
    schedules: WeeklySchedule
  ) => {
    const employee = employees.find((emp) => emp.employee_id === employeeId);
    if (!employee) {
      console.error("Employee not found");
      return;
    }

    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    for (const day of daysOfWeek) {
      const times = schedules[day] || { start_time: null, end_time: null };

      // First, try to select the existing record
      const { data: existingRecord, error: selectError } = await supabase
        .from("reference_schedules")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("day_of_week", day)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        console.error(
          `Error checking existing record for ${day}:`,
          selectError
        );
        toast.error(
          `Failed to check existing record for ${day}: ${selectError.message}`
        );
        return;
      }

      let error;
      if (existingRecord) {
        // If record exists, update it
        const { error: updateError } = await supabase
          .from("reference_schedules")
          .update({
            start_time: times.start_time,
            end_time: times.end_time,
            name: employee.name,
          })
          .eq("id", existingRecord.id);
        error = updateError;
      } else {
        // If record doesn't exist, insert a new one
        const { error: insertError } = await supabase
          .from("reference_schedules")
          .insert({
            id: existingRecord?.id,
            employee_id: employeeId,
            day_of_week: day,
            start_time: times.start_time,
            end_time: times.end_time,
            name: employee.name,
          });
        error = insertError;
      }

      if (error) {
        console.error(`Error updating/inserting schedule for ${day}:`, error);
        console.log("Attempted operation:", {
          employee_id: employeeId,
          day_of_week: day,
          start_time: times.start_time,
          end_time: times.end_time,
          name: employee.name,
        });
        toast.error(`Failed to update schedule for ${day}: ${error.message}`);
        return;
      }
    }

    toast.success(`Updated schedule for ${employee.name}`);
    await fetchEmployees();
  };

  const tableColumns = useMemo(
    () =>
      columns.map((col) => {
        if (col.id === "actions") {
          return {
            ...col,
            cell: ({ row }: { row: Row<Employee> }) => (
              <EmployeeTableRowActions
                row={row}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                onUpdateSchedule={handleUpdateSchedule}
                onTerm={handleTermEmployee}
              />
            ),
          };
        }
        return col;
      }),
    [
      handleEditEmployee,
      handleDeleteEmployee,
      handleUpdateSchedule,
      handleTermEmployee,
    ]
  );

  return (
    <RoleBasedWrapper allowedRoles={["super admin"]}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">Employees</h1>
          <Button variant="linkHover2" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
        {isLoading ? (
          <p>Loading employees...</p>
        ) : (
          <DataTable columns={tableColumns} data={employees} />
        )}
        <AddEmployeeDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAddEmployee}
        />
      </div>
    </RoleBasedWrapper>
  );
}
