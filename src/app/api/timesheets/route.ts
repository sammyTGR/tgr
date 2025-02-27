import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  parseISO,
  addMinutes,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // console.log("Received timesheet data:", body);

    // First, fetch the schedule for this employee and date
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("schedules")
      .select("start_time, end_time, status")
      .eq("employee_id", body.employee_id)
      .eq("schedule_date", body.event_date)
      .single();

    if (scheduleError) {
      console.error("Error fetching schedule:", scheduleError);
      throw new Error("Failed to fetch schedule data");
    }

    if (!scheduleData || !scheduleData.start_time) {
      throw new Error("No schedule found for this employee on this date");
    }

    // Calculate lunch break times
    const startTime = new Date(`1970-01-01T${scheduleData.start_time}`);
    const endTime = new Date(`1970-01-01T${scheduleData.end_time}`);

    let lunchStart = null;
    let lunchEnd = null;

    // Calculate total shift duration in hours
    const shiftDuration = differenceInHours(endTime, startTime);

    // Only add lunch if shift is long enough (e.g., 6 hours or more)
    if (shiftDuration >= 6) {
      // Set lunch start to 4.5 hours after start time (ensuring it's not later than 5 hours)
      lunchStart = addMinutes(startTime, 270); // 4.5 hours = 270 minutes

      // If lunch start would be after end time, adjust it
      if (lunchStart > endTime) {
        lunchStart = addMinutes(endTime, -60); // Set 1 hour before end time
      }

      // Add 30 minutes to lunch start to get lunch end
      lunchEnd = addMinutes(lunchStart, 30);

      // Format times to HH:mm:ss
      lunchStart = lunchStart.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      lunchEnd = lunchEnd.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    // Use the schedule times for the VTO entry
    const insertData = {
      employee_id: body.employee_id,
      event_date: body.event_date,
      total_hours: "0", // This will be calculated by the trigger
      start_time: scheduleData.start_time,
      end_time: scheduleData.end_time,
      lunch_start: lunchStart,
      lunch_end: lunchEnd,
      employee_name: body.employee_name,
      vto_type: scheduleData.status, // Add the VTO type from the schedule status
    };

    // console.log("Inserting timesheet data:", insertData);

    const { data, error } = await supabase
      .from("employee_vto_events") // Use the new table
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating VTO entry:", error);
    return NextResponse.json(
      { error: "Failed to create VTO entry", details: error },
      { status: 500 }
    );
  }
}
