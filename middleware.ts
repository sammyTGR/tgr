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

  console.log("Middleware processing path:", pathname);

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
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError.message);
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // If no session and trying to access protected path, redirect to auth
    if (!session && protectedPaths.includes(pathname)) {
      console.log("No session, redirecting to auth");
      return NextResponse.redirect(
        new URL("/auth?next=" + pathname, request.url)
      );
    }

    // If we have a session, get the user
    if (session?.user) {
      console.log("Session found, checking user role");

      // Get role from JWT with proper typing
      let jwtRole = "authenticated";
      if (session.access_token) {
        const jwt = jwtDecode<JWTPayload>(session.access_token);
        jwtRole = jwt.app_metadata?.role || "authenticated";
        console.log("JWT Role:", jwtRole);
      }

      // Use a single database query with error handling
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("role, employee_id")
        .eq("user_uuid", session.user.id)
        .single();

      if (employeeError) {
        console.error("Error fetching employee role:", employeeError.message);
        return NextResponse.redirect(new URL("/auth", request.url));
      }

      if (employeeData) {
        const dbRole = employeeData.role;
        const employeeId = employeeData.employee_id;
        console.log("DB Role:", dbRole, "Employee ID:", employeeId);

        // Verify JWT role matches database role
        if (session.user.app_metadata?.role !== dbRole) {
          console.log("Role mismatch, signing out");
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/auth", request.url));
        }

        // Handle redirects for authenticated employees
        if (pathname === "/" || pathname === "") {
          console.log("Root path detected, redirecting based on role");
          let redirectUrl;

          switch (dbRole) {
            case "super admin":
            case "ceo":
              redirectUrl = "/admin/reports/dashboard/ceo";
              break;
            case "dev":
              redirectUrl = "/admin/reports/dashboard/dev";
              break;
            case "admin":
              redirectUrl = "/admin/reports/dashboard/admin";
              break;
            default:
              redirectUrl = `/TGR/crew/profile/${employeeId}`;
          }

          console.log("Redirecting to:", redirectUrl);
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      } else {
        console.log("No employee data found");
        if (pathname === "/" || pathname === "") {
          return NextResponse.redirect(new URL("/auth", request.url));
        }
      }
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
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
    "/",
    "/admin/:path*",
    "/api/:path*",
    "/TGR/:path*",
    "/sales/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|auth).*)",
  ],
};
