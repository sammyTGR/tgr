import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { format } from 'date-fns-tz';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('schedules')
      .select(
        `
        schedule_date,
        start_time,
        end_time,
        day_of_week,
        status,
        employee_id,
        employees:employee_id (name, birthday, department, rank, hire_date)
      `
      )
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
