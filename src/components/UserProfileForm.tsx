"use client";
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

const UserProfileForm = () => {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Ensure that user is not null or undefined before submitting
    if (!user) {
      console.error('No user data available');
      return; // Prevent form submission if user is undefined
    }

    const payload = {
      clerkUserId: user.id,
      name: name,
      email: email,
      role: 'user', // Assume default role
      department: 'default' // Assume default department
    };

    try {
      const response = await fetch('/api/createEmployeeWithClerk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Employee created successfully');
      } else {
        console.error('Failed to create employee');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (!user) {
    return <p>Loading user information...</p>; // Or some other handling for when user is not available
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
};

export default UserProfileForm;
