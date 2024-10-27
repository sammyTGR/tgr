"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import HeaderDev from "./HeaderDev";
import HeaderUser from "./HeaderUser";
import HeaderAdmin from "./HeaderAdmin";
import HeaderSuperAdmin from "./HeaderSuperAdmin";
import HeaderPublic from "./HeaderPublic";
import HeaderCustomer from "./HeaderCustomer";
import HeaderGunsmith from "./HeaderGunsmith";
import HeaderAuditor from "./HeaderAuditor";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// const HeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });
// const HeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
// const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
//   ssr: false,
// });
// const HeaderPublic = dynamic(() => import("./HeaderPublic"), { ssr: false });
// const HeaderCustomer = dynamic(() => import("./HeaderCustomer"), {
//   ssr: false,
// });
// const HeaderGunsmith = dynamic(() => import("./HeaderGunsmith"), {
//   ssr: false,
// });
// const HeaderAuditor = dynamic(() => import("./HeaderAuditor"), { ssr: false });

export default function Header() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

const { isLoading } = useQuery({
  queryKey: ["navigation", pathname, searchParams],
  queryFn: () => {
    return Promise.resolve(
      new Promise((resolve) => {
        setTimeout(() => resolve(null), 100);
      })
    );
  },
  staleTime: 0, // Always refetch on route change
  refetchInterval: 0, // Disable automatic refetching
});

  const LazyHeaderDev = dynamic(
    () =>
      import("./HeaderDev").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderAdmin = dynamic(
    () =>
      import("./HeaderAdmin").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderSuperAdmin = dynamic(
    () =>
      import("./HeaderSuperAdmin").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderPublic = dynamic(
    () =>
      import("./HeaderPublic").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderCustomer = dynamic(
    () =>
      import("./HeaderCustomer").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderGunsmith = dynamic(
    () =>
      import("./HeaderGunsmith").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderAuditor = dynamic(
    () =>
      import("./HeaderAuditor").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  const LazyHeaderUser = dynamic(
    () =>
      import("./HeaderUser").then((module) => ({
        default: module.default,
      })),
    {
      loading: () => <LoadingIndicator />,
    }
  );

  useEffect(() => {
    const fetchRole = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        //console.("Error fetching user:", userError.message);
        setLoading(false);
        return;
      }

      const user = userData.user;

      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role")
        .eq("user_uuid", user?.id)
        .single();

      if (roleError || !roleData) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("role")
          .eq("email", user?.email)
          .single();

        if (customerError || !customerData) {
          // console.error(
          //   "Error fetching role:",
          //   customerError?.message || roleError?.message
          // );
          setLoading(false);
          return;
        }

        setRole(customerData.role);
      } else {
        setRole(roleData.role);
      }

      setLoading(false);
    };

    fetchRole();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!role) {
    return <LazyHeaderPublic />;
  }

  switch (role) {
    case "super admin":
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderSuperAdmin />;
    case "dev":
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderDev />;
    case "admin":
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderAdmin />;
    case "customer":
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderCustomer />;
    case "gunsmith":
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderGunsmith />;
    case "auditor":
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderAuditor />;
    default:
      {
        isLoading && <LoadingIndicator />;
      }
      return <LazyHeaderUser />;
  }
}
