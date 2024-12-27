import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
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

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json(
        {
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // Get role from JWT
    const jwt = jwtDecode<JWTPayload>(session.access_token);
    const jwtRole = jwt.app_metadata?.role || "authenticated";

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          details: userError?.message,
        },
        { status: 401 }
      );
    }

    // Verify JWT role matches database role
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("role")
      .eq("user_uuid", user.id)
      .single();

    if (employeeData && employeeData.role !== jwtRole) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: "Role mismatch",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      role: jwtRole,
      user,
    });
  } catch (error: any) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch user role",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
