import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { protectedPaths } from '@/lib/constant'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || !user.email) {
    console.error(
      "No user or email found:",
      error || "User or email undefined"
    )
    if (protectedPaths.includes(new URL(request.url).pathname)) {
      return NextResponse.redirect(
        new URL("/auth?next=" + new URL(request.url).pathname, request.url)
      )
    }
    return response
  }

  // Extract first name from the full name or email (before the '@')
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] || user.email.split("@")[0]
  const lastName = user.user_metadata?.full_name?.split(" ")[1] || ""

  // Check if the user exists in the employees table
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("role, employee_id")
    .eq("user_uuid", user.id)
    .maybeSingle()

  if (employeeError) {
    console.error("Error fetching employee role:", employeeError.message)
  } else if (!employeeData) {
    console.log("No employee data found, handling this in OAuth callback")
  } else {
    const userRole = employeeData.role
    const employeeId = employeeData.employee_id

    // Redirect to the correct profile page based on role
    if (new URL(request.url).pathname === "/auth" || new URL(request.url).pathname === "/") {
      if (
        userRole === "admin" ||
        userRole === "super admin" ||
        userRole === "dev"
      ) {
        return NextResponse.redirect(
          new URL("/admin/reports/dashboard", request.url)
        )
      } else {
        return NextResponse.redirect(
          new URL(`/TGR/crew/profile/${employeeId}`, request.url)
        )
      }
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
}
