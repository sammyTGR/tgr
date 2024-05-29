// src/components/UserSessionHandler.tsx
"use client";
import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserDetails {
  clerkUserId: string;
  contact_info: string | null;
  name: string;
}

const UserSessionHandler = () => {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const primaryEmail = user.primaryEmailAddress?.emailAddress;
      const backupEmail = user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : null;
      const firstName = user.firstName || 'Unnamed User';

      if (primaryEmail) {
        const userDetails: UserDetails = {
          clerkUserId: user.id,
          contact_info: primaryEmail.toLowerCase(),
          name: firstName,
        };
        updateOrCreateEmployee(userDetails);
      } else if (backupEmail) {
        const userDetails: UserDetails = {
          clerkUserId: user.id,
          contact_info: backupEmail.toLowerCase(),
          name: firstName,
        };
        updateOrCreateEmployee(userDetails);
      } else {
        console.error('No valid email address found for the user.');
      }
    }
  }, [user]);

  return null; // This component does not render anything
};

export default UserSessionHandler;

async function updateOrCreateEmployee(userDetails: UserDetails) {
  try {
    const response = await fetch('/api/updateEmployee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDetails)
    });

    if (!response.ok) {
      console.error('Failed to update employee data:', await response.text());
    } else {
      console.log('Employee data updated successfully');
    }
  } catch (error) {
    console.error('An error occurred while updating employee data:', error);
  }
}
