"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

interface Employee {
  employee_id: number;
  name: string;
  position: string;
}

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePosition, setNewEmployeePosition] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("employee_id, name, position");

    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      setEmployees(data);
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployeeName || !newEmployeePosition) return;

    const { data, error } = await supabase
      .from("employees")
      .insert([{ name: newEmployeeName, position: newEmployeePosition }])
      .select("employee_id, name, position");

    if (error) {
      console.error("Error creating employee:", error);
    } else {
      setEmployees([...employees, ...data]);
      setNewEmployeeName("");
      setNewEmployeePosition("");
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["super admin"]}>
      <div>
        <h1>Admin Dashboard</h1>
        <p>Welcome, Admin!</p>
        <h2>Employee List</h2>
        <ul>
          {employees.map((employee) => (
            <li key={employee.employee_id}>
              <Link href={`/admin/team/profiles/${employee.employee_id}`}>
                {employee.name}
              </Link>
              <span> - {employee.position}</span>
            </li>
          ))}
        </ul>
        <h2>Create New Employee</h2>
        <div>
          <select
            value={selectedEmployeeId ?? ""}
            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
          >
            <option value="">Select Existing Employee</option>
            {employees.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name}
              </option>
            ))}
          </select>
          <div>or create a new one</div>
          <input
            type="text"
            placeholder="Employee Name"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Employee Position"
            value={newEmployeePosition}
            onChange={(e) => setNewEmployeePosition(e.target.value)}
          />
          <button onClick={handleCreateEmployee}>Create Employee</button>
        </div>
      </div>
    </RoleBasedWrapper>
  );
};

export default Dashboard;
