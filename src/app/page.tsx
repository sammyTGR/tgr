"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import LandingPagePublic from "@/components/LandingPagePublic";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [roleValidating, setRoleValidating] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error(
          "Error fetching session or no active session found:",
          sessionError?.message || "Auth session missing!"
        );
        setLoading(false);
        setNoSession(true);
        return; // No active session found
      }

      setRoleValidating(true); // Start role validation

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError.message);
        setLoading(false);
        setRoleValidating(false); // End role validation
        setNoSession(true);
        return; // Fetching the user failed
      }

      const user = userData.user;

      // Check the employees table
      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role, employee_id")
        .eq("user_uuid", user?.id)
        .single();

      if (roleError || !roleData) {
        // Check the profiles table if not found in employees table
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
          setRoleValidating(false); // End role validation
          setNoSession(true);
          return; // No role found
        }

        const role = customerData.role;

        if (!role) {
          setLoading(false);
          setRoleValidating(false); // End role validation
          setNoSession(true);
          return;
        }

        setLoading(false); // End loading before redirection
        router.push(`/TGR/crew/profile/${user?.id}`);
      } else {
        const { role, employee_id } = roleData;
        setLoading(false); // End loading before redirection
        setRoleValidating(false); // End role validation
        router.push(`/TGR/crew/profile/${employee_id}`);
      }
    };

    fetchRoleAndRedirect();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>; // Show loading spinner or any placeholder
  }

  if (roleValidating) {
    return <div>Validating Role...</div>; // Show role validation message
  }

  if (noSession) {
    return <LandingPagePublic />; // Show the public landing page if no active session
  }

  return null; // No need to show anything else
}
