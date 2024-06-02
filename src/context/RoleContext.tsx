// src/context/RoleContext.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/utils/supabase/client";

interface RoleContextType {
  role: string | null;
  loading: boolean;
  user: any; // Add user to context
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error fetching user or no active session found:", error?.message);
        setLoading(false);
        return;
      }

      setUser(user); // Set the user
      const email = user.email;
      if (!email) {
        console.error("No email found in user.");
        setLoading(false);
        return;
      }

      let { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("role")
        .eq("contact_info", email.toLowerCase())
        .single();

      if (employeeError && employeeError.code !== "PGRST116") {
        console.error(
          "Error fetching role from employees:",
          employeeError.message
        );
      }

      if (employeeData) {
        setRole(employeeData.role);
      } else {
        const { data: customerData, error: customerError } = await supabase
          .from("public_customers")
          .select("role")
          .eq("email", email.toLowerCase())
          .single();

        if (customerError && customerError.code !== "PGRST116") {
          console.error(
            "Error fetching role from public_customers:",
            customerError.message
          );
        }

        if (customerData) {
          setRole(customerData.role || "customer");
        } else {
          setRole(null);
        }
      }

      setLoading(false);
    };

    fetchRole();
  }, []);

  return (
    <RoleContext.Provider value={{ role, loading, user }}>
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
