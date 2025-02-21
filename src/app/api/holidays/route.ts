import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { parseISO } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

interface HolidayRequest {
  name: string;
  date: string;
  is_full_day: boolean;
  repeat_yearly: boolean;
}

interface ScheduleData {
  employee_id: number;
  schedule_date: string;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  holiday_id: number;
  status?: string | null;
  notes?: string | null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    const { name, date, is_full_day, repeat_yearly } = body as HolidayRequest;

    if (!name?.trim() || !date?.trim()) {
      return NextResponse.json(
        {
          error: "Name and date are required fields",
          details: { name, date },
        },
        { status: 400 }
      );
    }

    // Format date and get day of week
    const utcDate = parseISO(date);
    const pacificDate = toZonedTime(utcDate, timeZone);
    const formattedDate = format(pacificDate, "yyyy-MM-dd");
    const dayOfWeek = format(pacificDate, "EEEE").trim();

    // Step 1: Insert/Update holiday record
    const { data: holiday, error: holidayError } = await supabase
      .from("holidays")
      .upsert(
        {
          name: name.trim(),
          date: formattedDate,
          is_full_day: Boolean(is_full_day),
          repeat_yearly: Boolean(repeat_yearly),
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" }
      )
      .select()
      .single();

    if (holidayError) {
      console.error("Holiday creation error:", holidayError);
      return NextResponse.json(
        {
          error: "Failed to save holiday",
          details: holidayError,
        },
        { status: 500 }
      );
    }

    // Step 2: Get all reference schedules for this day
    const { data: referenceSchedules, error: refScheduleError } = await supabase
      .from("reference_schedules")
      .select("employee_id, start_time, end_time")
      .eq("day_of_week", dayOfWeek);

    if (refScheduleError) {
      console.error("Error fetching reference schedules:", refScheduleError);
      return NextResponse.json(
        { error: refScheduleError.message },
        { status: 500 }
      );
    }

    if (referenceSchedules && referenceSchedules.length > 0) {
      // Filter out any null employee_ids before querying
      const validEmployeeIds = referenceSchedules
        .map((s) => s.employee_id)
        .filter((id): id is number => id != null);

      if (validEmployeeIds.length === 0) {
        // console.log("No valid employee IDs found in reference schedules");
        return NextResponse.json({
          message: "Holiday saved successfully",
          data: holiday,
        });
      }

      // Get all active employees with their rank information
      const { data: activeEmployees, error: employeesError } = await supabase
        .from("employees")
        .select("employee_id, rank")
        .eq("status", "active")
        .in("employee_id", validEmployeeIds);

      if (employeesError) {
        console.error("Error fetching active employees:", employeesError);
        return NextResponse.json(
          { error: employeesError.message },
          { status: 500 }
        );
      }

      // Process each active employee
      for (const emp of activeEmployees || []) {
        const refSchedule = referenceSchedules.find(
          (ref) => ref.employee_id === emp.employee_id
        );

        if (!refSchedule) continue;

        const scheduleData: ScheduleData = {
          employee_id: emp.employee_id,
          schedule_date: formattedDate,
          day_of_week: dayOfWeek,
          start_time: refSchedule.start_time,
          end_time: refSchedule.end_time,
          holiday_id: holiday.id,
          status: undefined,
          notes: undefined,
        };

        const hasValidTimes =
          refSchedule.start_time &&
          refSchedule.end_time &&
          refSchedule.start_time.trim() !== "" &&
          refSchedule.end_time.trim() !== "";

        if (hasValidTimes && emp.rank !== null && emp.rank !== undefined) {
          scheduleData.status = `Custom: Closed For ${name.trim()}`;
          scheduleData.notes = `Closed For ${name.trim()}`;
        } else {
          scheduleData.status = "not scheduled";
          scheduleData.notes = null;
        }

        const { error: scheduleError } = await supabase
          .from("schedules")
          .upsert(scheduleData, {
            onConflict: "employee_id,schedule_date",
          });

        if (scheduleError) {
          console.error("Error upserting schedule:", scheduleError);
        }
      }
    }

    return NextResponse.json({
      message: "Holiday saved successfully",
      data: holiday,
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
