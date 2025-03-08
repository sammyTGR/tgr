"use client";

import { supabase } from "@/utils/supabase/client";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { FlagsmithProvider } from "flagsmith/react";
import flagsmith from "flagsmith/isomorphic";
import { ReactElement, useEffect, useState } from "react";

interface FlagsmithWrapperProps {
  children: React.ReactNode;
}

function FlagsmithWrapperInner({ children }: FlagsmithWrapperProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const { data: role, isLoading: isRoleLoading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check the employees table
      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role")
        .eq("user_uuid", user.id)
        .single();

      if (roleData) return roleData.role;

      // Check the customer table if not found in employees table
      const { data: customerData } = await supabase
        .from("customers")
        .select("role")
        .eq("email", user.email || "")
        .single();

      if (customerData) return customerData.role;

      return null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const initFlagsmith = async () => {
      const environmentID = process.env.NEXT_PUBLIC_FLAGSMITH_ENVIRONMENT_ID;
      if (!environmentID) {
        console.warn("Flagsmith environment ID is not set");
        setIsInitialized(true);
        return;
      }

      try {
        await flagsmith.init({
          environmentID,
          identity: user?.id || undefined,
        });

        if (user && role) {
          await flagsmith.setTraits({
            email: user.email || "",
            role: role,
          });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Flagsmith:", error);
        setIsInitialized(true);
      }
    };

    if (!isUserLoading && !isRoleLoading) {
      initFlagsmith();
    }
  }, [user, role, isUserLoading, isRoleLoading]);

  if (!isInitialized || isUserLoading || isRoleLoading) {
    return null; // or a loading indicator
  }

  return (
    <FlagsmithProvider flagsmith={flagsmith}>
      {children as ReactElement}
    </FlagsmithProvider>
  );
}

export default function FlagsmithWrapper({ children }: FlagsmithWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <FlagsmithWrapperInner>{children}</FlagsmithWrapperInner>
    </QueryClientProvider>
  );
}
