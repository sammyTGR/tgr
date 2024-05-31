"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

interface UserDetails {
  user_uuid: string;
  contact_info: string;
  name: string;
}

const UserSessionHandler: React.FC = () => {
  const router = useRouter();
  const previousUserDetails = useRef<UserDetails | null>(null);

  const updateOrCreateEmployee = useCallback(async (userDetails: UserDetails) => {
    if (JSON.stringify(previousUserDetails.current) === JSON.stringify(userDetails)) {
      return; // Skip the update if details haven't changed
    }

    previousUserDetails.current = userDetails;

    try {
      const response = await fetch("/api/updateEmployee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDetails),
      });

      if (!response.ok) {
        console.error("Failed to update employee data:", await response.text());
      } else {
        console.log("Employee data updated successfully");
        router.refresh(); // Refresh the page to reload user data and role
      }
    } catch (error) {
      console.error("An error occurred while updating employee data:", error);
    }
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("Failed to fetch user:", error);
        return;
      }

      const user = data.user;
      const email = user.email?.toLowerCase();
      const firstName = user.user_metadata?.full_name.split(" ")[0] || "Unnamed User"; // Assume full_name exists in user_metadata

      const userDetails: UserDetails = {
        user_uuid: user.id,
        contact_info: email || "",
        name: firstName,
      };

      if (userDetails.contact_info) {
        updateOrCreateEmployee(userDetails);
      } else {
        console.error("No valid email address found for the user.");
      }
    };

    fetchUser();
  }, [updateOrCreateEmployee]);

  return null; // This component does not render anything
};

export default UserSessionHandler;
