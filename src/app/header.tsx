"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import LoadingIndicator from "@/components/LoadingIndicator";
import HeaderDev from "./HeaderDev";
import HeaderUser from "./HeaderUser";
import HeaderAdmin from "./HeaderAdmin";
import HeaderSuperAdmin from "./HeaderSuperAdmin";
import HeaderPublic from "./HeaderPublic";
import HeaderCustomer from "./HeaderCustomer";
import HeaderGunsmith from "./HeaderGunsmith";
import HeaderAuditor from "./HeaderAuditor";

export default function Header() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user role");
      }
      return response.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  const LazyHeaderDev = dynamic(
    () => import("./HeaderDev").then((module) => ({ default: module.default })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderAdmin = dynamic(
    () =>
      import("./HeaderAdmin").then((module) => ({ default: module.default })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderCeo = dynamic(
    () =>
      import("./HeaderAdmin").then((module) => ({ default: module.default })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderSuperAdmin = dynamic(
    () =>
      import("./HeaderSuperAdmin").then((module) => ({
        default: module.default,
      })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderPublic = dynamic(
    () =>
      import("./HeaderPublic").then((module) => ({ default: module.default })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderCustomer = dynamic(
    () =>
      import("./HeaderCustomer").then((module) => ({
        default: module.default,
      })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderGunsmith = dynamic(
    () =>
      import("./HeaderGunsmith").then((module) => ({
        default: module.default,
      })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderAuditor = dynamic(
    () =>
      import("./HeaderAuditor").then((module) => ({ default: module.default })),
    { loading: () => <LoadingIndicator /> }
  );

  const LazyHeaderUser = dynamic(
    () =>
      import("./HeaderUser").then((module) => ({ default: module.default })),
    { loading: () => <LoadingIndicator /> }
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    console.error("Error fetching role:", error);
    return <LazyHeaderPublic />;
  }

  if (!data?.role) {
    return <LazyHeaderPublic />;
  }

  switch (data.role) {
    case "super admin":
      return <LazyHeaderSuperAdmin />;
    case "dev":
      return <LazyHeaderDev />;
    case "admin":
      return <LazyHeaderAdmin />;
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
