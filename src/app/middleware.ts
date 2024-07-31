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

  if (error || !user) {
    if (protectedPaths.includes(url.pathname)) {
      return NextResponse.redirect(new URL("/auth?next=" + url.pathname, request.url));
    }
    return NextResponse.next();
  }

  // Fetch user role from the employees table
  const { data: roleData, error: roleError } = await supabase
    .from("employees")
    .select("role, employee_id")
    .eq("user_uuid", user.id)
    .single();

  if (roleError || !roleData) {
    console.error("Error fetching role:", roleError?.message || "No role data");
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const userRole = roleData.role;
  const employeeId = roleData.employee_id;

  // Redirect to the correct profile page based on role
  if (url.pathname === "/auth" || url.pathname === "/") {
    if (userRole === "admin" || userRole === "super admin" || userRole === "gunsmith" || userRole === "auditor") {
      return NextResponse.redirect(new URL(`/TGR/crew/profile/${employeeId}`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/TGR/crew/profile/${employeeId}`, request.url));
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
