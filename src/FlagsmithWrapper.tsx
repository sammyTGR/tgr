"use client";

import { supabase } from "@/utils/supabase/client";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { FlagsmithProvider } from "flagsmith/react";
import flagsmith from "flagsmith/isomorphic";
import { IState } from "flagsmith/types";
import { ReactElement, useEffect, useState } from "react";

interface FlagsmithWrapperProps {
  flagsmithState: IState<string> | undefined;
  children: React.ReactNode;
}

function FlagsmithWrapperInner({
  flagsmithState,
  children,
}: FlagsmithWrapperProps) {
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
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("role")
        .eq("email", user.email)
        .single();

      if (customerData) return customerData.role;

      // if (roleError && customerError) {
      //   console.error(
      //     "Error fetching role:",
      //     roleError.message,
      //     customerError.message
      //   );
      // }

      return null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const initFlagsmith = async () => {
      const environmentID = process.env.NEXT_PUBLIC_FLAGSMITH_ENVIRONMENT_ID!;
      if (!environmentID) {
        console.warn("Flagsmith environment ID is not set");
        setIsInitialized(true);
        return;
      }

      try {
        await flagsmith.init({
          environmentID,
          state: flagsmithState,
          identity: role || "my_user_id",
        });

        if (user && role) {
          flagsmith.setTraits({
            email: user.email || "",
            role: role,
          });
        }

        // console.log("Flagsmith initialized with role:", role);
        setIsInitialized(true);
      } catch (error) {
        // console.error("Failed to initialize Flagsmith:", error);
        setIsInitialized(true);
      }
    };

    if (!isUserLoading && !isRoleLoading) {
      initFlagsmith();
    }
  }, [flagsmithState, user, role, isUserLoading, isRoleLoading]);

  if (!isInitialized || isUserLoading || isRoleLoading) {
    return null; // or a loading indicator
  }

  return (
    <FlagsmithProvider flagsmith={flagsmith}>
      {children as ReactElement}
    </FlagsmithProvider>
  );
}

export default function FlagsmithWrapper(props: FlagsmithWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <FlagsmithWrapperInner {...props} />
    </QueryClientProvider>
  );
}
