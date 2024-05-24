"use client";
import dynamic from "next/dynamic";
import { getUserRole } from "@/lib/getUserRole";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

const LandingPageUser = dynamic(() => import("./LandingPageUser"));
const LandingPageAdmin = dynamic(() => import("./LandingPageAdmin"));
const LandingPageSuperAdmin = dynamic(() => import("./LandingPageSuperAdmin"));

const LandingPage = () => {
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (user && user.primaryEmailAddress) {
        const email = user.primaryEmailAddress.emailAddress;
        const fetchedRole = await getUserRole(email);
        setRole(fetchedRole);
        console.log(`Fetched and set role: ${fetchedRole}`);
      }
    };

    fetchRole();
  }, [user]);

  if (!role) {
    console.log("Role is null, showing Loading...");
    return <div>Loading...</div>; // or a default loading component
  }

  console.log(`Rendering Landing Page with Role: ${role}`);

  if (role === "super admin") {
    return <LandingPageSuperAdmin />;
  }

  if (role === "admin") {
    return <LandingPageAdmin />;
  }

  return <LandingPageUser />;
};

export default LandingPage;
