import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths } from "@/lib/constant";
import { jwtDecode } from "jwt-decode";

// Define the JWT payload type
interface JWTPayload {
  aal: string;
  amr: Array<{ method: string; timestamp: number }>;
  app_metadata: {
    provider: string;
    providers: string[];
    role?: string;
  };
  aud: string;
  email: string;
  exp: number;
  iat: number;
  is_anonymous: boolean;
  iss: string;
  phone: string;
  role: string;
  session_id: string;
  sub: string;
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get role from JWT with proper typing
  let jwtRole = "authenticated";
  if (user?.app_metadata?.role) {
    jwtRole = user.app_metadata.role;
  }

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
      if (dbRole === "ceo" || dbRole === "super admin") {
        return NextResponse.redirect(
          new URL("/admin/reports/dashboard/ceo", request.url)
        );
      } else if (dbRole === "dev") {
        return NextResponse.redirect(
          new URL("/admin/reports/dashboard/dev", request.url)
        );
      } else if (["admin"].includes(dbRole)) {
        return NextResponse.redirect(
          new URL("/admin/reports/dashboard/admin", request.url)
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
