

import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths } from "@/lib/constant";

export async function middleware(request: NextRequest) {
  const supabase = createClient();
  const url = new URL(request.url);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    console.error(
      "No user or email found:",
      error || "User or email undefined"
    );
    if (protectedPaths.includes(url.pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + url.pathname, request.url)
      );
    }
    return NextResponse.next();
  }

  // Extract first name from the full name or email (before the '@')
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] || user.email.split("@")[0];
  const lastName = user.user_metadata?.full_name?.split(" ")[1] || "";

  // Check if the user exists in the employees table
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("role, employee_id")
    .eq("user_uuid", user.id)
    .maybeSingle(); // Use maybeSingle to handle cases where no rows are returned

  if (employeeError) {
    //console.("Error fetching employee role:", employeeError.message);
  } else if (!employeeData) {
    // Insert logic in the OAuth callback, not here.
    // console.log("No employee data found, handling this in OAuth callback");
  } else {
    const userRole = employeeData.role;
    const employeeId = employeeData.employee_id;

    // console.log("User is an employee, redirecting:", user.email);

    // Redirect to the correct profile page based on role
    if (url.pathname === "/auth" || url.pathname === "/") {
      if (
        userRole === "admin" ||
        userRole === "super admin" ||
        userRole === "dev"
      ) {
        return NextResponse.redirect(
          new URL("/admin/reports/dashboard", request.url)
        );
      } else {
        return NextResponse.redirect(
          new URL(`/TGR/crew/profile/${employeeId}`, request.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin(.*)",
    "/api/(.*)",
    "/TGR(.*)",
    "/sales(.*)",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
