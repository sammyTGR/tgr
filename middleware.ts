import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { protectedPaths } from '@/lib/constant';
import { jwtDecode } from 'jwt-decode';

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

  console.log('Middleware processing path:', pathname);

  // Skip middleware for public paths and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') // Skip auth routes
  ) {
    return res;
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('User error:', userError.message);
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // If no user and trying to access protected path, redirect to auth
    if (!user && protectedPaths.includes(pathname)) {
      console.log('No user, redirecting to auth');
      return NextResponse.redirect(new URL('/auth?next=' + pathname, request.url));
    }

    // If we have a user, check their role from JWT first
    if (user) {
      console.log('User found, checking user role');

      let jwtRole = 'authenticated';
      const token = request.cookies.get('sb-access-token')?.value;

      if (token) {
        try {
          const jwt = jwtDecode<JWTPayload>(token);
          jwtRole = jwt.app_metadata?.role || 'authenticated';
          console.log('JWT Role:', jwtRole);
        } catch (error) {
          console.error('JWT decode error:', error);
        }
      }

      // Handle root path redirects based on JWT role first
      if (pathname === '/' || pathname === '') {
        let redirectUrl;

        switch (jwtRole) {
          case 'super admin':
          case 'ceo':
            redirectUrl = '/admin/reports/dashboard/ceo';
            break;
          case 'dev':
            redirectUrl = '/admin/reports/dashboard/dev';
            break;
          case 'admin':
            redirectUrl = '/admin/reports/dashboard/admin';
            break;
          case 'user':
          case 'gunsmith':
          case 'auditor':
            redirectUrl = `/TGR/crew/bulletin`;
            break;
          default:
            // If no role in JWT, check database
            const { data: employeeData } = await supabase
              .from('employees')
              .select('role, status')
              .eq('user_uuid', user.id)
              .eq('status', 'active')
              .single();

            if (employeeData) {
              switch (employeeData.role) {
                case 'super admin':
                case 'ceo':
                  redirectUrl = '/admin/reports/dashboard/ceo';
                  break;
                case 'dev':
                  redirectUrl = '/admin/reports/dashboard/dev';
                  break;
                case 'admin':
                  redirectUrl = '/admin/reports/dashboard/admin';
                  break;
                default:
                  redirectUrl = `/TGR/crew/bulletin`;
              }
            } else {
              // Check if customer
              const { data: customerData } = await supabase
                .from('customers')
                .select('status')
                .eq('user_uuid', user.id)
                .eq('status', 'active')
                .single();

              if (customerData) {
                return res; // Let the page component handle customer rendering
              }
              redirectUrl = '/auth';
            }
        }

        if (redirectUrl) {
          console.log('Redirecting to:', redirectUrl);
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      }

      // For non-root paths, check if customer trying to access protected routes
      if (jwtRole === 'customer' || !jwtRole) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('status')
          .eq('user_uuid', user.id)
          .eq('status', 'active')
          .single();

        if (
          customerData &&
          (pathname.startsWith('/admin') ||
            pathname.startsWith('/TGR') ||
            pathname.startsWith('/sales'))
        ) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an error getting the user, treat it as no user
    if (protectedPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/auth?next=' + pathname, request.url));
    }
    return res;
  }
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/:path*',
    '/TGR/:path*',
    '/sales/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth|auth).*)',
  ],
};
