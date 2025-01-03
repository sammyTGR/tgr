import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProgressBar } from "@/components/ProgressBar";

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: string[];
}

interface UserData {
  role: string;
}

function RoleBasedWrapper({ children, allowedRoles }: RoleBasedWrapperProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<UserData>({
    queryKey: ["userRole"],
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
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user role");
      }

      const userData: UserData = await response.json();

      // Set cookie for future use
      if (userData.role) {
        document.cookie = `X-User-Role=${userData.role}; path=/; max-age=3600`; // 1 hour expiry
      }

      // Check access immediately after getting the role
      if (!allowedRoles.includes(userData.role)) {
        router.replace("/");
        return userData;
      }

      return userData;
    },
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <ProgressBar value={50} showAnimation={true} />
      </div>
    );
  }

  // Check if user has access
  if (error || !data?.role || !allowedRoles.includes(data.role)) {
    // console.log("Access denied:", {
    //   error,
    //   role: data?.role,
    //   allowedRoles,
    // });
    return null;
  }

  return <>{children}</>;
}

export default RoleBasedWrapper;
