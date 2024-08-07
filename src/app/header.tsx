"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { ProgressBar } from "@/components/ProgressBar";

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
const HeaderAuditor = dynamic(() => import("./HeaderAuditor"), { ssr: false }); // Import HeaderAuditor

export default function Header() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchRole = async () => {
      setProgress(10); // Initial progress

      const roleHeader = document.cookie
        .split("; ")
        .find((row) => row.startsWith("X-User-Role="))
        ?.split("=")[1];
      if (roleHeader) {
        setRole(roleHeader);
        setLoading(false);
        setProgress(100); // Final progress
      } else {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError.message);
          setLoading(false);
          setProgress(100); // Final progress
          return;
        }

        const user = userData.user;
        setProgress(40); // Update progress

        // Check the employees table
        const { data: roleData, error: roleError } = await supabase
          .from("employees")
          .select("role")
          .eq("user_uuid", user?.id)
          .single();

        setProgress(70); // Update progress

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
            setProgress(100); // Final progress
            return;
          }

          setRole(customerData.role);
        } else {
          setRole(roleData.role);
        }

        setProgress(100); // Final progress
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {/* <ProgressBar value={progress} showAnimation={true} /> */}
      </div>
    ); // Show progress bar while loading
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

  if (role === "gunsmith") {
    return <HeaderGunsmith />;
  }

  if (role === "auditor") {
    return <HeaderAuditor />; // Add this condition
  }

  return <HeaderUser />;
}
