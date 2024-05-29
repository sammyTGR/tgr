"use client";

import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSignUp } from "@clerk/nextjs";

interface UserDetails {
  clerkUserId: string;
  contact_info: string;
  name: string;
}

const CustomSignUp = () => {
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    const handleSignUpComplete = async () => {
      if (signUp && signUp.status === "complete") {
        const clerkUserId = signUp.createdUserId ?? "";
        const emailAddress = signUp.emailAddress ?? "";
        const name = signUp.firstName ?? "Unnamed User";

        await updateOrCreateEmployee({ clerkUserId, contact_info: emailAddress, name });

        // Set the user as active and then redirect
        await setActive({ session: signUp.createdSessionId });
        router.push("/"); // Navigate to the home page
      }
    };

    handleSignUpComplete();
  }, [signUp, setActive, router]);

  const updateOrCreateEmployee = async ({
    clerkUserId,
    contact_info,
    name,
  }: UserDetails) => {
    try {
      const response = await fetch("/api/updateEmployee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clerkUserId, contact_info, name }),
      });

      if (!response.ok) {
        console.error("Failed to update employee data:", await response.text());
      } else {
        console.log("Employee data updated successfully");
      }
    } catch (error) {
      console.error("An error occurred while updating employee data:", error);
    }
  };

  return <SignUp />;
};

export default CustomSignUp;
