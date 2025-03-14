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
  const pathname = new URL(request.url).pathname;

  // Skip middleware for public paths and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") // Skip auth routes
  ) {
    return res;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session and trying to access protected path, redirect to auth
    if (!session && protectedPaths.includes(pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + pathname, request.url)
      );
    }

    // If we have a session, get the user
    if (session) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError.message);
        return NextResponse.redirect(new URL("/auth", request.url));
      }

      if (user?.email) {
        // Get role from JWT with proper typing
        let jwtRole = "authenticated";
        if (session.access_token) {
          const jwt = jwtDecode<JWTPayload>(session.access_token);
          jwtRole = jwt.app_metadata?.role || "authenticated";
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
          if (pathname === "/") {
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
      }
    }

    return res;
  } catch (error) {
    // If there's an error getting the session, treat it as no session
    if (protectedPaths.includes(pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + pathname, request.url)
      );
    }
    return res;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/TGR/:path*",
    "/sales/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|auth).*)",
  ],
};
