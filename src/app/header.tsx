"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import HeaderDev from "./HeaderDev";

const HeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
  ssr: false,
});
const HeaderPublic = dynamic(() => import("./HeaderPublic"), { ssr: false });
const HeaderCustomer = dynamic(() => import("./HeaderCustomer"), {
  ssr: false,
});
const HeaderGunsmith = dynamic(() => import("./HeaderGunsmith"), {
  ssr: false,
});
const HeaderAuditor = dynamic(() => import("./HeaderAuditor"), { ssr: false });

export default function Header() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        //console.("Error fetching user:", userError.message);
        setLoading(false);
        return;
      }

      const user = userData.user;

      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role")
        .eq("user_uuid", user?.id)
        .single();

      if (roleError || !roleData) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("role")
          .eq("email", user?.email)
          .single();

        if (customerError || !customerData) {
          // console.error(
          //   "Error fetching role:",
          //   customerError?.message || roleError?.message
          // );
          setLoading(false);
          return;
        }

        setRole(customerData.role);
      } else {
        setRole(roleData.role);
      }

      setLoading(false);
    };

    fetchRole();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!role) {
    return <HeaderPublic />;
  }

  switch (role) {
    case "super admin":
      return <HeaderSuperAdmin />;
    case "dev":
      return <HeaderDev />;
    case "admin":
      return <HeaderAdmin />;
    case "customer":
      return <HeaderCustomer />;
    case "gunsmith":
      return <HeaderGunsmith />;
    case "auditor":
      return <HeaderAuditor />;
    default:
      return <HeaderUser />;
  }
}
