// src/app/api/update_schedule_status/route.ts
import { NextResponse } from "next/server";
import { parseISO, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const TIME_ZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // console.log("Received date:", schedule_date);

    // Use the date as received, without timezone conversion
    const formattedDate = schedule_date;

    // For day of week, use formatInTimeZone to get correct day name
    const dayOfWeek = formatInTimeZone(
      parseISO(schedule_date),
      TIME_ZONE,
      'EEEE'
    );

    // console.log("Date conversion:", {
    //   receivedDate: schedule_date,
    //   formattedForDB: formattedDate,
    //   dayOfWeek,
    //   timezone: TIME_ZONE,
    //   serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    // });

    // Update schedule
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", formattedDate)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingSchedule) {
      // Insert new schedule
      const { error: insertError } = await supabase
        .from("schedules")
        .insert({
          employee_id,
          schedule_date: formattedDate,
          status,
          day_of_week: dayOfWeek
        });

      if (insertError) throw insertError;
    } else {
      // Update existing schedule
      const { error: updateError } = await supabase
        .from("schedules")
        .update({ status })
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
        timezone: TIME_ZONE
      }
    });

  } catch (error: any) {
    // console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}