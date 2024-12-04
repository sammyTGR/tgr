import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const url = new URL(request.url);
  const weekStart = url.searchParams.get('weekStart');
  const getLastAssignment = url.searchParams.get('getLastAssignment') === 'true';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }



  

  if (!weekStart && !getLastAssignment) {
    return NextResponse.json({ 
      error: 'Week start date is required' 
    }, { status: 400 });
  }


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
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  // Get current user first
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({
      error: 'Not authenticated'
    }, { status: 401 });
  }

  try {
    const { week_start, employee_id, duty_date, checkSchedule = false } = await request.json();

    // Validate required fields
    if (!week_start || !employee_id || !duty_date) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { week_start, employee_id, duty_date }
      }, { status: 400 });
    }

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
      .insert({ 
        week_start, 
        employee_id, 
        duty_date,
        created_by: user.id,  // Track who created the duty
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Break room duty error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}