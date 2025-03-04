import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  parseISO,
  addMinutes,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";

const VALID_VTO_TYPES = ["called_out", "no_call_no_show"] as const;
type ValidVTOType = (typeof VALID_VTO_TYPES)[number];

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

    // Convert single date to array for consistent processing
    const dates = Array.isArray(body.event_date)
      ? body.event_date
      : [body.event_date];
    const results = [];
    const errors = [];

    // Process each date
    for (const date of dates) {
      try {
        // Fetch schedule for this employee and date
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("schedules")
          .select("start_time, end_time, status")
          .eq("employee_id", body.employee_id)
          .eq("schedule_date", date)
          .maybeSingle();

        if (scheduleError) {
          errors.push({
            date,
            error: "Failed to fetch schedule data",
            details: scheduleError,
          });
          continue;
        }

        // Skip dates with no schedule
        if (!scheduleData) {
          results.push({
            date,
            status: "skipped",
            message: "No schedule found for this date",
          });
          continue;
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
          // Set lunch start to 4.5 hours after start time
          lunchStart = addMinutes(startTime, 270);

          // If lunch start would be after end time, adjust it
          if (lunchStart > endTime) {
            lunchStart = addMinutes(endTime, -60);
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

        // Determine VTO type - ensure it's a valid value
        let vtoType: ValidVTOType = "called_out";
        if (body.status && VALID_VTO_TYPES.includes(body.status)) {
          vtoType = body.status as ValidVTOType;
        }

        // Create VTO entry for this date
        const insertData = {
          employee_id: body.employee_id,
          event_date: date,
          total_hours: "0", // This will be calculated by the trigger
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
          lunch_start: lunchStart,
          lunch_end: lunchEnd,
          employee_name: body.employee_name,
          vto_type: vtoType,
        };

        const { data, error } = await supabase
          .from("employee_vto_events")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          errors.push({
            date,
            error: "Failed to create VTO entry",
            details: error,
          });
        } else {
          results.push({ date, status: "success", data });
        }
      } catch (error) {
        console.error("Processing error:", error);
        errors.push({ date, error: "Unexpected error", details: error });
      }
    }

    // Return combined results
    return NextResponse.json({
      results,
      errors: errors.length > 0 ? errors : undefined,
      success: errors.length === 0,
    });
  } catch (error) {
    console.error("Error processing VTO entries:", error);
    return NextResponse.json(
      { error: "Failed to process VTO entries", details: error },
      { status: 500 }
    );
  }
}
