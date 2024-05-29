// src/components/UserSessionHandler.tsx
"use client";
import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface UserDetails {
  clerkUserId: string;
  contact_info: string;
  name: string;
}

const UserSessionHandler = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const updateOrCreateEmployee = async (userDetails: UserDetails) => {
      try {
        const response = await fetch("/api/updateEmployee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userDetails),
        });

        if (!response.ok) {
          console.error(
            "Failed to update employee data:",
            await response.text()
          );
        } else {
          console.log("Employee data updated successfully");
          router.refresh(); // Refresh the page to reload user data and role
        }
      } catch (error) {
        console.error("An error occurred while updating employee data:", error);
      }
    };

    if (user) {
      const primaryEmail = user.primaryEmailAddress?.emailAddress;
      const backupEmail =
        user.emailAddresses.length > 0
          ? user.emailAddresses[0].emailAddress
          : null;
      const firstName = user.firstName || "Unnamed User";

      if (primaryEmail) {
        const userDetails: UserDetails = {
          clerkUserId: user.id,
          contact_info: primaryEmail.toLowerCase(),
          name: firstName,
        };
        // console.log('Updating employee with:', userDetails); // Log user details
        updateOrCreateEmployee(userDetails);
      } else if (backupEmail) {
        const userDetails: UserDetails = {
          clerkUserId: user.id,
          contact_info: backupEmail.toLowerCase(),
          name: firstName,
        };
        // console.log('Updating employee with backup email:', userDetails); // Log user details
        updateOrCreateEmployee(userDetails);
      } else {
        console.error("No valid email address found for the user.");
      }
    }
  }, [user, router]);

  return null; // This component does not render anything
};

export default UserSessionHandler;
