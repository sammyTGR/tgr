import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First query to get time off requests
    const timeOffResult = await supabase
      .from('time_off_requests')
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
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (timeOffResult.error) {
      console.error('Error in initial query:', timeOffResult.error);
      return NextResponse.json(
        {
          error: 'Database query failed',
          details: timeOffResult.error.message,
        },
        { status: 500 }
      );
    }

    const data = timeOffResult.data;

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    const enrichedData = await Promise.all(
      data.map(async (request) => {
        const [sickTimeResult, employeeResult] = await Promise.all([
          supabase.rpc('calculate_available_sick_time', {
            p_emp_id: request.employee_id,
          }),
          supabase
            .from('employees')
            .select('pay_type, hire_date, vacation_time')
            .eq('employee_id', request.employee_id)
            .single(),
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

        const availableSickTime = sickTimeResult.error
          ? 0
          : parseFloat(Number(sickTimeResult.data).toFixed(2));

        return {
          ...request,
          available_sick_time: availableSickTime,
          pay_type: employeeResult.data?.pay_type || 'unknown',
          hire_date: employeeResult.data?.hire_date || null,
          vacation_time: employeeResult.data?.vacation_time || 0,
        };
      })
    );

    return NextResponse.json(enrichedData);
  } catch (err) {
    console.error('Unexpected error in GET handler:', err);
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
