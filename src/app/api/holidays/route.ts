import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const { name, date, is_full_day, repeat_yearly } = await request.json();

    if (!name || !date) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { name, date }
      }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: userError
      }, { status: 401 });
    }

    // Format date
    const utcDate = parseISO(date);
    const pacificDate = toZonedTime(utcDate, timeZone);
    const formattedDate = format(pacificDate, "yyyy-MM-dd");
    
    // Get exact day name from array
    const dayIndex = new Date(formattedDate + "T00:00:00").getDay();
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];

    // Step 1: Insert/Update holiday record
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
      return NextResponse.json({
        error: 'Failed to save holiday',
        details: holidayError
      }, { status: 500 });
    }

    // Step 2: ONLY READ from reference_schedules to get employees scheduled that day
    const { data: employeesWithSchedules, error: refScheduleError } = await supabase
      .from('reference_schedules')
      .select('employee_id')
      .eq('day_of_week', dayOfWeek)
      .not('start_time', 'is', null)
      .not('end_time', 'is', null);

    if (refScheduleError) {
      console.error('Error fetching reference schedules:', refScheduleError);
      return NextResponse.json({ error: refScheduleError.message }, { status: 500 });
    }

    if (employeesWithSchedules && employeesWithSchedules.length > 0) {
      const scheduledIds = employeesWithSchedules.map(emp => emp.employee_id);

      // Get only active employees from those scheduled
      const { data: activeEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('status', 'active')
        .in('employee_id', scheduledIds);

      if (employeesError) {
        console.error('Error fetching active employees:', employeesError);
        return NextResponse.json({ error: employeesError.message }, { status: 500 });
      }

      // Process each active employee
      for (const emp of (activeEmployees || [])) {
        // Check if schedule exists
        const { data: existingSchedule, error: scheduleCheckError } = await supabase
          .from('schedules')
          .select('schedule_id')
          .eq('employee_id', emp.employee_id)
          .eq('schedule_date', formattedDate)
          .single();

        if (scheduleCheckError && scheduleCheckError.code !== 'PGRST116') {
          console.error('Error checking schedule:', scheduleCheckError);
          continue;
        }

        if (existingSchedule) {
          // Update ONLY holiday-related fields
          const { error: updateError } = await supabase
            .from('schedules')
            .update({
              status: `Custom: Closed For ${name}`,
              notes: `Closed For ${name}`,
              holiday_id: holiday.id
            })
            .eq('schedule_id', existingSchedule.schedule_id);

          if (updateError) {
            console.error('Error updating schedule:', updateError);
          }
        } else {
          // Insert new schedule with ONLY necessary fields
          const { error: insertError } = await supabase
            .from('schedules')
            .insert({
              employee_id: emp.employee_id,
              schedule_date: formattedDate,
              day_of_week: DAYS_OF_WEEK[dayIndex],
              status: `Custom: Closed For ${name}`,
              notes: `Closed For ${name}`,
              holiday_id: holiday.id
            });

          if (insertError) {
            console.error('Error inserting schedule:', insertError);
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Holiday saved successfully',
      data: holiday
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

export const dynamic = 'force-dynamic';