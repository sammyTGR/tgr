import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch reference schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("reference_schedules")
      .select("*");

    if (schedulesError) {
      throw schedulesError;
    }

    // Fetch employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("employee_id, name");

    if (employeesError) {
      throw employeesError;
    }

    return NextResponse.json({
      schedules,
      employees,
    });
  } catch (error) {
    console.error("Error in fetchReferenceSchedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch reference schedules" },
      { status: 500 }
    );
  }
}
