import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: userError?.message
      }, { status: 401 });
    }

    const email = user.email;
    if (!email) {
      return NextResponse.json({
        error: 'No email found in user'
      }, { status: 400 });
    }

    // Check employees table first
    let { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("role")
      .eq("contact_info", email.toLowerCase())
      .single();

    if (employeeError && employeeError.code !== "PGRST116") {
      console.error("Error fetching role from employees:", employeeError.message);
    }

    if (employeeData) {
      return NextResponse.json({
        role: employeeData.role,
        user
      });
    }

    // If not found in employees, check customers table
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("role")
      .eq("email", email.toLowerCase())
      .single();

    if (customerError && customerError.code !== "PGRST116") {
      console.error("Error fetching role from customers:", customerError.message);
    }

    if (customerData) {
      return NextResponse.json({
        role: customerData.role || "customer",
        user
      });
    }

    // If no role found in either table
    return NextResponse.json({
      role: null,
      user
    });

  } catch (error: any) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch user role" 
    }, { status: 500 });
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