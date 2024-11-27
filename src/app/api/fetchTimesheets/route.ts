import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current date and 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const { data: timesheets, error } = await supabase
      .from("employee_clock_events")
      .select("*")
      .gte("event_date", thirtyDaysAgo.toISOString().split("T")[0])
      .lte("event_date", today.toISOString().split("T")[0])
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

      return {
        ...timesheet,
        start_time: formatTime(timesheet.start_time),
        lunch_start: formatTime(timesheet.lunch_start),
        lunch_end: formatTime(timesheet.lunch_end),
        end_time: formatTime(timesheet.end_time),
        total_hours: totalHours ? `${totalHours} hours` : "",
      };
    });

    return NextResponse.json(formattedTimesheets);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}