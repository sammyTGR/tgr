"use client";
import dynamic from "next/dynamic";
import { getUserRole } from "@/lib/getUserRole";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

const LandingPageUser = dynamic(() => import("./LandingPageUser"));
const LandingPageAdmin = dynamic(() => import("./LandingPageAdmin"));
const LandingPageSuperAdmin = dynamic(() => import("./LandingPageSuperAdmin"));
const LandingPagePublic = dynamic(() => import("./LandingPagePublic"));

const LandingPage = () => {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (user && user.primaryEmailAddress) {
        const email = user.primaryEmailAddress.emailAddress;
        const fetchedRole = await getUserRole(email);
        setRole(fetchedRole);
      }
      setLoading(false);
    };

    if (isLoaded) {
      fetchRole();
    } else {
      setLoading(false);
    }
  }, [user, isLoaded]);

  if (loading) {
    return <div>Loading...</div>; // or a default loading component
  }

  // If the user is not logged in or has no role, show the public landing page
  if (!user || !role) {
    return <LandingPagePublic />;
  }

  if (role === "super admin") {
    return <LandingPageSuperAdmin />;
  }

  if (role === "admin") {
    return <LandingPageAdmin />;
  }

  return <LandingPageUser />;
};

export default LandingPage;
