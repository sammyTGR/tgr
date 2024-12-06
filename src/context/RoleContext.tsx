"use client";
import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface RoleContextType {
  role: string | null;
  loading: boolean;
  user: any;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user role");
      }
      return response.json();
    },
    retry: false,
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
