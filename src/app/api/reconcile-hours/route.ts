import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId, eventDate, hoursToReconcile, scheduledHours, calculatedTotalHours } =
      await req.json();

    // console.log("Request data:", {
    //   employeeId,
    //   eventDate,
    //   hoursToReconcile,
    //   scheduledHours,
    //   calculatedTotalHours,
    // });

    // Fetch the current employee data
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('sick_time_used, vacation_time')
      .eq('employee_id', employeeId)
      .single();

    if (employeeError) {
      console.error('Failed to fetch employee data:', employeeError);
      return NextResponse.json({ error: 'Failed to fetch employee data' }, { status: 500 });
    }

    // Update sick time used in the employees table
    const newSickTimeUsed = employeeData.sick_time_used + hoursToReconcile;
    const { error: updateError } = await supabase
      .from('employees')
      .update({ sick_time_used: newSickTimeUsed })
      .eq('employee_id', employeeId);

    if (updateError) {
      console.error('Failed to update sick time:', updateError);
      return NextResponse.json({ error: 'Failed to update sick time' }, { status: 500 });
    }

    // Insert reconciled hours into the reconciled_hours table
    const { error: insertError } = await supabase.from('reconciled_hours').insert({
      employee_id: employeeId,
      event_date: eventDate,
      hours_to_reconcile: hoursToReconcile,
    });

    if (insertError) {
      console.error('Failed to insert reconciled hours:', insertError);
      return NextResponse.json({ error: 'Failed to insert reconciled hours' }, { status: 500 });
    }

    // Calculate new values
    const [hours, minutes] = calculatedTotalHours.split(':').map(Number);
    const totalWorkedHours = hours + minutes / 60;
    const newRegularTime = Math.min(totalWorkedHours, 8);
    const newOvertime = Math.max(totalWorkedHours - 8, 0);
    const newAvailableSickTime = employeeData.vacation_time - newSickTimeUsed;

    // Prepare the response without modifying the employee_clock_events table
    const updatedData = {
      sick_time_usage: hoursToReconcile,
      regular_time: newRegularTime,
      overtime: newOvertime,
      available_sick_time: newAvailableSickTime,
    };

    //console.log("Reconciliation successful. Updated data:", updatedData);
    return NextResponse.json(updatedData);
  } catch (error) {
    console.error('Unexpected error during reconciliation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
