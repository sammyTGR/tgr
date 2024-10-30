import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

export async function POST(request: Request) {
  try {
    const { request_id, action, use_sick_time, use_vacation_time, should_reverse } = await request.json();
    const supabase = createClient();

    // Get current request data
    const { data: timeOffData, error: fetchError } = await supabase
      .from("time_off_requests")
      .select("*")
      .eq("request_id", request_id)
      .single();

    if (fetchError || !timeOffData) {
      return NextResponse.json({ error: "Failed to fetch request data" }, { status: 500 });
    }

    // Update request status first without triggering vacation time changes
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

    // Handle vacation time changes separately
    if (timeOffData.use_vacation_time !== use_vacation_time) {
      if (use_vacation_time) {
        // Only deduct if we're enabling vacation time
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

    return NextResponse.json(updatedTimeOff);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}