"use client";

import { ReactElement, useEffect, useState } from "react";
import { FlagsmithProvider } from "flagsmith/react";
import flagsmith from "flagsmith/isomorphic";
import { IState } from "flagsmith/types";
import { supabase } from "@/utils/supabase/client";

interface FlagsmithWrapperProps {
  flagsmithState: IState<string> | undefined;
  children: React.ReactNode;
}

export default function FlagsmithWrapper({
  flagsmithState,
  children,
}: FlagsmithWrapperProps) {
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchRoleAndInitFlagsmith = async () => {
      const environmentID = process.env.NEXT_PUBLIC_FLAGSMITH_ENVIRONMENT_ID!;
      if (!environmentID) {
        console.warn("Flagsmith environment ID is not set");
        return;
      }

      try {
        // Fetch user and role
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError.message);
          return;
        }

        const user = userData.user;
        setUser(user);

        let userRole = null;

        // Check the employees table
        const { data: roleData, error: roleError } = await supabase
          .from("employees")
          .select("role")
          .eq("user_uuid", user?.id)
          .single();

        if (roleError || !roleData) {
          // Check the customer table if not found in employees table
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("role")
            .eq("email", user?.email)
            .single();

          if (customerError || !customerData) {
            console.error(
              "Error fetching role:",
              roleError?.message || customerError?.message
            );
          } else {
            userRole = customerData.role;
          }
        } else {
          userRole = roleData.role;
        }

        setRole(userRole);

        // Initialize Flagsmith
        await flagsmith.init({
          environmentID,
          state: flagsmithState,
          identity: userRole || "my_user_id",
        });

        if (user && userRole) {
          flagsmith.setTraits({
            email: user.email || "",
            role: userRole, // Add role as a trait
          });
        }

        console.log("Flagsmith initialized with role:", userRole); // Add this log
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Flagsmith:", error);
      }
    };

    fetchRoleAndInitFlagsmith();
  }, [flagsmithState]);

  if (!isInitialized) {
    return null; // or a loading indicator
  }

  return (
    <FlagsmithProvider flagsmith={flagsmith}>
      {children as ReactElement}
    </FlagsmithProvider>
  );
}
