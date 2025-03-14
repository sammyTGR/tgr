"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { supabase } from "@/utils/supabase/client";
import LandingPageCustomer from "@/components/LandingPageCustomer";
import LoadingIndicator from "@/components/LoadingIndicator";
import dynamic from "next/dynamic";

interface UserSession {
  user: any;
  role?: string;
  employee_id?: number;
}

interface AuthState {
  isLoading: boolean;
  isValidating: boolean;
  hasSession: boolean;
  progress: number;
  role: string | null;
}

// const LazyLandingPageCustomer = dynamic(
//   () =>
//     import("@/components/LandingPageCustomer").then((module) => ({
//       default: module.default,
//     })),
//   {
//     loading: () => <LoadingIndicator />,
//   }
// );

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Query for checking auth state using getUser only
  const sessionQuery = useQuery<UserSession | null>({
    queryKey: ["auth-session"],
    queryFn: async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return null;
        }

        return {
          user,
        };
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Query for fetching user role
  const roleQuery = useQuery<UserSession, Error>({
    queryKey: ["user-role", sessionQuery.data?.user?.id],
    enabled: !!sessionQuery.data?.user,
    queryFn: async () => {
      const user = sessionQuery.data?.user;
      if (!user) throw new Error("No user found");

      try {
        console.log("Checking employee data for user:", user.id);
        // First try to get employee data
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("role, employee_id")
          .eq("user_uuid", user.id)
          .single();

        if (employeeError) {
          console.log("Employee fetch error:", employeeError);
        }

        // If employee data exists, return it regardless of any other conditions
        if (employeeData) {
          console.log("Found employee data:", employeeData);
          return {
            user: sessionQuery.data?.user,
            role: employeeData.role,
            employee_id: employeeData.employee_id,
          };
        }

        // Check customers table if no employee data was found
        console.log("No employee data found, checking customers table");
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("role")
          .eq("email", user.email)
          .single();

        if (customerError) {
          console.log("Customer fetch error:", customerError);
        }

        if (customerData) {
          console.log("Found customer data:", customerData);
          return {
            user: sessionQuery.data?.user,
            role: customerData.role,
          };
        }

        // If we get here, no role was found in either table
        console.log("No role found in either table");
        throw new Error(
          "No role found for user in employees or customers tables"
        );
      } catch (error) {
        console.error("Role fetch error:", error);
        // Check if it's our custom error or a database error
        if (error instanceof Error) {
          throw error;
        }
        // If it's some other type of error, throw a generic one
        throw new Error("Failed to fetch user role");
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Navigation state query
  const navigationQuery = useQuery({
    queryKey: ["navigation", pathname, searchParams],
    queryFn: () =>
      Promise.resolve()
        .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
        .then(() => null),
    staleTime: 0,
    refetchInterval: 0,
  });

  // Handle role-based routing
  useQuery({
    queryKey: ["role-routing", roleQuery.data?.role],
    enabled: !!roleQuery.data?.role,
    queryFn: () =>
      Promise.resolve().then(() => {
        const role = roleQuery.data?.role;
        const employeeId = roleQuery.data?.employee_id;

        if (role === "ceo" || role === "super admin") {
          router.push("/admin/reports/dashboard/ceo");
        } else if (role === "dev") {
          router.push("/admin/reports/dashboard/dev");
        } else if (["admin"].includes(role || "")) {
          router.push("/admin/reports/dashboard/admin");
        } else if (employeeId) {
          router.push(`/TGR/crew/profile/${employeeId}`);
        }
        return null;
      }),
    staleTime: Infinity,
  });

  // Handle loading states
  // if (sessionQuery.isLoading || navigationQuery.isLoading) {
  //   return <LoadingIndicator />;
  // }

  // Handle role validation state
  if (roleQuery.isLoading) {
    return <div>Validating Role...</div>;
  }

  // Handle no session state
  if (!sessionQuery.data) {
    return router.push("/sign-in");
  }

  // Handle customer role
  if (roleQuery.data?.role === "customer") {
    return <LandingPageCustomer />;
  }

  // Handle error states
  if (sessionQuery.error || roleQuery.error) {
    const errorMessage = DOMPurify.sanitize(
      (sessionQuery.error || roleQuery.error)?.message || "An error occurred"
    );
    return <div>Error: {errorMessage}</div>;
  }

  return null;
}
