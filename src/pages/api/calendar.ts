// src/pages/api/calendar.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Employee {
    name: string;
    department: string;
    role: string;
    contact_info: string;
}

interface Schedule {
    day_of_week: string;
    start_time: string;
    end_time: string;
    schedule_date: Date | null;
    employee: Employee;
}

interface EmployeeCalendar {
    name: string;
    events: Omit<Schedule, 'employee'>[];
}

export async function getCalendarData(): Promise<EmployeeCalendar[]> {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
            day_of_week,
            start_time,
            end_time,
            schedule_date,
            employee:employee_id (name, department, role, contact_info)
        `);

    console.log("Data fetched from Supabase:", JSON.stringify(data, null, 2));

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error("No data returned");
    }

    const result: EmployeeCalendar[] = data.reduce((acc: EmployeeCalendar[], item: any) => {
        const employee = item.employee;

        if (!employee) {
            return acc; // Skip if no employee is linked
        }

        let empCalendar = acc.find(emp => emp.name === employee.name);
        if (!empCalendar) {
            empCalendar = { name: employee.name, events: [] };
            acc.push(empCalendar);
        }

        empCalendar.events.push({
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            schedule_date: item.schedule_date
        });

        return acc;
    }, []);

    return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('API Route /api/calendar accessed');
    try {
        const data = await getCalendarData();
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Failed to fetch calendar data:', error);
        res.status(500).json({ message: 'Failed to fetch calendar data', error: error.toString() });
    }
}
