"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { Input } from "@/components/ui/input";
import { fetchEmployees, Employee } from "./actions";
import { User } from "lucide-react";

const Dashboard = () => {
  const { role } = useRole();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees", role],
    queryFn: async () => {
      const result = await fetchEmployees(role);
      if ("error" in result) {
        throw new Error(result.error as string);
      }
      return result as Employee[];
    },
  });

  const filteredEmployees = (employees || []).filter((employee: Employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleBasedWrapper
      allowedRoles={["auditor", "admin", "ceo", "super admin", "dev"]}
    >
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
                className="flex flex-col items-center justify-between p-4 shadow-md h-[300px]"
              >
                <div className="flex items-center justify-center flex-1">
                  <Avatar
                    className={employee.avatar_url ? "w-48 h-48" : "w-24 h-24"}
                  >
                    <AvatarImage
                      src={employee.avatar_url || ""}
                      alt={employee.name}
                    />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Link href={`/admin/team/profiles/${employee.employee_id}`}>
                  <Button variant="ghost" className="text-xl font-semibold">
                    {employee.name}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </RoleBasedWrapper>
  );
};

export default Dashboard;
