import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Initialize server-side Supabase client
    const cookieStore = cookies()
    const supabase = createClient()

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employee_name, start_date, end_date, reason, other_reason } =
      await request.json();

    // Validate required fields
    if (!employee_name || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch employee data
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id, contact_info, user_uuid")
      .eq("name", employee_name)
      .single();

    if (employeeError) {
      console.error("Error fetching employee:", employeeError);
      return NextResponse.json(
        { error: employeeError.message },
        { status: 500 }
      );
    }

    if (!employeeData) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Insert time off request
    const { data, error } = await supabase
      .from("time_off_requests")
      .insert([
        {
          employee_id: employeeData.employee_id,
          name: employee_name,
          start_date,
          end_date,
          reason,
          other_reason: other_reason || null,
          status: "pending",
          email: employeeData.contact_info,
          sick_time_year: new Date().getFullYear(),
          user_uuid: employeeData.user_uuid,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting time off request:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
