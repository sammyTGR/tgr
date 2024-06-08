import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: string[];
}

function RoleBasedWrapper({ children, allowedRoles }: RoleBasedWrapperProps) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const roleHeader = document.cookie
        .split("; ")
        .find((row) => row.startsWith("X-User-Role="))
        ?.split("=")[1];
      if (roleHeader) {
        setRole(roleHeader);
        setLoading(false);
      } else {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError.message);
          setLoading(false);
          return;
        }

        const user = userData.user;

        const { data: roleData, error: roleError } = await supabase
          .from("employees")
          .select("role")
          .eq("user_uuid", user?.id)
          .single();

        if (roleError) {
          console.error("Error fetching role:", roleError.message);
          setLoading(false);
          return;
        }

        setRole(roleData.role);
        setLoading(false);
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
    return <div>Loading...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

export default RoleBasedWrapper;
