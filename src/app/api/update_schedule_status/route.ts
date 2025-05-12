// src/app/api/update_schedule_status/route.ts
import { NextResponse } from "next/server";
import { parseISO, format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const TIME_ZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Parse the date and convert to Pacific timezone
    const parsedDate = parseISO(schedule_date);
    const pacificDate = toZonedTime(parsedDate, TIME_ZONE);

    // Format the date for database storage
    const formattedDate = formatInTimeZone(
      pacificDate,
      TIME_ZONE,
      "yyyy-MM-dd"
    );

    // Get the day of week in Pacific timezone
    const dayOfWeek = formatInTimeZone(pacificDate, TIME_ZONE, "EEEE");

    // Update schedule
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", formattedDate)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (!existingSchedule) {
      // Insert new schedule
      const { error: insertError } = await supabase.from("schedules").insert({
        employee_id,
        schedule_date: formattedDate,
        status,
        day_of_week: dayOfWeek,
      });

      if (insertError) throw insertError;
    } else {
      // Update existing schedule
      const { error: updateError } = await supabase
        .from("schedules")
        .update({ status, day_of_week: dayOfWeek })
        .eq("employee_id", employee_id)
        .eq("schedule_date", formattedDate);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      success: true,
      debug: {
        receivedDate: schedule_date,
        storedDate: formattedDate,
        dayOfWeek,
        timezone: TIME_ZONE,
      },
    });
  } catch (error: any) {
    // console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
