import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("time_off_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching time off requests:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    const enrichedData = await Promise.all(
      data.map(async (request: TimeOffRequest) => {
        const [sickTimeResult, employeeResult] = await Promise.all([
          supabase.rpc("calculate_available_sick_time", {
            p_emp_id: request.employee_id,
          }),
          supabase
            .from("employees")
            .select("pay_type, hire_date, vacation_time")
            .eq("employee_id", request.employee_id)
            .single(),
        ]);

        const sickTimeData = sickTimeResult.data;
        const sickTimeError = sickTimeResult.error;
        const employeeData = employeeResult.data;
        const employeeError = employeeResult.error;

        if (sickTimeError) {
          console.error(
            `Failed to fetch sick time for employee ID ${request.employee_id}:`,
            sickTimeError.message
          );
        }

        if (employeeError) {
          console.error(
            `Failed to fetch employee data for employee ID ${request.employee_id}:`,
            employeeError.message
          );
        }

        return {
          ...request,
          available_sick_time: sickTimeError ? 40 : (sickTimeData as number),
          pay_type: employeeData?.pay_type || "unknown",
          hire_date: employeeData?.hire_date || null,
          vacation_time: employeeData?.vacation_time || 0,
        };
      })
    );

    return NextResponse.json(enrichedData);
  } catch (err) {
    console.error("Unexpected error fetching time off requests:", err);
    return NextResponse.json(
      { error: "Unexpected error fetching time off requests" },
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
