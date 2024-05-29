"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, SignUp as ClerkSignUp } from "@clerk/nextjs";

const CustomSignUp = () => {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    const handleSignUp = async () => {
      if (isLoaded && signUp.status === "complete") {
        const userId = signUp.createdUserId;
        const email = signUp.emailAddress?.toLowerCase(); // Ensure emailAddress exists
        const name = signUp.firstName || ""; // Use the first name as the name

        if (!email) {
          console.error("Email address is missing");
          return;
        }

        const response = await fetch("/api/updateEmployee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clerkUserId: userId, name, contact_info: email }),
        });

        if (response.ok) {
          // Redirect to the user dashboard after successful sign-up
          router.push("/user-dashboard");
        } else {
          console.error("Failed to create employee entry");
        }
      }
    };

    handleSignUp();
  }, [isLoaded, signUp, router]);

  return <ClerkSignUp />;
};

export default CustomSignUp;
