import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const date = searchParams.get("date");
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!employeeId || !date) {
      return NextResponse.json(
        { error: "Employee ID and date are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("schedules")
      .select("start_time, end_time")
      .eq("employee_id", employeeId)
      .eq("schedule_date", date)
      .single();

    if (error) {
      console.error("Error fetching schedule:", error);
      return NextResponse.json(null);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in fetchScheduleByDate:", error);
    return NextResponse.json(null);
  }
}
