"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

const LandingPageUser = dynamic(() => import("./LandingPageUser"));
const LandingPageAdmin = dynamic(() => import("./LandingPageAdmin"));
const LandingPageSuperAdmin = dynamic(() => import("./LandingPageSuperAdmin"));
const LandingPagePublic = dynamic(() => import("./LandingPagePublic"));
const LandingPageCustomer = dynamic(() => import("./LandingPageCustomer")); // Import LandingPageCustomer

const LandingPage: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const roleHeader = document.cookie
        .split("; ")
        .find((row) => row.startsWith("X-User-Role="))
        ?.split("=")[1];
      if (roleHeader) {
        setRole(roleHeader);
        setLoading(false);
      } else {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError.message);
          setLoading(false);
          return;
        }

        const user = userData.user;

        const { data: roleData, error: roleError } = await supabase
          .from("employees")
          .select("role")
          .eq("user_uuid", user?.id)
          .single();

        if (roleError) {
          console.error("Error fetching role:", roleError.message);
          setLoading(false);
          return;
        }

        setRole(roleData.role);
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show loading spinner or any placeholder
  }

  if (!role) {
    return <LandingPagePublic />;
  }

  if (role === "super admin") {
    return <LandingPageSuperAdmin />;
  }

  if (role === "admin") {
    return <LandingPageAdmin />;
  }

  if (role === "customer") {
    // Check for "customer" role
    return <LandingPageCustomer />;
  }

  return <LandingPageUser />;
};

export default LandingPage;
