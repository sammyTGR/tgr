import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    let query = supabase.from("schedules").select("*");

    // Handle schedule type (reference or actual)
    const scheduleType = searchParams.get("type");
    if (scheduleType === "actual") {
      query = query.or("status.eq.scheduled,status.eq.added_day");
    } else if (scheduleType === "reference") {
      query = query.eq("status", "reference");
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in fetchSchedules:', error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employee_id, schedule_date, start_time, end_time } = body;

    const { data, error } = await supabase
      .from("schedules")
      .update({
        start_time,
        end_time,
        schedule_date,
      })
      .eq("employee_id", employee_id)
      .eq("schedule_date", schedule_date)
      .select();

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in updateSchedule:', error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}