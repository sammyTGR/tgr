import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths } from "@/lib/constant";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: res });

  // Refresh session if it exists
  await supabase.auth.getUser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    if (protectedPaths.includes(new URL(request.url).pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + new URL(request.url).pathname, request.url)
      );
    }
    return res;
  }

  // Use a single database query with error handling
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("role, employee_id")
    .eq("user_uuid", user.id)
    .maybeSingle();

  if (employeeError) {
    console.error("Error fetching employee role:", employeeError.message);
    return res;
  }

  if (employeeData) {
    const dbRole = employeeData.role;
    const employeeId = employeeData.employee_id;

    // Verify JWT role matches database role
    if (user.app_metadata?.role !== dbRole) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Handle redirects for authenticated employees
    const pathname = new URL(request.url).pathname;
    if (pathname === "/auth" || pathname === "/") {
      if (["admin", "super admin", "dev"].includes(dbRole)) {
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

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/TGR/:path*",
    "/sales/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
