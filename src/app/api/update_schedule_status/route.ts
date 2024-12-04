import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const TIME_ZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    console.log("API received date:", schedule_date);

    // Parse the date and explicitly convert to Pacific Time
    const parsedDate = parseISO(schedule_date);
    const pacificDate = toZonedTime(parsedDate, TIME_ZONE);

    // Format the date for database storage while preserving Pacific timezone
    const formattedScheduleDate = formatInTimeZone(
      pacificDate,
      TIME_ZONE,
      "yyyy-MM-dd"
    );

    console.log("Date conversion in API:", {
      received: schedule_date,
      parsed: parsedDate.toISOString(),
      pacific: pacificDate.toISOString(),
      formatted: formattedScheduleDate,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // Update schedule with explicit timezone handling
    const { data: scheduleData, error: scheduleFetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", formattedScheduleDate);

    if (scheduleFetchError) {
      console.error("Schedule fetch error:", scheduleFetchError);
      return NextResponse.json(
        { error: scheduleFetchError.message },
        { status: 500 }
      );
    }

    if (!scheduleData || scheduleData.length === 0) {
      const { error: insertError } = await supabase.from("schedules").insert({
        employee_id,
        schedule_date: formattedScheduleDate,
        status,
        day_of_week: formatInTimeZone(pacificDate, TIME_ZONE, "EEEE"),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("schedules")
        .update({ status })
        .eq("employee_id", employee_id)
        .eq("schedule_date", formattedScheduleDate);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    // Return success with debug information
    return NextResponse.json({
      message: "Schedule updated successfully",
      debug: {
        receivedDate: schedule_date,
        storedDate: formattedScheduleDate,
        timezone: TIME_ZONE,
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
