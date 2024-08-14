// src/pages/api/calendar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

interface Employee {
  employee_id: number;
  name: string;
  department: string;
  role: string;
  contact_info: string;
}

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status: string;
  employee_id: number;
}

interface EmployeeCalendar {
  employee_id: number;
  name: string;
  events: CalendarEvent[];
}

export async function getCalendarData(start_date: string, end_date: string): Promise<EmployeeCalendar[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      day_of_week,
      start_time,
      end_time,
      schedule_date,
      status,
      employee:employee_id (
        employee_id,
        name,
        department,
        role,
        contact_info
      )
    `)
    .gte('schedule_date', start_date)
    .lte('schedule_date', end_date)
    .order('employee_id', { ascending: true });

  if (error) {
    console.error("Database query error:", error.message);
    throw new Error(error.message);
  }

  if (!data) {
    console.error("No data returned from the query");
    throw new Error("No data returned");
  }

  const result: EmployeeCalendar[] = data.reduce((acc: EmployeeCalendar[], item: any) => {
    const employee = item.employee;

    if (!employee) {
      return acc; // Skip if no employee is linked
    }

    let empCalendar = acc.find(emp => emp.employee_id === employee.employee_id);
    if (!empCalendar) {
      empCalendar = { employee_id: employee.employee_id, name: employee.name, events: [] };
      acc.push(empCalendar);
    }

    empCalendar.events.push({
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      schedule_date: item.schedule_date,
      status: item.status,
      employee_id: employee.employee_id // Add employee_id here
    });

    return acc;
  }, []);

  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const { start_date, end_date } = req.body;
    // console.log(`Received request with start_date: ${start_date}, end_date: ${end_date}`);
    try {
      const data = await getCalendarData(start_date, end_date);
      res.status(200).json(data);
    } catch (error: any) {
      console.error("Error in handler:", error.message);
      res.status(500).json({ message: 'Failed to fetch calendar data', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
