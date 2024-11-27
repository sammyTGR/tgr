import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { employeeId, date, startTime, endTime } = await request.json();

    const { error } = await supabase
      .from("schedules")
      .update({
        start_time: startTime,
        end_time: endTime,
        schedule_date: date,
      })
      .eq("employee_id", employeeId)
      .eq("schedule_date", date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}