"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Employee, PromotionData } from "./types";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { EmployeeTableRowActions } from "./employee-table-row-actions";
import { toast } from "sonner";
import { Row } from "@tanstack/react-table";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import AddEmployeeDialog from "./add-employee-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

interface WeeklySchedule {
  [day: string]: { start_time: string | null; end_time: string | null };
}

export default function EmployeesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showTerminated, setShowTerminated] = useState(false);
  const queryClient = useQueryClient();

  const fetchEmployees = async () => {
    let query = supabase.from("employees").select("*").order("name");

    if (!showTerminated) {
      query = query.neq("status", "terminated");
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as Employee[];
  };

  const {
    data: employees,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employees", showTerminated],
    queryFn: fetchEmployees,
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (newEmployee: Omit<Employee, "employee_id">) => {
      const { data, error } = await supabase
        .from("employees")
        .insert([newEmployee])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully");
    },
    onError: (error: any) => {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
    },
  });

  const editEmployeeMutation = useMutation({
    mutationFn: async (updatedEmployee: Employee) => {
      const { data, error } = await supabase
        .from("employees")
        .update(updatedEmployee)
        .eq("employee_id", updatedEmployee.employee_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      // toast.success("Employee updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
    },
  });

  const termEmployeeMutation = useMutation({
    mutationFn: async ({
      employeeId,
      termDate,
    }: {
      employeeId: number;
      termDate: string;
    }) => {
      const { error: updateError } = await supabase
        .from("employees")
        .update({ term_date: termDate, status: "terminated" })
        .eq("employee_id", employeeId);

      if (updateError) throw updateError;

      const { error: deleteRefError } = await supabase
        .from("reference_schedules")
        .delete()
        .eq("employee_id", employeeId);

      if (deleteRefError) throw deleteRefError;

      const { error: deleteSchedError } = await supabase
        .from("schedules")
        .delete()
        .eq("employee_id", employeeId)
        .gte("schedule_date", termDate);

      if (deleteSchedError) throw deleteSchedError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee terminated successfully");
    },
    onError: (error: any) => {
      console.error("Error terminating employee:", error);
      toast.error("Failed to terminate employee");
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const { data, error } = await supabase
        .from("employees")
        .delete()
        .eq("employee_id", employeeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({
      employeeId,
      schedules,
    }: {
      employeeId: number;
      schedules: WeeklySchedule;
    }) => {
      const employee = employees?.find((emp) => emp.employee_id === employeeId);
      if (!employee) {
        throw new Error("Employee not found");
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

        const { data: existingRecord, error: selectError } = await supabase
          .from("reference_schedules")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("day_of_week", day)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          throw selectError;
        }

        if (existingRecord) {
          const { error: updateError } = await supabase
            .from("reference_schedules")
            .update({
              start_time: times.start_time,
              end_time: times.end_time,
              name: employee.name,
            })
            .eq("id", existingRecord.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("reference_schedules")
            .insert({
              employee_id: employeeId,
              day_of_week: day,
              start_time: times.start_time,
              end_time: times.end_time,
              name: employee.name,
            });

          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Schedule updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async ({
      employeeId,
      promotionData,
    }: {
      employeeId: number;
      promotionData: PromotionData;
    }) => {
      const { data, error } = await supabase
        .from("employees")
        .update({
          role: promotionData.newRole,
          pay_type: promotionData.newPayType,
          pay_rate: promotionData.newPayRate,
          promotion_date: promotionData.promotionDate,
        })
        .eq("employee_id", employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["employees"],
        (oldData: Employee[] | undefined) => {
          if (!oldData) return [data];
          return oldData.map((emp) =>
            emp.employee_id === data.employee_id ? data : emp
          );
        }
      );
      toast.success("Employee promoted successfully");
    },
    onError: (error: any) => {
      console.error("Error promoting employee:", error);
      toast.error("Failed to promote employee");
    },
  });

  const tableColumns = useMemo(
    () =>
      columns.map((col) => {
        if (col.id === "actions") {
          return {
            ...col,
            cell: ({ row }: { row: Row<Employee> }) => (
              <EmployeeTableRowActions
                row={row}
                onEdit={(updatedEmployee: Employee) =>
                  new Promise<void>((resolve) => {
                    editEmployeeMutation.mutate(updatedEmployee, {
                      onSuccess: () => resolve(),
                      onError: () => resolve(),
                    });
                  })
                }
                onDelete={(employeeId: number) =>
                  new Promise<void>((resolve) => {
                    deleteEmployeeMutation.mutate(employeeId, {
                      onSuccess: () => resolve(),
                      onError: () => resolve(),
                    });
                  })
                }
                onUpdateSchedule={(
                  employeeId: number,
                  schedules: WeeklySchedule
                ) =>
                  new Promise<void>((resolve) => {
                    updateScheduleMutation.mutate(
                      { employeeId, schedules },
                      {
                        onSuccess: () => resolve(),
                        onError: () => resolve(),
                      }
                    );
                  })
                }
                onTerm={(employeeId: number, termDate: string) =>
                  new Promise<void>((resolve) => {
                    termEmployeeMutation.mutate(
                      { employeeId, termDate },
                      {
                        onSuccess: () => resolve(),
                        onError: () => resolve(),
                      }
                    );
                  })
                }
                onPromote={(employeeId: number, promotionData: PromotionData) =>
                  new Promise<void>((resolve) => {
                    promoteMutation.mutate(
                      { employeeId, promotionData },
                      {
                        onSuccess: () => resolve(),
                        onError: () => resolve(),
                      }
                    );
                  })
                }
              />
            ),
          };
        }
        return col;
      }),
    [
      editEmployeeMutation,
      deleteEmployeeMutation,
      updateScheduleMutation,
      termEmployeeMutation,
      promoteMutation,
    ]
  );

  if (error) {
    return <div>Error loading employees</div>;
  }

  return (
    <RoleBasedWrapper allowedRoles={["super admin", "dev"]}>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mt-8">Manage Employees</h1>
        <div className="flex ml-10 mr-2 space-x-2 items-center justify-end mb-5">
          <Button variant="linkHover2" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
          <Label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showTerminated}
              onChange={(e) => setShowTerminated(e.target.checked)}
            />
            <span>Show Terminated Employees</span>
          </Label>
        </div>
        {isLoading ? (
          <p>Loading employees...</p>
        ) : (
          <DataTable columns={tableColumns} data={employees || []} />
        )}
        <AddEmployeeDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={(newEmployee) => addEmployeeMutation.mutate(newEmployee)}
        />
      </div>
    </RoleBasedWrapper>
  );
}
