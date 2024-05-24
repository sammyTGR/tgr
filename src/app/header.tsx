import dynamic from "next/dynamic";
import { getUserRole } from "@/lib/getUserRole";

const HeaderUser = dynamic(() => import("./HeaderUser"));
const HeaderAdmin = dynamic(() => import("./HeaderAdmin"));
const HeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"));

export default async function Header() {
  // Replace with the actual method to get the user's email
  const email = "samlee@thegunrange.biz"; // Example email
  const role = await getUserRole(email);

  console.log(`Rendering Header with Role: ${role}`);

  if (!role) {
    console.log("Role is null, showing Loading...");
    return <div>Loading...</div>; // or a default header component
  }

  if (role === "super admin") {
    return <HeaderSuperAdmin />;
  }

  if (role === "admin") {
    return <HeaderAdmin />;
  }

  return <HeaderUser />;
}
