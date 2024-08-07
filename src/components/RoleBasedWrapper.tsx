import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ProgressBar } from "@/components/ProgressBar";

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: string[];
}

function RoleBasedWrapper({ children, allowedRoles }: RoleBasedWrapperProps) {
  const router = useRouter();
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
            setProgress(100); // Final progress
            return;
          }

          setRole(customerData.role);
        } else {
          setRole(roleData.role);
        }

        setLoading(false);
        setProgress(100); // Final progress
      }
    };

    fetchRole();
  }, []);

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      router.push("/");
    }
  }, [role, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <ProgressBar value={progress} showAnimation={true} />
      </div>
    ); // Show progress bar while loading
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

export default RoleBasedWrapper;
