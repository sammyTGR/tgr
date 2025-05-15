import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { weeks } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const parsedWeeks = parseInt(weeks || '0', 10);
    if (isNaN(parsedWeeks)) {
      return NextResponse.json({ error: 'Invalid weeks parameter' }, { status: 400 });
    }

    // console.log(`Generating schedules for ${parsedWeeks} weeks`);

    // Call the RPC function
    const { data, error } = await supabase.rpc('generate_schedules_for_all_employees', {
      weeks: parsedWeeks,
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    // Verify the schedules were created
    const { data: newSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('*')
      .gte('schedule_date', new Date().toISOString().split('T')[0]);

    if (fetchError) {
      console.error('Error fetching new schedules:', fetchError);
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      schedulesGenerated: newSchedules?.length || 0,
      message: `Successfully generated schedules for ${parsedWeeks} weeks`,
    });
  } catch (error) {
    console.error('Error generating schedules:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate schedules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
