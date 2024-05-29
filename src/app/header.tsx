"use client";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { getUserRole } from "@/lib/getUserRole";
import { useEffect, useState } from "react";

const HeaderUser = dynamic(() => import("./HeaderUser"));
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"));
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"));
const HeaderPublic = dynamic(() => import("./HeaderPublic"));

export default function Header() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const email = user.primaryEmailAddress?.emailAddress.toLowerCase() || user.emailAddresses[0]?.emailAddress.toLowerCase();
      const fetchedRole = await getUserRole(email);
      setRole(fetchedRole);
      setLoading(false);
    }

    if (isLoaded) {
      getRole();
    } else {
      setLoading(false); // Ensure loading state is updated when user is not loaded
    }
  }, [user, isLoaded]);

  if (loading) {
    return <div></div>;
  }

  // Check if the user is not authenticated or role is null
  if (!user || role === null) {
    return <HeaderPublic />;
  }

  if (role === "super admin") {
    return <HeaderSuperAdmin />;
  }

  if (role === "admin") {
    return <HeaderAdmin />;
  }

  return <HeaderUser />;
}
