// components/CreateEmployeeOnSignup.tsx
"use client";
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const CreateEmployeeOnSignup = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const { id, emailAddresses } = user;
      const email = emailAddresses[0]?.emailAddress;

      const createEmployee = async () => {
        try {
          const response = await fetch('/api/createEmployee', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: id,
              email,
              role: 'user', // or 'admin' based on your logic
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create employee');
          }

          const data = await response.json();
          console.log('Employee created:', data);
        } catch (error) {
          console.error('Error creating employee:', error);
        }
      };

      createEmployee();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
};

export default CreateEmployeeOnSignup;
