// src/app/api/update_schedule_status/route.ts
import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const TIME_ZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    console.log("Received date:", schedule_date);

    // Parse the date and ensure it's in Pacific time
    const pacificDate = toDate(parseISO(schedule_date), { timeZone: TIME_ZONE });
    const formattedDate = formatInTimeZone(pacificDate, TIME_ZONE, 'yyyy-MM-dd');

    console.log("Date conversion:", {
      receivedDate: schedule_date,
      pacificDate: pacificDate.toISOString(),
      formattedForDB: formattedDate,
      timezone: TIME_ZONE,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

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
          day_of_week: formatInTimeZone(pacificDate, TIME_ZONE, 'EEEE')
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
        timezone: TIME_ZONE
      }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}