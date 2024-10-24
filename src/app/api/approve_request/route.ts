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

    // Update the status of the time off request
    const { data: timeOffData, error: timeOffError } = await supabase
      .from("time_off_requests")
      .update({
        status: action,
        use_sick_time,
        use_vacation_time,
        is_read: true,
      })
      .eq("request_id", request_id)
      .select("employee_id, start_date, end_date, email")
      .single();

    if (timeOffError) {
      console.error("Error updating request status:", timeOffError);
      return NextResponse.json({ error: timeOffError.message }, { status: 500 });
    }

    if (!timeOffData) {
      console.error("No data returned from time off request update");
      return NextResponse.json({ error: "Time off request not found" }, { status: 404 });
    }

    // Update the schedules table for all actions
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
        // Revert the time off request update
        await supabase
          .from("time_off_requests")
          .update({ status: "pending", use_sick_time: false, use_vacation_time: false, is_read: false })
          .eq("request_id", request_id);
        return NextResponse.json({ error: scheduleError.message }, { status: 500 });
      }
    }

    if (use_sick_time) {
      const { error: sickTimeError } = await supabase.rpc("deduct_sick_time", {
        p_emp_id: timeOffData.employee_id,
        p_start_date: timeOffData.start_date,
        p_end_date: timeOffData.end_date,
      });

      if (sickTimeError) {
        console.error("Error deducting sick time:", sickTimeError);
        // Revert the time off request update
        await supabase
          .from("time_off_requests")
          .update({ status: "pending", use_sick_time: false, is_read: false })
          .eq("request_id", request_id);
        return NextResponse.json({ error: sickTimeError.message }, { status: 500 });
      }
    }

    // if (use_vacation_time) {
    //   console.log('Calling deduct_vacation_time with:', {
    //     p_emp_id: timeOffData.employee_id,
    //     p_start_date: timeOffData.start_date,
    //     p_end_date: timeOffData.end_date,
    //   });
    //   const { data: vacationTimeData, error: vacationTimeError } = await supabase.rpc("deduct_vacation_time", {
    //     p_emp_id: timeOffData.employee_id,
    //     p_start_date: timeOffData.start_date,
    //     p_end_date: timeOffData.end_date,
    //   });

    //   if (vacationTimeError) {
    //     console.error("Error deducting vacation time:", vacationTimeError);
    //     // Revert the time off request update
    //     await supabase
    //       .from("time_off_requests")
    //       .update({ status: "pending", use_vacation_time: false, is_read: false })
    //       .eq("request_id", request_id);
    //     return NextResponse.json({ error: vacationTimeError.message }, { status: 500 });
    //   }
    // }

    if (!timeOffData.email) {
      console.error("Email not found in the time off request:", timeOffData);
      return NextResponse.json({ error: "Email not found in the time off request" }, { status: 400 });
    }

    return NextResponse.json(timeOffData);
  } catch (err: any) {
    console.error("Unexpected error updating request status:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error updating request status" },
      { status: 500 }
    );
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
