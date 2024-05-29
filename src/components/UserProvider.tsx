"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { getUserRole } from "@/lib/getUserRole";

interface UserContextType {
  user: ReturnType<typeof useClerkUser>['user'] | null;
  role: string | null;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useClerkUser();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && user.primaryEmailAddress) {
        const email = user.primaryEmailAddress.emailAddress.toLowerCase();
        const fetchedRole = await getUserRole(email);
        setRole(fetchedRole);
      }
    };

    if (isLoaded) {
      fetchUserRole();
    }
  }, [user, isLoaded]);

  return (
    <UserContext.Provider value={{ user, role }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
