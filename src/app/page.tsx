"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import LandingPagePublic from "@/components/LandingPagePublic";
import LandingPageCustomer from "@/components/LandingPageCustomer";
import { ProgressBar } from "@/components/ProgressBar";
import { FlagValues } from "@vercel/flags/react";
import { encrypt } from "@vercel/flags";
import { useFlagsmith } from "flagsmith/react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [roleValidating, setRoleValidating] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const flagsmith = useFlagsmith();

  const flagValues = { is_chat_enabled: false, is_todo_enabled: false }; // Define your feature flags here

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      setProgress(10); // Initial progress

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error(
          "Error fetching user or no active user found:",
          userError?.message || "User data missing!"
        );
        setLoading(false);
        setNoSession(true);
        setProgress(100); // Final progress
        return; // No active user found
      }

      const user = userData.user;
      setRoleValidating(true); // Start role validation
      setProgress(30); // Update progress

      // Check the employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("role, employee_id")
        .eq("user_uuid", user.id)
        .single();

      if (employeeData) {
        const { role, employee_id } = employeeData;
        setRole(role);
        setLoading(false);
        setRoleValidating(false);
        setProgress(100);

        if (["admin", "super admin", "dev"].includes(role)) {
          router.push("/admin/reports/dashboard");
        } else {
          router.push(`/TGR/crew/profile/${employee_id}`);
        }
        return;
      }

      // If not found in employees, check the customers table
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("role")
        .eq("email", user.email)
        .single();

      if (customerData && customerData.role === "customer") {
        setRole("customer");
        setLoading(false);
        setRoleValidating(false);
        setProgress(100);
        // Customer landing page will be shown
      } else {
        console.error(
          "Error fetching role:",
          employeeError?.message || customerError?.message || "Invalid role"
        );
        setLoading(false);
        setRoleValidating(false);
        setNoSession(true);
        setProgress(100);
      }
    };

    fetchRoleAndRedirect();
  }, [router]);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-full w-full">
          <ProgressBar value={progress} showAnimation={true} />
        </div>
      ) : roleValidating ? (
        <div>Validating Role...</div>
      ) : noSession ? (
        <LandingPagePublic />
      ) : role === "customer" ? (
        <LandingPageCustomer />
      ) : null}

      <FlagValues values={flagValues} />
    </>
  );
}
