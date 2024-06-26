// src/middleware.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths } from "@/lib/constant";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
    return response;
  }

  // Fetch user role from the employees table
  const { data: roleData, error: roleError } = await supabase
    .from("employees")
    .select("role")
    .eq("user_uuid", user.id)
    .single();

  if (roleError || !roleData) {
    console.error("Error fetching role:", roleError?.message || "No role data");
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const userRole = roleData.role;
  response.headers.set("X-User-Role", userRole);

  // Set the role as a cookie
  response.cookies.set({
    name: "X-User-Role",
    value: userRole,
    path: "/",
  });

  // Redirect to the correct landing page based on role
  if (url.pathname === "/auth" || url.pathname === "/") {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/landing-page/admin", request.url));
    } else if (userRole === "super admin") {
      return NextResponse.redirect(new URL("/landing-page/super-admin", request.url));
    } else if (userRole === "gunsmith") {
      return NextResponse.redirect(new URL("/landing-page/gunsmith", request.url));
    } else {
      return NextResponse.redirect(new URL("/landing-page/user", request.url));
    }
  }

  return response;
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
