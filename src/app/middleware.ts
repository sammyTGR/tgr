// src/app/middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths } from "@/lib/constant";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    response.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const url = new URL(request.url);

    if (session) {
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch user role from the employees table
        const { data: roleData, error } = await supabase
            .from('employees')
            .select('role')
            .eq('user_uuid', user?.id)
            .single();

        if (error || !roleData) {
            console.error("Error fetching role:", error?.message || "No role data");
            return NextResponse.redirect(new URL("/auth", request.url));
        }

        const userRole = roleData.role;
        response.headers.set("X-User-Role", userRole);

        // Set the role as a cookie
        response.cookies.set({
            name: 'X-User-Role',
            value: userRole,
            path: '/',
        });

        // Redirect to the correct landing page based on role
        if (url.pathname === "/auth" || url.pathname === "/") {
            if (userRole === "admin") {
                return NextResponse.redirect(new URL("/landing-page/admin", request.url));
            } else if (userRole === "super admin") {
                return NextResponse.redirect(new URL("/landing-page/super-admin", request.url));
            } else {
                return NextResponse.redirect(new URL("/landing-page/user", request.url));
            }
        }

        return response;
    } else {
        if (protectedPaths.includes(url.pathname)) {
            return NextResponse.redirect(
                new URL("/auth?next=" + url.pathname, request.url)
            );
        }
        return response;
    }
}

export const config = {
    matcher: [
        '/admin(.*)',
        '/api/(.*)',
        '/TGR(.*)',
        '/sales(.*)',
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
