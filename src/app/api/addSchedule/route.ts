import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const { employeeName, date, startTime, endTime } = body;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("name", employeeName)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayOfWeek = daysOfWeek[new Date(date + "T00:00:00").getDay()];

    const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    const scheduleData = {
      employee_id: employee.employee_id,
      schedule_date: date,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      day_of_week: dayOfWeek,
      status: "added_day",
      name: employeeName,
    };

    // Check for existing schedule
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("schedules")
      .select()
      .match({ employee_id: employee.employee_id, schedule_date: date })
      .single();

    let result;
    if (existingSchedule) {
      result = await supabase
        .from("schedules")
        .update(scheduleData)
        .match({ schedule_id: existingSchedule.schedule_id })
        .select();
    } else {
      result = await supabase
        .from("schedules")
        .insert(scheduleData)
        .select();
    }

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to add/update schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}