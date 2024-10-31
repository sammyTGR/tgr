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

    // Check if this is just a vacation time toggle or an action change
    const isVacationToggle = timeOffData.use_vacation_time !== use_vacation_time;
    const isActionChange = (
      action === "time_off" || 
      action === "deny" || 
      action === "called_out" || 
      action === "left_early" || 
      action.startsWith("Custom:")
    );

    // Handle vacation time toggle without changing is_read
    if (isVacationToggle && !isActionChange) {
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

      // Just update use_vacation_time without changing is_read
      const { data: updatedRequest, error: updateError } = await supabase
        .from("time_off_requests")
        .update({ use_vacation_time })
        .eq("request_id", request_id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json(updatedRequest);
    }

    // Handle action changes (approve, deny, etc.)
    if (isActionChange) {
      // Update schedules first
      if (timeOffData.employee_id) {
        let scheduleStatus = action === "time_off" ? "time_off" : action;
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

      // Update time off request with is_read only for action changes
      const { data: updatedTimeOff, error: timeOffError } = await supabase
        .from("time_off_requests")
        .update({
          status: action,
          use_sick_time,
          use_vacation_time: timeOffData.use_vacation_time,
          is_read: true, // Only set is_read for action changes
        })
        .eq("request_id", request_id)
        .select()
        .single();

      if (timeOffError) {
        return NextResponse.json({ error: timeOffError.message }, { status: 500 });
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
    }

    // If neither vacation toggle nor action change, just return current data
    return NextResponse.json(timeOffData);
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