// src/context/RoleContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/utils/supabase/client";

interface RoleContextType {
  role: string | null;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Error fetching session or no active session found:", sessionError?.message);
        setLoading(false);
        return;
      }

      const email = session.user?.email;
      if (!email) {
        console.error("No email found in session.");
        setLoading(false);
        return;
      }

      // Fetch role from employees table
      let { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('role')
        .eq('contact_info', email.toLowerCase())
        .single();

      if (employeeError && employeeError.code !== 'PGRST116') {
        console.error("Error fetching role from employees:", employeeError.message);
      }

      if (employeeData) {
        setRole(employeeData.role);
      } else {
        // If not found in employees, fetch from public_customers table
        const { data: customerData, error: customerError } = await supabase
          .from('public_customers')
          .select('role')
          .eq('email', email.toLowerCase())
          .single();

        if (customerError && customerError.code !== 'PGRST116') {
          console.error("Error fetching role from public_customers:", customerError.message);
        }

        if (customerData) {
          setRole(customerData.role || 'customer');
        } else {
          setRole(null);
        }
      }

      setLoading(false);
    };

    fetchRole();
  }, []);

  return (
    <RoleContext.Provider value={{ role, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
