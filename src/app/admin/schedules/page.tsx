"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import { useReactTable, ColumnDef, getCoreRowModel, getPaginationRowModel, getFilteredRowModel } from "@tanstack/react-table";
import { SchedulePagination } from "./schedule-pagination";
import { DataTable } from "./DataTable";
import { PopoverForm } from "./PopoverForm";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

interface ScheduleData {
  id: number;
  employee_id: number;
  employee_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  user_uuid: string;
}

const columns: ColumnDef<ScheduleData>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "day_of_week",
    header: "Day of Week",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    cell: (info) => info.getValue(),
  },
];

const ManageSchedules = () => {
  const { user } = useRole();
  const [referenceSchedules, setReferenceSchedules] = useState<ScheduleData[]>([]);

  useEffect(() => {
    fetchReferenceSchedules();
  }, []);

  const fetchReferenceSchedules = async () => {
    const { data: schedules, error: schedulesError } = await supabase.from("reference_schedules").select("*");
    if (schedulesError) {
      console.error("Error fetching reference schedules:", schedulesError);
      return;
    }

    const { data: employees, error: employeesError } = await supabase.from("employees").select("employee_id, name");
    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      return;
    }

    const schedulesWithNames = schedules.map(schedule => {
      const employee = employees.find(emp => emp.employee_id === schedule.employee_id);
      return {
        ...schedule,
        employee_name: employee ? employee.name : "Unknown",
      };
    });

    setReferenceSchedules(schedulesWithNames);
  };

  const handleGenerateSingleSchedule = async (employeeName: string, weeks: string) => {
    const { error } = await supabase.rpc("generate_schedules_for_employees_by_name", {
      employee_name: employeeName,
      weeks: parseInt(weeks, 10),
    });
    if (error) {
      console.error("Error generating schedules:", error);
    } else {
      console.log("Schedules generated successfully.");
    }
  };

  const handleClearSchedule = async (employeeName: string) => {
    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id")
      .ilike("name", `%${employeeName}%`);

    if (employeeError) {
      console.error("Error fetching employee ID:", employeeError);
      return;
    }

    if (employees.length === 0) {
      alert("No employee found with that name.");
      return;
    }

    const employeeId = employees[0].employee_id;

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("employee_id", employeeId)
      .eq("status", "scheduled");

    if (error) {
      console.error("Error clearing schedules:", error);
    } else {
      console.log("Schedules cleared for employee:", employeeName);
    }
  };

  const handleGenerateAllSchedules = async (weeks: string) => {
    const { error } = await supabase.rpc("generate_schedules_for_all_employees", {
      weeks: parseInt(weeks, 10),
    });
    if (error) {
      console.error("Error generating schedules:", error);
    } else {
      console.log("Schedules generated for all employees.");
    }
  };

  const table = useReactTable({
    data: referenceSchedules,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>

    <Card>
      <CardHeader>
        <h1>Manage Employee Schedules</h1>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={referenceSchedules}
          fetchReferenceSchedules={fetchReferenceSchedules}
        />
        <SchedulePagination table={table} />
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <PopoverForm
              onSubmit={(employeeName: string, weeks: string) => handleGenerateSingleSchedule(employeeName, weeks)}
              buttonText="Create Single Employee's Schedule"
              placeholder="Enter employee name and weeks"
            />
            <PopoverForm
              onSubmit={(employeeName: string) => handleClearSchedule(employeeName)}
              buttonText="Clear An Employee's Schedule"
              placeholder="Enter employee name"
            />
          </div>
          <PopoverForm
            onSubmit={(_, weeks: string) => handleGenerateAllSchedules(weeks)}
            buttonText="Generate All Staff Schedules"
            placeholder="Enter number of weeks"
          />
        </div>
      </CardContent>
    </Card>

    </RoleBasedWrapper>
  );
};

export default ManageSchedules;
