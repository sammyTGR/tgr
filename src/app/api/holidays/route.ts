import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { parseISO } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Define the schedule data type
interface ScheduleData {
  employee_id: number;
  schedule_date: string;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  holiday_id: number;
  status?: string | null;
  notes?: string | null;
}

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

    // Format date and get day of week
    const utcDate = parseISO(date);
    const pacificDate = toZonedTime(utcDate, timeZone);
    const formattedDate = format(pacificDate, "yyyy-MM-dd");
    const dayOfWeek = format(pacificDate, 'EEEE').trim();

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
        { onConflict: 'date' }
      )
      .select()
      .single();

    if (holidayError) {
      return NextResponse.json({
        error: 'Failed to save holiday',
        details: holidayError
      }, { status: 500 });
    }

    // Step 2: Get all reference schedules for this day (including those with null times)
    const { data: referenceSchedules, error: refScheduleError } = await supabase
      .from('reference_schedules')
      .select('employee_id, start_time, end_time')
      .eq('day_of_week', dayOfWeek);

    if (refScheduleError) {
      console.error('Error fetching reference schedules:', refScheduleError);
      return NextResponse.json({ error: refScheduleError.message }, { status: 500 });
    }

    if (referenceSchedules && referenceSchedules.length > 0) {
      // Get all active employees with their rank information
      const { data: activeEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('employee_id, rank')
        .eq('status', 'active')
        .in('employee_id', referenceSchedules.map(s => s.employee_id));

      if (employeesError) {
        console.error('Error fetching active employees:', employeesError);
        return NextResponse.json({ error: employeesError.message }, { status: 500 });
      }

      // Process each active employee
      for (const emp of (activeEmployees || [])) {
        const refSchedule = referenceSchedules.find(
          ref => ref.employee_id === emp.employee_id
        );

        if (!refSchedule) continue;

        // Create schedule data object with proper typing
        const scheduleData: ScheduleData = {
          employee_id: emp.employee_id,
          schedule_date: formattedDate,
          day_of_week: dayOfWeek,
          start_time: refSchedule.start_time,
          end_time: refSchedule.end_time,
          holiday_id: holiday.id,
          status: undefined,  // Initialize these as undefined
          notes: undefined
        };

        // Check if employee has valid times and rank
        const hasValidTimes = refSchedule.start_time && 
                            refSchedule.end_time && 
                            refSchedule.start_time.trim() !== '' && 
                            refSchedule.end_time.trim() !== '';
                            
        if (hasValidTimes && emp.rank !== null && emp.rank !== undefined) {
          // Employee has valid times and rank - set holiday status
          scheduleData.status = `Custom: Closed For ${name}`;
          scheduleData.notes = `Closed For ${name}`;
        } else {
          // Employee either has no valid times or no rank - set to not scheduled
          scheduleData.status = 'not scheduled';
          scheduleData.notes = null;
        }

        // Upsert the schedule
        const { error: scheduleError } = await supabase
          .from('schedules')
          .upsert(scheduleData, {
            onConflict: 'employee_id,schedule_date'
          });

        if (scheduleError) {
          console.error('Error upserting schedule:', scheduleError);
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