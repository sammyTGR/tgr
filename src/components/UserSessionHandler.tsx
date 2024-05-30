"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface UserDetails {
  clerkUserId: string;
  contact_info: string;
  name: string;
}

const UserSessionHandler: React.FC = () => {
  const { user } = useUser();
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
    if (!user) return;

    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    const backupEmail = user.emailAddresses.length > 0
      ? user.emailAddresses[0].emailAddress
      : null;
    const firstName = user.firstName || "Unnamed User";

    const userDetails: UserDetails = {
      clerkUserId: user.id,
      contact_info: (primaryEmail || backupEmail)?.toLowerCase() || "",
      name: firstName,
    };

    if (userDetails.contact_info) {
      updateOrCreateEmployee(userDetails);
    } else {
      console.error("No valid email address found for the user.");
    }
  }, [user, updateOrCreateEmployee]);

  return null; // This component does not render anything
};

export default UserSessionHandler;
