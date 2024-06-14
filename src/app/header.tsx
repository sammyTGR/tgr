// src/components/Header.tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

const HeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
  ssr: false,
});
const HeaderPublic = dynamic(() => import("./HeaderPublic"), { ssr: false });
const HeaderCustomer = dynamic(() => import("./HeaderCustomer"), {
  ssr: false,
});

export default function Header() {
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

        // Check the employees table
        const { data: roleData, error: roleError } = await supabase
          .from("employees")
          .select("role")
          .eq("user_uuid", user?.id)
          .single();

        if (roleError || !roleData) {
          // Check the public_customers table if not found in employees table
          const { data: customerData, error: customerError } = await supabase
            .from("profiles")
            .select("role")
            .eq("email", user?.email)
            .single();

          if (customerError || !customerData) {
            console.error(
              "Error fetching role:",
              roleError?.message || customerError?.message
            );
            setLoading(false);
            return;
          }

          setRole(customerData.role);
        } else {
          setRole(roleData.role);
        }

        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) {
    return <div></div>; // Show loading spinner or any placeholder
  }

  if (!role) {
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
