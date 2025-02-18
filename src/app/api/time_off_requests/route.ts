import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

interface TimeOffRequest {
  request_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  other_reason: string;
  status: string;
  name: string;
  email: string;
  use_sick_time: boolean;
  use_vacation_time: boolean;
  available_sick_time: number;
  created_at: string;
  pay_type: string;
  hire_date: string;
  vacation_time: number;
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching time off requests..."); // Debug log

    // First query to get time off requests
    const { data: timeOffData, error: timeOffError } = await supabase
      .from("time_off_requests")
      .select(
        `
        *,
        employees!time_off_requests_user_uuid_fkey (
          employee_id,
          sick_time_used,
          vacation_time,
          pay_type,
          name
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (timeOffError) {
      console.error("Error in initial query:", timeOffError);
      return NextResponse.json(
        {
          error: "Database query failed",
          details: timeOffError.message,
        },
        { status: 500 }
      );
    }

    console.log("Initial time off data:", timeOffData); // Debug log

    if (!timeOffData || timeOffData.length === 0) {
      return NextResponse.json([]);
    }

    try {
      const enrichedData = await Promise.all(
        timeOffData.map(async (request) => {
          console.log("Processing request:", request.request_id); // Debug log

          const [sickTimeResult, employeeResult, hoursBreakdownResult] =
            await Promise.all([
              supabase.rpc("calculate_available_sick_time", {
                p_emp_id: request.employee_id,
              }),
              supabase
                .from("employees")
                .select("pay_type, hire_date, vacation_time")
                .eq("employee_id", request.employee_id)
                .single(),
              request.use_sick_time
                ? supabase.rpc("calculate_scheduled_hours", {
                    p_employee_id: request.employee_id,
                    p_start_date: request.start_date,
                    p_end_date: request.end_date,
                  })
                : Promise.resolve({ data: null, error: null }),
            ]);

          if (sickTimeResult.error) {
            console.error(
              `Failed to fetch sick time for employee ID ${request.employee_id}:`,
              sickTimeResult.error
            );
          }

          if (employeeResult.error) {
            console.error(
              `Failed to fetch employee data for employee ID ${request.employee_id}:`,
              employeeResult.error
            );
          }

          if (hoursBreakdownResult.error) {
            console.error(
              `Failed to calculate hours breakdown for request ${request.request_id}:`,
              hoursBreakdownResult.error
            );
          }

          const availableSickTime = sickTimeResult.error
            ? 0
            : parseFloat(Number(sickTimeResult.data).toFixed(2));

          return {
            ...request,
            available_sick_time: availableSickTime,
            pay_type: employeeResult.data?.pay_type || "unknown",
            hire_date: employeeResult.data?.hire_date || null,
            vacation_time: employeeResult.data?.vacation_time || 0,
            hours_breakdown: hoursBreakdownResult.data || null,
          };
        })
      );

      console.log("Enriched data:", enrichedData); // Debug log
      return NextResponse.json(enrichedData);
    } catch (enrichError) {
      console.error("Error enriching data:", enrichError);
      return NextResponse.json(
        {
          error: "Failed to enrich data",
          details:
            enrichError instanceof Error
              ? enrichError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Unexpected error in GET handler:", err);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
