import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current date and 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Update the query to join with employees table
    const { data: timesheets, error } = await supabase
      .from("employee_clock_events")
      .select(
        `
        *,
        employees!inner (
          employee_id,
          name,
          pay_type
        )
      `
      )
      // .gte("event_date", thirtyDaysAgo.toISOString().split("T")[0])
      // .lte("event_date", today.toISOString().split("T")[0])
      .order("event_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedTimesheets = timesheets.map((timesheet) => {
      const formatTime = (time: string | null) => {
        if (!time) return "";
        return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      let totalHours = null;
      if (timesheet.start_time && timesheet.end_time) {
        const start = new Date(`1970-01-01T${timesheet.start_time}`).getTime();
        const end = new Date(`1970-01-01T${timesheet.end_time}`).getTime();
        const lunchStart = timesheet.lunch_start
          ? new Date(`1970-01-01T${timesheet.lunch_start}`).getTime()
          : 0;
        const lunchEnd = timesheet.lunch_end
          ? new Date(`1970-01-01T${timesheet.lunch_end}`).getTime()
          : 0;

        let duration = (end - start) / 1000 / 3600;
        if (lunchStart && lunchEnd) {
          duration -= (lunchEnd - lunchStart) / 1000 / 3600;
        }
        totalHours = duration.toFixed(2);
      }

      // Include employee information in the returned data
      return {
        ...timesheet,
        employee_name: timesheet.employees?.name || timesheet.employee_name,
        pay_type: timesheet.employees?.pay_type,
        start_time: formatTime(timesheet.start_time),
        lunch_start: formatTime(timesheet.lunch_start),
        lunch_end: formatTime(timesheet.lunch_end),
        end_time: formatTime(timesheet.end_time),
        total_hours: totalHours ? `${totalHours} hours` : "",
      };
    });

    // console.log("Raw Timesheets:", timesheets);
    // console.log("Formatted Timesheets:", formattedTimesheets);

    return NextResponse.json(formattedTimesheets);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
