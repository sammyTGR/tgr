"use client";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { getUserRole } from "@/lib/getUserRole";
import { useEffect, useState, useCallback } from "react";

const HeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), { ssr: false });
const HeaderPublic = dynamic(() => import("./HeaderPublic"), { ssr: false });

export default function Header() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress.toLowerCase() || user.emailAddresses[0]?.emailAddress.toLowerCase();
    const fetchedRole = await getUserRole(email);
    setRole(fetchedRole);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      fetchRole();
    } else {
      setLoading(false); // Ensure loading state is updated when user is not loaded
    }
  }, [isLoaded, fetchRole]);

  if (loading) {
    return <div></div>;
  }

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
