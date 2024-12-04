import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

interface Employee {
  employee_id: number;
  name: string;
  department: string;
  role: string;
  contact_info: string;
}

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status: string;
  employee_id: number;
}

interface EmployeeCalendar {
  employee_id: number;
  name: string;
  events: CalendarEvent[];
}

async function getCalendarData(
  start_date: string,
  end_date: string
): Promise<EmployeeCalendar[]> {
  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      day_of_week,
      start_time,
      end_time,
      schedule_date,
      status,
      employee:employee_id (
        employee_id,
        name,
        department,
        role,
        contact_info
      )
    `)
    .gte("schedule_date", start_date)
    .lte("schedule_date", end_date)
    .order("employee_id", { ascending: true });

  if (error) {
    console.error("Database query error:", error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    // console.log("No data returned from the query");
    return [];
  }

  const result: EmployeeCalendar[] = data.reduce(
    (acc: EmployeeCalendar[], item: any) => {
      const employee = item.employee;

      if (!employee) {
        return acc; // Skip if no employee is linked
      }

      let empCalendar = acc.find(
        (emp) => emp.employee_id === employee.employee_id
      );
      if (!empCalendar) {
        empCalendar = {
          employee_id: employee.employee_id,
          name: employee.name,
          events: [],
        };
        acc.push(empCalendar);
      }

      empCalendar.events.push({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        schedule_date: item.schedule_date,
        status: item.status,
        employee_id: employee.employee_id,
      });

      return acc;
    },
    []
  );

  return result;
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const { start_date, end_date } = await request.json();
    
    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: "start_date and end_date are required" },
        { status: 400 }
      );
    }

    const data = await getCalendarData(start_date, end_date);
    // console.log(`Fetched calendar data for ${start_date} to ${end_date}`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in handler:", error.message);
    return NextResponse.json(
      {
        message: "Failed to fetch calendar data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}