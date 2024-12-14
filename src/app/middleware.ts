import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths } from "@/lib/constant";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user || !session.user.email) {
    console.error(
      "No user or email found:",
      sessionError || "User or email undefined"
    );
    if (protectedPaths.includes(new URL(request.url).pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + new URL(request.url).pathname, request.url)
      );
    }
    return response;
  }

  const user = session.user;
  const userRole = user.app_metadata?.role;

  // Check against database role
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("role, employee_id")
    .eq("user_uuid", user.id)
    .maybeSingle();

  if (employeeError) {
    console.error("Error fetching employee role:", employeeError.message);
    return response;
  }

  if (employeeData) {
    const dbRole = employeeData.role;
    const employeeId = employeeData.employee_id;

    // Verify JWT role matches database role
    if (userRole !== dbRole) {
      console.error("Role mismatch between JWT and database");
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Handle redirects for authenticated employees
    if (
      new URL(request.url).pathname === "/auth" ||
      new URL(request.url).pathname === "/"
    ) {
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
