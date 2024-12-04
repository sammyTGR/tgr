import { NextResponse } from "next/server";
import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { createClient } from "@/utils/supabase/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const timeZone = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the incoming date and convert to Pacific Time
    const parsedDate = parseISO(schedule_date);
    const pacificDate = toZonedTime(parsedDate, timeZone);

    // Format the date for database storage - no need for additional adjustments
    const formattedScheduleDate = formatTZ(pacificDate, "yyyy-MM-dd", {
      timeZone, // Use Pacific timezone consistently
    });

    console.log("Debug date conversion:", {
      incoming_date: schedule_date,
      parsed_date: parsedDate.toISOString(),
      pacific_date: pacificDate.toISOString(),
      final_formatted: formattedScheduleDate,
    });

    // Rest of the code remains the same...
    const { data: scheduleData, error: scheduleFetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", formattedScheduleDate);

    if (scheduleFetchError) {
      console.error(
        `Error fetching schedule for date ${formattedScheduleDate}:`,
        scheduleFetchError
      );
      return NextResponse.json(
        { error: scheduleFetchError.message },
        { status: 500 }
      );
    }

    if (!scheduleData || scheduleData.length === 0) {
      // Insert new schedule if it doesn't exist
      const { error: scheduleInsertError } = await supabase
        .from("schedules")
        .insert({
          employee_id,
          schedule_date: formattedScheduleDate,
          status,
          day_of_week: formatTZ(pacificDate, "EEEE", { timeZone }),
        });

      if (scheduleInsertError) {
        console.error(
          `Error inserting schedule for date ${formattedScheduleDate}:`,
          scheduleInsertError
        );
        return NextResponse.json(
          { error: scheduleInsertError.message },
          { status: 500 }
        );
      }
    } else {
      // Update existing schedule
      const { error: scheduleUpdateError } = await supabase
        .from("schedules")
        .update({ status })
        .eq("employee_id", employee_id)
        .eq("schedule_date", formattedScheduleDate);

      if (scheduleUpdateError) {
        console.error(
          `Error updating schedule for date ${formattedScheduleDate}:`,
          scheduleUpdateError
        );
        return NextResponse.json(
          { error: scheduleUpdateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Schedule updated successfully",
      data: {
        employee_id,
        schedule_date: formattedScheduleDate,
        status,
        debug_dates: {
          incoming: schedule_date,
          formatted: formattedScheduleDate,
        },
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
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
