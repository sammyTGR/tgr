import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatTZ } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();

  try {
    // Parse the incoming date and handle timezone conversion properly
    const parsedDate = parseISO(schedule_date);
    
    // Convert to Pacific Time using toZonedTime
    const pacificDate = toZonedTime(parsedDate, timeZone);
    
    // Format for database using formatTZ to ensure consistent timezone handling
    const formattedScheduleDate = formatTZ(pacificDate, "yyyy-MM-dd", { timeZone });

    console.log('Incoming schedule_date:', schedule_date);
    console.log('Parsed date:', parsedDate);
    console.log('Pacific date:', pacificDate);
    console.log('Formatted schedule date:', formattedScheduleDate);

    // Check if the date exists in the schedules table
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
          day_of_week: formatTZ(pacificDate, 'EEEE', { timeZone })
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
        status
      }
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