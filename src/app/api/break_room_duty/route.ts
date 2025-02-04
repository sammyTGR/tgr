import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart");
  const getLastAssignment =
    url.searchParams.get("getLastAssignment") === "true";

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!weekStart && !getLastAssignment) {
      return NextResponse.json(
        {
          error: "Week start date is required",
        },
        { status: 400 }
      );
    }

    if (getLastAssignment) {
      const { data, error } = await supabase
        .from("break_room_duty")
        .select("employee_id")
        .order("week_start", { ascending: false })
        .limit(1);

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("break_room_duty")
      .select("*")
      .eq("week_start", weekStart);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      week_start,
      employee_id,
      duty_date,
      checkSchedule = true,
    } = await request.json();

    // Validate required fields
    if (!week_start || !employee_id || !duty_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const weekDates = getWeekDates(duty_date);

    // Get all eligible employees ordered by employee_id
    const { data: allEligibleEmployees, error: eligibleError } = await supabase
      .from("employees")
      .select("employee_id")
      .in("department", ["Sales", "Range"])
      .eq("status", "active")
      .order("employee_id", { ascending: true });

    if (eligibleError) throw eligibleError;

    // Get the last assignment
    const { data: lastAssignment, error: lastAssignmentError } = await supabase
      .from("break_room_duty")
      .select("employee_id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastAssignmentError) throw lastAssignmentError;

    const lastAssignedEmployeeId = lastAssignment?.[0]?.employee_id;

    // Function to find closest scheduled day to Friday
    const findClosestScheduledDay = async (employeeId: number) => {
      const { data: schedules, error: scheduleError } = await supabase
        .from("schedules")
        .select("*")
        .eq("employee_id", employeeId)
        .in("schedule_date", weekDates)
        .in("status", ["scheduled", "added_day"])
        .order("schedule_date", { ascending: true });

      if (scheduleError || !schedules?.length) return null;

      // Check Friday first
      const friday = weekDates[4];
      const fridaySchedule = schedules.find((s) => s.schedule_date === friday);
      if (fridaySchedule) return friday;

      // If not scheduled Friday, find closest day
      return schedules.reduce((closest, schedule) => {
        const currentDiff = Math.abs(
          new Date(schedule.schedule_date).getTime() -
            new Date(friday).getTime()
        );
        const closestDiff = Math.abs(
          new Date(closest.schedule_date).getTime() - new Date(friday).getTime()
        );
        return currentDiff < closestDiff ? schedule : closest;
      }).schedule_date;
    };

    // Function to find next eligible employee
    const findNextEligibleEmployee = async () => {
      // Find the next employee after the last assigned one
      const eligibleEmployeeIds = allEligibleEmployees.map(
        (e) => e.employee_id
      );
      const currentIndex = lastAssignedEmployeeId
        ? eligibleEmployeeIds.indexOf(lastAssignedEmployeeId)
        : -1;

      // Check each employee in sequential order
      for (let i = 0; i < eligibleEmployeeIds.length; i++) {
        const nextIndex = (currentIndex + 1 + i) % eligibleEmployeeIds.length;
        const employeeId = eligibleEmployeeIds[nextIndex];

        const closestDate = await findClosestScheduledDay(employeeId);
        if (closestDate) {
          return { employee_id: employeeId, duty_date: closestDate };
        }
      }

      return null;
    };

    // Determine which employee to assign
    let assigneeId = employee_id;
    let actualDutyDate = duty_date;

    if (checkSchedule) {
      const closestDate = await findClosestScheduledDay(employee_id);

      if (!closestDate) {
        const nextEmployee = await findNextEligibleEmployee();
        if (!nextEmployee) {
          return NextResponse.json(
            {
              error:
                "No eligible employees found for break room duty this week",
            },
            { status: 400 }
          );
        }
        assigneeId = nextEmployee.employee_id;
        actualDutyDate = nextEmployee.duty_date;
      } else {
        actualDutyDate = closestDate;
      }
    }

    // Create the duty assignment
    const { data, error } = await supabase
      .from("break_room_duty")
      .insert({
        week_start,
        employee_id: assigneeId,
        duty_date: actualDutyDate,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Break room duty error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get all dates in the week
function getWeekDates(fridayDate: string): string[] {
  const friday = new Date(fridayDate);
  const monday = new Date(friday);
  monday.setDate(friday.getDate() - 4);

  const dates = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
