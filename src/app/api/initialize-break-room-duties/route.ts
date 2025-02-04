import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addWeeks, startOfWeek, format, addDays } from "date-fns";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all sales employees
    const { data: salesEmployees, error: employeesError } = await supabase
      .from("employees")
      .select("employee_id, rank")
      .eq("department", "Sales")
      .order("rank");

    if (employeesError) throw employeesError;
    if (!salesEmployees || salesEmployees.length === 0) {
      return NextResponse.json(
        { error: "No sales employees found" },
        { status: 400 }
      );
    }

    // Start from the first week of 2025
    let currentDate = new Date("2025-01-01");
    currentDate = startOfWeek(currentDate);
    const endDate = new Date("2025-12-31");
    let currentEmployeeIndex = 0;
    const duties = [];
    let skippedWeeks = 0;

    while (currentDate <= endDate) {
      const weekStart = format(currentDate, "yyyy-MM-dd");
      const friday = addDays(currentDate, 5); // Get Friday of current week
      const dutyDate = format(friday, "yyyy-MM-dd");

      let employeeAssigned = false;
      let attemptsCount = 0;

      // Try to assign duty to each employee until one is found who is scheduled
      while (!employeeAssigned && attemptsCount < salesEmployees.length) {
        const employee = salesEmployees[currentEmployeeIndex];

        // Check if employee is scheduled for this Friday
        const { data: schedules } = await supabase
          .from("schedules")
          .select("*")
          .eq("employee_id", employee.employee_id)
          .eq("schedule_date", dutyDate)
          .in("status", ["scheduled", "added_day"]);

        if (schedules && schedules.length > 0) {
          duties.push({
            week_start: weekStart,
            employee_id: employee.employee_id,
            duty_date: dutyDate,
            created_by: user.id,
            created_at: new Date().toISOString(),
            year: 2025,
          });
          employeeAssigned = true;
        }

        currentEmployeeIndex =
          (currentEmployeeIndex + 1) % salesEmployees.length;
        attemptsCount++;
      }

      if (!employeeAssigned) {
        skippedWeeks++;
      }

      currentDate = addWeeks(currentDate, 1);
    }

    if (duties.length > 0) {
      const { data, error } = await supabase
        .from("break_room_duty")
        .insert(duties)
        .select();

      if (error) throw error;

      return NextResponse.json({
        message: `Successfully created ${duties.length} break room duties for 2025. Skipped ${skippedWeeks} weeks due to no scheduled employees.`,
        data,
      });
    }

    return NextResponse.json({
      message: `No new duties created. Skipped ${skippedWeeks} weeks.`,
    });
  } catch (error: any) {
    console.error("Error initializing break room duties:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
