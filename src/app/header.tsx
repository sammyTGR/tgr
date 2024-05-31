"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { getUserRole } from "@/lib/getUserRole";

const HeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
  ssr: false,
});
const HeaderPublic = dynamic(() => import("./HeaderPublic"), { ssr: false });

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (email: string) => {
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
