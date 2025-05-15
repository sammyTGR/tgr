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
    const parsedWeeks = parseInt(weeks || '1', 10);
    if (isNaN(parsedWeeks) || parsedWeeks < 1) {
      return NextResponse.json(
        { error: 'Invalid weeks parameter. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc('generate_all_schedules', {
      weeks: parsedWeeks,
    });

    if (error) throw error;

    // The RPC function returns an array with one object containing schedules_created and employees_processed
    const result = data[0];

    return NextResponse.json({
      success: true,
      schedulesGenerated: result.schedules_created,
      employeesProcessed: result.employees_processed,
      message: `Successfully generated ${result.schedules_created} schedules for ${result.employees_processed} employees`,
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
