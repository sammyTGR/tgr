import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseISO } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const TIME_ZONE = "America/Los_Angeles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error: "Start date and end date are required",
        },
        { status: 400 }
      );
    }

    // Fetch calendar data
    const { data: schedules, error: schedulesError } = await supabase
      .from("schedules")
      .select(
        `
        *,
        employees (
          name,
          department,
          rank,
          hire_date,
          birthday
        )
      `
      )
      .gte("schedule_date", startDate)
      .lte("schedule_date", endDate);

    if (schedulesError) {
      throw schedulesError;
    }

    // Fetch holidays for the same period
    const { data: holidays, error: holidaysError } = await supabase
      .from("holidays")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    if (holidaysError) {
      throw holidaysError;
    }

    // Process and combine the data
    const groupedData: { [key: number]: any } = {};

    schedules?.forEach((item: any) => {
      if (!groupedData[item.employee_id]) {
        groupedData[item.employee_id] = {
          employee_id: item.employee_id,
          name: item.employees.name,
          department: item.employees.department,
          rank: item.employees.rank,
          hire_date: item.employees.hire_date,
          events: [],
        };
      }

      const event = {
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        schedule_date: item.schedule_date,
        status: item.status,
        employee_id: item.employee_id,
        birthday: item.employees.birthday,
        notes: item.notes,
        holiday_id: item.holiday_id,
      };

      // Update event if there's a holiday
      const holiday = holidays?.find((h) => h.date === item.schedule_date);
      if (holiday) {
        event.status = "holiday";
        event.notes = `Closed for ${holiday.name}`;
      }

      groupedData[item.employee_id].events.push(event);
    });

    return NextResponse.json(Object.values(groupedData));
  } catch (error: any) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
