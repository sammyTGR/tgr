"use client";
import dynamic from "next/dynamic";
import LoadingIndicator from "@/components/LoadingIndicator";
import HeaderDev from "./HeaderDev";
import HeaderUser from "./HeaderUser";
import HeaderAdmin from "./HeaderAdmin";
import HeaderSuperAdmin from "./HeaderSuperAdmin";
import HeaderPublic from "./HeaderPublic";
import HeaderCustomer from "./HeaderCustomer";
import HeaderGunsmith from "./HeaderGunsmith";
import HeaderAuditor from "./HeaderAuditor";
import { useRole } from "@/context/RoleContext";

export default function Header() {
  const { role, loading: isLoading, error } = useRole();

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
