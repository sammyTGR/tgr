"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { getUserRole } from "@/lib/getUserRole";

const LandingPageUser = dynamic(() => import("./LandingPageUser"));
const LandingPageAdmin = dynamic(() => import("./LandingPageAdmin"));
const LandingPageSuperAdmin = dynamic(() => import("./LandingPageSuperAdmin"));
const LandingPagePublic = dynamic(() => import("./LandingPagePublic"));

const LandingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
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

  const fetchUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error.message);
      setLoading(false);
      return;
    }
    const currentUser = data.user;
    setUser(currentUser);
  
    if (currentUser && currentUser.email) {
      const email = currentUser.email.toLowerCase();
      fetchRole(email);
    } else {
      setLoading(false);
    }
  }, [fetchRole]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
