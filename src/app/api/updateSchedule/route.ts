import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { parseISO, format } from "date-fns";

const TIME_ZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const { employeeId, date, startTime, endTime } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employee name first
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("name")
      .eq("employee_id", employeeId)
      .single();

    if (employeeError) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Ensure the date is treated as Pacific time from the start
    const pacificDate = toZonedTime(parseISO(`${date}T00:00:00`), TIME_ZONE);
    const dayOfWeek = format(pacificDate, "EEEE");
    const formattedDate = format(pacificDate, "yyyy-MM-dd");

    const { error } = await supabase
      .from("schedules")
      .update({
        start_time: startTime,
        end_time: endTime,
        schedule_date: formattedDate,
        name: employee.name,
        day_of_week: dayOfWeek,
      })
      .eq("employee_id", employeeId)
      .eq("schedule_date", date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      debug: {
        originalDate: date,
        pacificDate: pacificDate.toISOString(),
        formattedDate,
        dayOfWeek,
        timezone: TIME_ZONE,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
