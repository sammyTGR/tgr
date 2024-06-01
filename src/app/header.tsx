"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "../context/RoleContext";

const HeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
  ssr: false,
});
const HeaderPublic = dynamic(() => import("./HeaderPublic"), { ssr: false });
const HeaderCustomer = dynamic(() => import("./HeaderCustomer"), { ssr: false });

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const { role, loading } = useRole();

  const fetchUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error.message);
      return;
    }
    const currentUser = data.user;
    setUser(currentUser);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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

  if (role === "customer") {
    return <HeaderCustomer />;
  }

  return <HeaderUser />;
}
