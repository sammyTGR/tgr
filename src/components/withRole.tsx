import { ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

interface WithRoleProps {
  children: ReactNode;
  allowedRoles: string[];
  allowedEmails?: string[];
}

const WithRole: React.FC<WithRoleProps> = ({
  children,
  allowedRoles,
  allowedEmails = [],
}) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchUserRole = useCallback(
    async (email: string) => {
      const { data, error } = await supabase
        .from("employees")
        .select("role")
        .eq("contact_info", email)
        .single();

      if (error) {
        console.error("Error fetching user role from database:", error.message);
        router.push("/sign-in");
        return;
      }

      const userRole = data?.role;
      console.log("Fetched User Role:", userRole);

      const isRoleAllowed = userRole && allowedRoles.includes(userRole);
      const isEmailAllowed =
        !allowedEmails.length || allowedEmails.includes(email);

      if (isRoleAllowed && isEmailAllowed) {
        setAuthorized(true);
      } else {
        console.log("User is not authorized. Redirecting...");
        router.push("/");
      }
    },
    [allowedRoles, allowedEmails, router]
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Failed to fetch session:", error.message);
          router.push("/sign-in");
          return;
        }

        const session = data.session;
        if (!session || !session.user) {
          console.error("No session or user found.");
          router.push("/sign-in");
          return;
        }

        const user = session.user;
        const email = user.email?.toLowerCase();

        if (email) {
          await fetchUserRole(email);
        } else {
          console.log("User email is not available. Redirecting...");
          router.push("/");
        }

        setIsLoaded(true);
      } catch (error) {
        console.error("Unexpected error:", error);
        router.push("/sign-in");
      }
    };

    fetchUser();
  }, [fetchUserRole, router]);

  if (!isLoaded || !authorized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default WithRole;
