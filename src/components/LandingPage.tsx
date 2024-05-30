"use client";
import dynamic from "next/dynamic";
import { getUserRole } from "@/lib/getUserRole";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useRef } from "react";

const LandingPageUser = dynamic(() => import("./LandingPageUser"));
const LandingPageAdmin = dynamic(() => import("./LandingPageAdmin"));
const LandingPageSuperAdmin = dynamic(() => import("./LandingPageSuperAdmin"));
const LandingPagePublic = dynamic(() => import("./LandingPagePublic"));

const LandingPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserEmail = useRef<string | null>(null);

  const fetchRole = useCallback(async (email: string) => {
    if (email === previousUserEmail.current) {
      return; // Skip fetching if email hasn't changed
    }

    previousUserEmail.current = email;
    const fetchedRole = await getUserRole(email);
    setRole(fetchedRole);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress.toLowerCase() ||
        user.emailAddresses[0]?.emailAddress.toLowerCase();
      if (userEmail) {
        fetchRole(userEmail);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [isLoaded, user, fetchRole]);

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
