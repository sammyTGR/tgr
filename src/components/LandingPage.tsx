"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "../context/RoleContext";

const LandingPageUser = dynamic(() => import("./LandingPageUser"));
const LandingPageAdmin = dynamic(() => import("./LandingPageAdmin"));
const LandingPageSuperAdmin = dynamic(() => import("./LandingPageSuperAdmin"));
const LandingPagePublic = dynamic(() => import("./LandingPagePublic"));

const LandingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { role } = useRole();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, []);

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
