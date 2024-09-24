import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

// Function to get the day of the week from a date
const getDayOfWeek = (date: Date): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getUTCDay()];
};

export async function POST(request: Request) {
  const { employee_id, day, start_time, end_time } = await request.json();

  if (!employee_id || !day || !start_time || !end_time) {
    console.error("Missing required fields", {
      employee_id,
      day,
      start_time,
      end_time,
    });
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const scheduleDate = new Date(day);
    const dayOfWeek = getDayOfWeek(scheduleDate);

    // Check if a schedule already exists for the same employee and day
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("schedules")
      .select("schedule_id")
      .eq("employee_id", employee_id)
      .eq("schedule_date", day)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // 'PGRST116' is the 'No rows found' error code
      console.error("Error fetching existing schedule:", fetchError);
      throw fetchError;
    }

    if (existingSchedule) {
      console.warn(
        "Schedule already exists for this employee on this day",
        existingSchedule
      );
      return NextResponse.json(
        { message: "Schedule already exists for this employee on this day" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from("schedules").insert({
      employee_id,
      schedule_date: day,
      day_of_week: dayOfWeek,
      start_time,
      end_time,
      status: "scheduled",
    });

    if (insertError) {
      console.error("Error inserting schedule:", insertError);
      throw insertError;
    }

    return NextResponse.json({ message: "Schedule submitted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
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
