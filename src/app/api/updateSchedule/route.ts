import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const TIME_ZONE = 'America/Los_Angeles';

export async function POST(request: Request) {
  const { employeeId, date, startTime, endTime } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee name first
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('name')
      .eq('employee_id', employeeId)
      .single();

    if (employeeError) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = daysOfWeek[new Date(date + 'T00:00:00').getDay()];

    const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    const { error } = await supabase
      .from('schedules')
      .update({
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        schedule_date: date,
        name: employee.name,
        day_of_week: dayOfWeek,
      })
      .eq('employee_id', employeeId)
      .eq('schedule_date', date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      debug: {
        originalDate: date,
        dayOfWeek,
        timezone: TIME_ZONE,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
