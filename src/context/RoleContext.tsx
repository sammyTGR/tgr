"use client";
import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface RoleContextType {
  role: string | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface RoleProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children, initialSession }: RoleProviderProps) {
  const {
    data: { role, user } = { role: null, user: null },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["role"],
    queryFn: async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return { role: null, user: null };

        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("role")
          .eq("user_uuid", user.id)
          .eq("status", "active")
          .single();

        if (employeeData) {
          return { role: employeeData.role, user };
        }

        if (!employeeError || employeeError.code === "PGRST116") {
          const { data: customerData } = await supabase
            .from("customers")
            .select("role")
            .eq("email", user.email)
            .single();

          return { role: customerData?.role || null, user };
        }

        throw employeeError;
      } catch (error) {
        console.error("Role fetch error:", error);
        throw error;
      }
    },
    enabled: !!initialSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <RoleContext.Provider
      value={{ role, user, loading: isLoading, error: error as Error | null }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
