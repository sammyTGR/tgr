import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { protectedPaths } from '@/lib/constant'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Get session instead of user directly
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  // Handle unauthenticated access to protected routes
  if (!session || !user || !user.email) {
    console.error(
      "No session or user found:",
      !session ? "No session" : "No user or email"
    )
    
    // If trying to access protected paths, redirect to auth
    if (protectedPaths.includes(new URL(request.url).pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + new URL(request.url).pathname, request.url)
      )
    }
    return response
  }

  // If authenticated user tries to access auth pages, redirect appropriately
  if (session && new URL(request.url).pathname.startsWith('/auth')) {
    // Check employee role before deciding redirect
    const { data: employeeData } = await supabase
      .from("employees")
      .select("role, employee_id")
      .eq("user_uuid", user.id)
      .maybeSingle()

    if (employeeData?.role in ['admin', 'super admin', 'dev']) {
      return NextResponse.redirect(
        new URL("/admin/reports/dashboard", request.url)
      )
    } else if (employeeData?.employee_id) {
      return NextResponse.redirect(
        new URL(`/TGR/crew/profile/${employeeData.employee_id}`, request.url)
      )
    }
  }

  // For authenticated users accessing root or auth paths
  if (new URL(request.url).pathname === "/auth" || new URL(request.url).pathname === "/") {
    const { data: employeeData } = await supabase
      .from("employees")
      .select("role, employee_id")
      .eq("user_uuid", user.id)
      .maybeSingle()

    if (employeeData?.role in ['admin', 'super admin', 'dev']) {
      return NextResponse.redirect(
        new URL("/admin/reports/dashboard", request.url)
      )
    } else if (employeeData?.employee_id) {
      return NextResponse.redirect(
        new URL(`/TGR/crew/profile/${employeeData.employee_id}`, request.url)
      )
    }
  }

  return response
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
