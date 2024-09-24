import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const { employee_name, start_date, end_date, reason, other_reason } =
    await request.json();

  try {
    // Fetch employee_id and contact_info based on employee_name
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id, contact_info")
      .eq("name", employee_name)
      .single();

    if (employeeError || !employeeData) {
      console.error("Error fetching employee:", employeeError?.message);
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 500 }
      );
    }

    const { employee_id, contact_info } = employeeData;
    const email = contact_info; // Assuming contact_info is the plain text email

    // Insert the time off request
    const { data, error } = await supabase
      .from("time_off_requests")
      .insert([
        {
          employee_id,
          name: employee_name,
          start_date,
          end_date,
          reason,
          other_reason,
          status: "pending",
          email,
          sick_time_year: new Date().getFullYear(),
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting time off request:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error handling time off request:", err);
    return NextResponse.json(
      { error: "Unexpected error handling time off request" },
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
