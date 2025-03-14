"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import LandingPageCustomer from "@/components/LandingPageCustomer";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";

interface JWTPayload {
  aal: string;
  amr: Array<{ method: string; timestamp: number }>;
  app_metadata: {
    provider: string;
    providers: string[];
    role?: string;
  };
  aud: string;
  email: string;
  exp: number;
  iat: number;
  is_anonymous: boolean;
  iss: string;
  phone: string;
  role: string;
  session_id: string;
  sub: string;
}

interface UserSession {
  user: any;
  role?: string;
  employee_id?: number;
  customer_id?: number;
  status?: string;
  jwtRole?: string;
  dbRole?: string;
}

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Clear the query cache and redirect
        queryClient.clear();
        router.push("/sign-in");
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, router]);

  // Query for checking auth state and role
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          console.log("No session found, redirecting to sign in");
          return null;
        }

        const { user, access_token } = sessionData.session;

        // Get role from JWT with proper typing
        let jwtRole = "authenticated";
        if (access_token) {
          const jwt = jwtDecode<JWTPayload>(access_token);
          jwtRole = jwt.app_metadata?.role || "authenticated";
          console.log("JWT Role:", jwtRole);
        }

        // First check if user is an employee
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("role, employee_id, status")
          .eq("user_uuid", user.id)
          .eq("status", "active")
          .single();

        if (employeeData && !employeeError) {
          // Return employee data without routing
          return {
            user,
            role: employeeData.role,
            employee_id: employeeData.employee_id,
            status: employeeData.status,
            jwtRole,
            dbRole: employeeData.role,
          };
        }

        // If not an employee, check if customer
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("role, id, status")
          .eq("user_uuid", user.id)
          .eq("status", "active")
          .single();

        if (customerError) {
          console.error("Customer data fetch error:", customerError);
          return null;
        }

        if (customerData) {
          return {
            user,
            role: customerData.role,
            customer_id: customerData.id,
            status: customerData.status,
            jwtRole,
            dbRole: customerData.role,
          };
        }

        console.log("No valid role found, redirecting to sign in");
        return null;
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle routing based on session data
  useEffect(() => {
    if (!sessionLoading && session) {
      // Verify JWT role matches database role for employees
      if (
        session.user?.app_metadata?.role &&
        session.user.app_metadata.role !== session.dbRole
      ) {
        console.log("Role mismatch, signing out");
        supabase.auth.signOut().then(() => {
          queryClient.clear();
          router.push("/sign-in");
        });
        return;
      }

      // Handle employee routing
      if (session.role && session.role !== "customer") {
        switch (session.role) {
          case "super admin":
          case "ceo":
            router.push("/admin/reports/dashboard/ceo");
            break;
          case "dev":
            router.push("/admin/reports/dashboard/dev");
            break;
          case "admin":
            router.push("/admin/reports/dashboard/admin");
            break;
          case "user":
          case "gunsmith":
          case "auditor":
            router.push(`/TGR/crew/profile/${session.employee_id}`);
            break;
          default:
            if (session.employee_id) {
              router.push(`/TGR/crew/profile/${session.employee_id}`);
            }
        }
      }
    } else if (!sessionLoading && !session) {
      router.push("/sign-in");
    }
  }, [session, sessionLoading, router, queryClient]);

  // Show loading state
  if (sessionLoading) {
    return <LoadingIndicator />;
  }

  // Show customer landing page if user is an active customer
  if (session?.role === "customer" && session?.status === "active") {
    return <LandingPageCustomer />;
  }

  // Show loading while waiting for routing
  return <LoadingIndicator />;
}
