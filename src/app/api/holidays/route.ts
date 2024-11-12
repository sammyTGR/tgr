// src/app/api/holidays/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { parseISO } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';

const TIME_ZONE = "America/Los_Angeles";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    
    const body = await req.json();
    console.log('Received request body:', body);
    
    const { name, date, is_full_day, repeat_yearly } = body;
    
    if (!name || !date) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { name, date }
      }, { status: 400 });
    }

    // Convert the date to Pacific Time
    const parsedDate = parseISO(date);
    const zonedDate = toZonedTime(parsedDate, TIME_ZONE);
    const formattedDate = formatTZ(zonedDate, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
    
    // Get the day of week for the holiday
    const holidayDayOfWeek = formatTZ(zonedDate, 'EEEE', { timeZone: TIME_ZONE });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: userError
      }, { status: 401 });
    }

    // Insert or update holiday
    const { data: holiday, error: holidayError } = await supabase
      .from('holidays')
      .upsert(
        {
          name,
          date: formattedDate,
          is_full_day,
          repeat_yearly,
          created_by: user.id,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'date'
        }
      )
      .select()
      .single();

    if (holidayError) {
      console.error('Holiday upsert error:', holidayError);
      return NextResponse.json({
        error: 'Failed to save holiday',
        details: holidayError
      }, { status: 500 });
    }

    // Get employees who are scheduled to work on this day of week from reference_schedules
    const { data: scheduledEmployees, error: scheduledError } = await supabase
      .from('reference_schedules')
      .select(`
        employee_id,
        start_time,
        end_time,
        employees!inner (
          employee_id,
          status
        )
      `)
      .eq('day_of_week', holidayDayOfWeek)
      .eq('employees.status', 'active');

    if (scheduledError) {
      console.warn('Error fetching scheduled employees:', scheduledError);
      return NextResponse.json({
        error: 'Failed to fetch scheduled employees',
        details: scheduledError
      }, { status: 500 });
    }

    console.log('Scheduled employees for', holidayDayOfWeek, ':', scheduledEmployees);

    // Update schedules only for employees who are scheduled on this day
    if (scheduledEmployees && scheduledEmployees.length > 0) {
      for (const emp of scheduledEmployees) {
        const { error: scheduleError } = await supabase
          .from('schedules')
          .upsert({
            employee_id: emp.employee_id,
            schedule_date: formattedDate,
            status: `Custom: Closed For ${name}`,
            notes: `Closed For ${name}`,
            holiday_id: holiday.id,
            // Use the employee's regular scheduled times
            start_time: emp.start_time,
            end_time: emp.end_time
          }, {
            onConflict: 'employee_id,schedule_date'
          });

        if (scheduleError) {
          console.warn(`Failed to update schedule for employee ${emp.employee_id}:`, scheduleError);
        }
      }
    }

    return NextResponse.json({
      data: holiday,
      message: 'Holiday saved successfully',
      affectedEmployees: scheduledEmployees?.length || 0
    });
    
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';