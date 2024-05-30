import { ReactNode, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import supabase from "../../supabase/lib/supabaseClient"; // Import your Supabase client

interface WithRoleProps {
  children: ReactNode;
  allowedRoles: string[];
  allowedEmails?: string[];
}

const WithRole: React.FC<WithRoleProps> = ({ children, allowedRoles, allowedEmails = [] }) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const fetchUserRole = useCallback(async (email: string) => {
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
    const isEmailAllowed = !allowedEmails.length || allowedEmails.includes(email);

    if (isRoleAllowed && isEmailAllowed) {
      setAuthorized(true);
    } else {
      console.log("User is not authorized. Redirecting...");
      router.push("/sign-in");
    }
  }, [allowedRoles, allowedEmails, router]);

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress.toLowerCase() ||
        user.emailAddresses[0]?.emailAddress.toLowerCase();

      if (userEmail) {
        fetchUserRole(userEmail);
      } else {
        console.log("User email is not available. Redirecting...");
        router.push("/sign-in");
      }
    }
  }, [isLoaded, user, fetchUserRole, router]);

  if (!isLoaded || !authorized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default WithRole;
