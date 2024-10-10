"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import LandingPagePublic from "@/components/LandingPagePublic";
import LandingPageCustomer from "@/components/LandingPageCustomer";
import { ProgressBar } from "@/components/ProgressBar";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [roleValidating, setRoleValidating] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      setProgress(10); // Initial progress

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        // console.error(
        //   "Error fetching session or no active session found:",
        //   sessionError?.message || "Auth session missing!"
        // );
        setLoading(false);
        setNoSession(true);
        setProgress(100); // Final progress
        return; // No active session found
      }

      setRoleValidating(true); // Start role validation
      setProgress(30); // Update progress

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        //console.("Error fetching user:", userError.message);
        setLoading(false);
        setRoleValidating(false); // End role validation
        setNoSession(true);
        setProgress(100); // Final progress
        return; // Fetching the user failed
      }

      const user = userData.user;
      setProgress(50); // Update progress

      // Check the employees table
      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role, employee_id")
        .eq("user_uuid", user?.id)
        .single();

      if (roleError || !roleData) {
        // Check the customers table if not found in employees table
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("role")
          .eq("email", user?.email)
          .single();

        if (customerError || !customerData) {
          console.error(
            "Error fetching role:",
            roleError?.message || customerError?.message
          );
          setLoading(false);
          setRoleValidating(false); // End role validation
          setNoSession(true);
          setProgress(100); // Final progress
          return; // No role found
        }

        const role = customerData.role;
        setRole(role);

        if (role === "customer") {
          setLoading(false);
          setRoleValidating(false); // End role validation
          setProgress(100); // Final progress
          return; // Show the customer landing page
        } else {
          //console.("Invalid role for user:", user?.email);
          setLoading(false);
          setRoleValidating(false); // End role validation
          setNoSession(true);
          setProgress(100); // Final progress
          return; // Invalid role
        }
      } else {
        const { role, employee_id } = roleData;
        setRole(role);
        setLoading(false); // End loading before redirection
        setRoleValidating(false); // End role validation
        setProgress(100); // Final progress
        if (role === "admin" || role === "super admin" || role === "dev") {
          router.push("/admin/reports/dashboard");
        } else {
          router.push(`/TGR/crew/profile/${employee_id}`);
        }
      }
    };

    fetchRoleAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <ProgressBar value={progress} showAnimation={true} />
      </div>
    ); // Show progress bar while loading
  }

  if (roleValidating) {
    return <div>Validating Role...</div>; // Show role validation message
  }

  if (noSession) {
    return <LandingPagePublic />; // Show the public landing page if no active session
  }

  if (role === "customer") {
    return <LandingPageCustomer />;
  }

  return null; // No need to show anything else
}
