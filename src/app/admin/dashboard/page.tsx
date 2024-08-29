"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { AvatarIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { Input } from "@/components/ui/input";

interface Employee {
  employee_id: number;
  name: string;
  pay_rate: string;
}

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePosition, setNewEmployeePosition] = useState("");
  const { role, user } = useRole(); // Get role and user from context
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchEmployees();
  }, [role]); // Add role as a dependency

  const fetchEmployees = async () => {
    let query = supabase
      .from("employees")
      .select("employee_id, name, pay_rate");

    // If the user's role is 'admin', filter out other 'admin' and 'super admin'
    if (role === "admin" || role === "auditor") {
      query = query.neq("role", "admin").neq("role", "super admin");
    }

    const { data, error } = await query;

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
      .select("employee_id, name, pay_rate");

    if (error) {
      console.error("Error creating employee:", error);
    } else {
      setEmployees([...employees, ...data]);
      setNewEmployeeName("");
      setNewEmployeePosition("");
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin"]}>
      <section className="w-full py-12 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Staff Profiles
            </h1>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-6">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 md:grid-cols-3">
            <Input
              className="mb-4 p-2 border rounded w-full"
              type="text"
              placeholder="Search employees by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="col-span-full flex justify-center"></div>
            {filteredEmployees.map((employee) => (
              <div
                key={employee.employee_id}
                className="flex flex-col items-center justify-center p-4 border rounded-lg shadow-md"
              >
                <AvatarIcon className="w-8 h-8 mb-2" />
                <Link href={`/admin/team/profiles/${employee.employee_id}`}>
                  <Button
                    variant="linkHover1"
                    className="text-xl font-semibold"
                  >
                    {employee.name}
                  </Button>
                </Link>
                {/* <span className="text-gray-500">{employee.pay_rate}</span> */}
              </div>
            ))}

            {/* <div className="col-span-full flex justify-center">
              <h2 className="text-2xl font-bold">Create New Employee</h2>
            </div>
            <div className="col-span-full flex flex-col items-center justify-center">
              <select
                className="mb-2 p-2 border rounded"
                value={selectedEmployeeId ?? ""}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              >
                <option value="">Select Existing Employee</option>
                {employees.map((employee) => (
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}
                  >
                    {employee.name}
                  </option>
                ))}
              </select>
              <div>or create a new one</div>
              <input
                className="mb-2 p-2 border rounded"
                type="text"
                placeholder="Employee Name"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
              />
              <input
                className="mb-2 p-2 border rounded"
                type="text"
                placeholder="Employee Position"
                value={newEmployeePosition}
                onChange={(e) => setNewEmployeePosition(e.target.value)}
              />
              <button
                className="p-2 bg-blue-500 text-white rounded"
                onClick={handleCreateEmployee}
              >
                Create Employee
              </button>
            </div> */}
          </div>
        </div>
      </section>
    </RoleBasedWrapper>
  );
};

export default Dashboard;
