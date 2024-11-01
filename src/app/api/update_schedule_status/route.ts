import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();

  try {
    // Single timezone conversion for database
    const utcDate = parseISO(schedule_date);
    const pacificDate = toZonedTime(utcDate, timeZone);
    
    // Format for database
    const formattedScheduleDate = format(pacificDate, "yyyy-MM-dd");

    // Check if the date exists in the schedules table
    const { data: scheduleData, error: scheduleFetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", schedule_date);

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
          status
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
        .eq("schedule_date", schedule_date);

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