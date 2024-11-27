import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { format, addDays } from "date-fns";

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);
  const weekStart = url.searchParams.get('weekStart');
  const getLastAssignment = url.searchParams.get('getLastAssignment') === 'true';

  if (!weekStart && !getLastAssignment) {
    return NextResponse.json({ error: 'Week start date is required' }, { status: 400 });
  }

  try {
    if (getLastAssignment) {
      const { data, error } = await supabase
        .from('break_room_duty')
        .select('employee_id')
        .order('week_start', { ascending: false })
        .limit(1);

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('break_room_duty')
      .select('*')
      .eq('week_start', weekStart);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const { week_start, employee_id, duty_date, checkSchedule = false } = await request.json();

    if (checkSchedule) {
      // Check if employee is scheduled for the duty date
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('schedule_date', duty_date)
        .in('status', ['scheduled', 'added_day']);

      if (scheduleError) throw scheduleError;

      if (!schedules || schedules.length === 0) {
        return NextResponse.json(
          { error: 'Employee not scheduled for duty date' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('break_room_duty')
      .insert({ week_start, employee_id, duty_date })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}