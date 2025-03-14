"use client";
import dynamic from "next/dynamic";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useRole } from "@/context/RoleContext";

// Dynamically import all headers with a shared loading configuration
const LazyHeaderDev = dynamic(() => import("./HeaderDev"), { ssr: false });
const LazyHeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
const LazyHeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
  ssr: false,
});
const LazyHeaderPublic = dynamic(() => import("./HeaderPublic"), {
  ssr: false,
});
const LazyHeaderCustomer = dynamic(() => import("./HeaderCustomer"), {
  ssr: false,
});
const LazyHeaderGunsmith = dynamic(() => import("./HeaderGunsmith"), {
  ssr: false,
});
const LazyHeaderAuditor = dynamic(() => import("./HeaderAuditor"), {
  ssr: false,
});
const LazyHeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });

export default function Header() {
  const { role, loading: isLoading, error } = useRole();

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    console.error("Error fetching role:", error.message);
    return <LazyHeaderPublic />;
  }

  if (!role) {
    return <LazyHeaderPublic />;
  }

  switch (role) {
    case "super admin":
      return <LazyHeaderSuperAdmin />;
    case "dev":
      return <LazyHeaderDev />;
    case "admin":
    case "ceo":
      return <LazyHeaderAdmin />;
    case "customer":
      return <LazyHeaderCustomer />;
    case "gunsmith":
      return <LazyHeaderGunsmith />;
    case "auditor":
      return <LazyHeaderAuditor />;
    default:
      return <LazyHeaderUser />;
  }
}
