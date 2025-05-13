"use client";

import { useRole } from "@/context/RoleContext";
import { User } from "@supabase/supabase-js";

interface EmployeeProfileClientProps {
  employeeId: number;
  children: (user: User | null) => React.ReactNode;
}

export function EmployeeProfileClient({
  employeeId,
  children,
}: EmployeeProfileClientProps) {
  const { user } = useRole();
  return <>{children(user)}</>;
}
