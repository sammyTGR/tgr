import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { employeeName } = await request.json();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First find the employee
    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id, name, status")
      .ilike("name", `%${employeeName}%`)
      .eq("status", "active");

    if (employeeError) {
      return NextResponse.json(
        { error: "Error finding employee" },
        { status: 400 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: "No employee found with that name" },
        { status: 404 }
      );
    }

    // Delete the schedules
    const { error: deleteError } = await supabase
      .from("schedules")
      .delete()
      .eq("employee_id", employees[0].employee_id)
      .eq("status", "scheduled");

    if (deleteError) {
      return NextResponse.json(
        { error: "Error clearing schedules" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
