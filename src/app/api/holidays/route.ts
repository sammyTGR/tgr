// src/app/api/holidays/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { parseISO } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';

const TIME_ZONE = "America/Los_Angeles";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    
    // Parse and validate request body
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

    console.log('Date conversion:', {
      original: date,
      parsed: parsedDate,
      zoned: zonedDate,
      formatted: formattedDate
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Auth result:', { userId: user?.id, error: userError });
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: userError
      }, { status: 401 });
    }

    // Insert or update holiday with Pacific Time date
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

    console.log('Holiday upsert attempt:', {
      data: holiday,
      error: holidayError
    });

    if (holidayError) {
      console.error('Holiday upsert error:', holidayError);
      return NextResponse.json({
        error: 'Failed to save holiday',
        message: holidayError.message,
        details: holidayError.details,
        code: holidayError.code
      }, { status: 500 });
    }

    // Get active employees
    const { data: activeEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('employee_id')
      .eq('status', 'active');

    if (employeesError) {
      console.warn('Error fetching employees:', employeesError);
    } else if (activeEmployees && activeEmployees.length > 0) {
      // Get the day of week in Pacific Time
      const dayOfWeek = formatTZ(zonedDate, 'EEEE', { timeZone: TIME_ZONE });

      // Update schedules for each active employee
      for (const emp of activeEmployees) {
        const { error: scheduleError } = await supabase
          .from('schedules')
          .upsert({
            employee_id: emp.employee_id,
            schedule_date: formattedDate,
            status: `Custom: Closed For ${name}`,
            notes: `Closed For ${name}`,
            holiday_id: holiday.id,
            day_of_week: dayOfWeek
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
      message: 'Holiday saved successfully'
    });
    
  } catch (error: any) {
    console.error('Unhandled error:', {
      message: error.message,
      stack: error.stack,
      details: error.details,
      code: error.code
    });
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      details: error.details,
      code: error.code
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';