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
					request.cookies.set({
						name,
						value,
						...options,
					});
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({
						name,
						value,
						...options,
					});
				},
				remove(name: string, options: CookieOptions) {
					request.cookies.set({
						name,
						value: "",
						...options,
					});
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
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
			return NextResponse.redirect(new URL("/auth", request.url));
		}

		const userRole = roleData.role;
		response.headers.set("X-User-Role", userRole);

		if (url.pathname === "/auth") {
			return NextResponse.redirect(new URL("/", request.url));
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
