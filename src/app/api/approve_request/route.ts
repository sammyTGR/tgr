import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

export async function POST(request: Request) {
  try {
    const { request_id, action, use_sick_time, use_vacation_time } = await request.json();

    if (!request_id || typeof action !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (use_sick_time && use_vacation_time) {
      return NextResponse.json(
        { error: "Cannot use both sick time and vacation time for the same request" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // First get the time off request data
    const { data: timeOffData, error: fetchError } = await supabase
      .from("time_off_requests")
      .select("*")
      .eq("request_id", request_id)
      .single();

    if (fetchError || !timeOffData) {
      return NextResponse.json({ error: "Failed to fetch request data" }, { status: 500 });
    }

    // Update schedules first
    if (timeOffData.employee_id) {
      let scheduleStatus = action;
      if (action.startsWith("Custom:")) {
        scheduleStatus = action; // Keep the full custom status
      }

      const { error: scheduleError } = await supabase
        .from("schedules")
        .update({ status: scheduleStatus })
        .eq("employee_id", timeOffData.employee_id)
        .gte("schedule_date", timeOffData.start_date)
        .lte("schedule_date", timeOffData.end_date);

      if (scheduleError) {
        console.error("Error updating schedules:", scheduleError);
        return NextResponse.json({ error: scheduleError.message }, { status: 500 });
      }
    }

    // Update time off request status
    const { data: updatedTimeOff, error: timeOffError } = await supabase
      .from("time_off_requests")
      .update({
        status: action,
        use_sick_time,
        use_vacation_time: timeOffData.use_vacation_time, // Keep current value temporarily
        is_read: true,
      })
      .eq("request_id", request_id)
      .select()
      .single();

    if (timeOffError) {
      return NextResponse.json({ error: timeOffError.message }, { status: 500 });
    }

    // Handle vacation time changes
    if (timeOffData.use_vacation_time !== use_vacation_time) {
      if (use_vacation_time) {
        const { error: deductError } = await supabase.rpc('deduct_vacation_time', {
          p_emp_id: timeOffData.employee_id,
          p_start_date: timeOffData.start_date,
          p_end_date: timeOffData.end_date,
          p_use_vacation_time: true
        });

        if (deductError) {
          return NextResponse.json({ error: deductError.message }, { status: 500 });
        }
      }

      // Update use_vacation_time after handling the time changes
      await supabase
        .from("time_off_requests")
        .update({ use_vacation_time })
        .eq("request_id", request_id);
    }

    // Handle sick time if needed
    if (use_sick_time) {
      const { error: sickTimeError } = await supabase.rpc("deduct_sick_time", {
        p_emp_id: timeOffData.employee_id,
        p_start_date: timeOffData.start_date,
        p_end_date: timeOffData.end_date,
      });

      if (sickTimeError) {
        console.error("Error deducting sick time:", sickTimeError);
        return NextResponse.json({ error: sickTimeError.message }, { status: 500 });
      }
    }

    return NextResponse.json(updatedTimeOff);
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}