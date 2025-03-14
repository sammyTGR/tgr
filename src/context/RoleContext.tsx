"use client";
import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/providers/supabase-provider";

interface RoleContextType {
  role: string | null;
  loading: boolean;
  user: any;
  error: Error | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSupabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) {
        return { role: null, user: null };
      }

      const response = await fetch("/api/getUserRole", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user role");
      }
      return response.json();
    },
    enabled: !!user,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    console.error("Error fetching user role:", error);
  }

  return (
    <RoleContext.Provider
      value={{
        role: data?.role ?? null,
        loading: isLoading,
        user: data?.user ?? null,
        error: error as Error | null,
      }}
    >
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
