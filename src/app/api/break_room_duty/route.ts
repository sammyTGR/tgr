import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const url = new URL(request.url);
  const weekStart = url.searchParams.get('weekStart');
  const getLastAssignment = url.searchParams.get('getLastAssignment') === 'true';

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!weekStart && !getLastAssignment) {
      return NextResponse.json({ error: 'Week start date is required' }, { status: 400 });
    }

    if (getLastAssignment) {
      const { data, error } = await supabase
        .from('break_room_duty')
        .select('employee_id')
        .order('created_at', { ascending: false })
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
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { week_start, employee_id, duty_date, checkSchedule = true } = await request.json();

    // Validate required fields
    if (!week_start || !employee_id || !duty_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all weekdays for the given week
    const weekDates = getWeekDates(duty_date);
    console.log('Week dates:', weekDates);

    // Function to find closest scheduled day to Friday
    const findClosestScheduledDay = async (employeeId: string) => {
      // Get all schedules for this employee for this week
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .in('schedule_date', weekDates)
        .in('status', ['scheduled', 'added_day', 'updated_shift'])
        .order('schedule_date', { ascending: true });

      if (scheduleError) {
        console.error('Schedule error:', scheduleError);
        return null;
      }

      if (!schedules || schedules.length === 0) {
        console.log(`No scheduled days found for employee ${employeeId} this week`);
        return null;
      }

      console.log(`Found ${schedules.length} scheduled days for employee ${employeeId}`);

      // Check if scheduled for Friday first
      const friday = weekDates[4]; // Friday is the 5th day (index 4)
      const fridaySchedule = schedules.find((s) => s.schedule_date === friday);

      if (fridaySchedule) {
        console.log(`Employee ${employeeId} is scheduled for Friday`);
        return friday;
      }

      // If not scheduled Friday, find closest workday
      const workdays = schedules.map((s) => s.schedule_date);
      console.log(`Workdays for employee ${employeeId}:`, workdays);

      // Sort workdays by proximity to Friday
      const fridayDate = new Date(friday);
      const sortedWorkdays = [...workdays].sort((a, b) => {
        const aDate = new Date(a);
        const bDate = new Date(b);

        // Prioritize days before Friday
        const aBeforeFriday = aDate < fridayDate;
        const bBeforeFriday = bDate < fridayDate;

        if (aBeforeFriday && !bBeforeFriday) return -1;
        if (!aBeforeFriday && bBeforeFriday) return 1;
        // If both are on same side of Friday, closest wins
        const aDiff = Math.abs(aDate.getTime() - fridayDate.getTime());
        const bDiff = Math.abs(bDate.getTime() - fridayDate.getTime());
        return aDiff - bDiff;
      });
      const closestDay = sortedWorkdays[0];
      console.log(`Closest workday for employee ${employeeId} is ${closestDay}`);
      return closestDay;
    };

    // Get all eligible employees
    const { data: allEligibleEmployees, error: eligibleError } = await supabase
      .from('employees')
      .select('employee_id, name, department, status')
      .in('department', ['Sales', 'Range'])
      .eq('status', 'active')
      .order('employee_id', { ascending: true });

    if (eligibleError) {
      console.error('Error fetching eligible employees:', eligibleError);
      throw eligibleError;
    }

    // Log all eligible employees for debugging
    console.log(
      'All eligible employees:',
      allEligibleEmployees.map((e) => `${e.name || 'Unknown'} (${e.employee_id})`)
    );

    // Get the last assigned employee
    const { data: lastAssignment, error: lastAssignmentError } = await supabase
      .from('break_room_duty')
      .select('employee_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastAssignmentError) {
      console.error('Error fetching last assignment:', lastAssignmentError);
      throw lastAssignmentError;
    }

    const lastAssignedId =
      lastAssignment && lastAssignment.length > 0 ? lastAssignment[0].employee_id : null;

    console.log('Last assigned employee ID:', lastAssignedId);

    const findNextEligibleEmployee = async () => {
      console.log('=== BREAK ROOM DUTY EMPLOYEE SELECTION ===');

      // Step 1: Get ALL eligible employees with complete details
      const { data: employees, error } = await supabase
        .from('employees')
        .select('employee_id, name, department, status')
        .in('department', ['Sales', 'Range'])
        .eq('status', 'active')
        .order('employee_id');

      if (error || !employees || employees.length === 0) {
        console.error('Error fetching eligible employees:', error);
        return null;
      }

      // Step 2: Log all employees' IDs for debugging
      console.log('All eligible employees (ID order):');
      employees.forEach((emp) => {
        console.log(`${emp.name || 'Unknown'} (ID: ${emp.employee_id})`);
      });

      // Step 3: Get the last assigned employee ID
      const { data: lastAssignment, error: lastAssignmentError } = await supabase
        .from('break_room_duty')
        .select('employee_id')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastAssignedId =
        lastAssignment && lastAssignment.length > 0 ? lastAssignment[0].employee_id : null;

      console.log(`Last assigned employee ID: ${lastAssignedId || 'None'}`);

      // Step 4: Create a rotation array in explicit ID order
      let rotationOrder = [];

      if (!lastAssignedId) {
        // If no last assignment, start from the beginning
        rotationOrder = [...employees];
        console.log('No previous assignment, starting from first employee');
      } else {
        // Find the index of the last assigned employee
        const lastIndex = employees.findIndex((emp) => emp.employee_id == lastAssignedId);
        console.log(`Last assigned employee found at index ${lastIndex}`);

        if (lastIndex === -1) {
          // Employee not found, start from first employee
          rotationOrder = [...employees];
          console.log('Last assigned employee not found in list, starting from beginning');
        } else {
          // Create a rotation array starting AFTER the last assigned employee
          rotationOrder = [
            ...employees.slice(lastIndex + 1), // Everything after last assigned
            ...employees.slice(0, lastIndex), // Everything before last assigned
          ];
          console.log(`Created rotation starting with employee after index ${lastIndex}`);
        }
      }

      // Step 5: Log the rotation order
      console.log('Employee rotation order:');
      rotationOrder.forEach((emp, idx) => {
        console.log(`${idx + 1}. ${emp.name} (ID: ${emp.employee_id})`);
      });

      // Step 6: Check each employee in rotation order
      for (const employee of rotationOrder) {
        console.log(
          `Checking if employee ${employee.name} (ID: ${employee.employee_id}) is scheduled...`
        );

        const dutyDate = await findClosestScheduledDay(employee.employee_id);

        if (dutyDate) {
          console.log(
            `Found scheduled employee: ${employee.name} (ID: ${employee.employee_id}) for ${dutyDate}`
          );
          return {
            employee_id: employee.employee_id,
            duty_date: dutyDate,
          };
        } else {
          console.log(
            `Employee ${employee.name} (ID: ${employee.employee_id}) is not scheduled this week, trying next`
          );
        }
      }

      console.log('No eligible employees are scheduled this week');
      console.log('=== END EMPLOYEE SELECTION ===');
      return null;
    };

    // Determine which employee to assign
    let assigneeId = employee_id;
    let actualDutyDate = duty_date;

    if (checkSchedule) {
      const closestDate = await findClosestScheduledDay(employee_id);

      if (!closestDate) {
        console.log(`Specified employee ${employee_id} not scheduled this week, finding alternate`);

        const nextEmployee = await findNextEligibleEmployee();

        if (!nextEmployee) {
          return NextResponse.json(
            { error: 'No eligible employees scheduled for this week' },
            { status: 400 }
          );
        }

        assigneeId = nextEmployee.employee_id;
        actualDutyDate = nextEmployee.duty_date;

        console.log(`Selected alternate employee ${assigneeId} for duty on ${actualDutyDate}`);
      } else {
        actualDutyDate = closestDate;
        console.log(`Original employee ${employee_id} scheduled for ${actualDutyDate}`);
      }
    }

    // Create the duty assignment
    const { data, error } = await supabase
      .from('break_room_duty')
      .insert({
        week_start,
        employee_id: assigneeId,
        duty_date: actualDutyDate,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log(
      `Successfully created break room duty: Employee ${assigneeId} on ${actualDutyDate}`
    );
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Break room duty error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get all dates in the week
function getWeekDates(fridayDate: string) {
  const friday = new Date(fridayDate);
  const monday = new Date(friday);
  monday.setDate(friday.getDate() - 4);

  const dates = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
