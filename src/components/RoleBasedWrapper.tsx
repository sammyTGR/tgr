import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProgressBar } from "@/components/ProgressBar";

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: string[];
}

function RoleBasedWrapper({ children, allowedRoles }: RoleBasedWrapperProps) {
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      // First check cookie
      const roleHeader = document.cookie
        .split("; ")
        .find((row) => row.startsWith("X-User-Role="))
        ?.split("=")[1];

      if (roleHeader) {
        return { role: roleHeader };
      }

      // If no cookie, fetch from API
      const response = await fetch('/api/getUserRole');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user role');
      }
      
      const userData = await response.json();
      
      // Set cookie for future use
      if (userData.role) {
        document.cookie = `X-User-Role=${userData.role}; path=/; max-age=3600`; // 1 hour expiry
      }
      
      return userData;
    },
    retry: false,

  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <ProgressBar value={50} showAnimation={true} />
      </div>
    );
  }

  // Handle error state
  if (error) {
    console.error("Error fetching role:", error);
    router.push("/");
    return null;
  }

  // Handle unauthorized access
  if (!data?.role || !allowedRoles.includes(data.role)) {
    router.push("/");
    return null;
  }

  return <>{children}</>;
}

export default RoleBasedWrapper;